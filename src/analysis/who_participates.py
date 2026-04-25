import os
import numpy as np
import pandas as pd
import statsmodels.api as sm
from sklearn.preprocessing import StandardScaler
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()


def sig_stars(p: float) -> str:
    if p < 0.01:
        return "***"
    if p < 0.05:
        return "**"
    if p < 0.10:
        return "*"
    return ""


def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)

    os.makedirs("report/data", exist_ok=True)
    os.makedirs("figures", exist_ok=True)

    print("Extracting data for Participation Analysis...")

    query = """
    SELECT
        r.respondent_id,
        r.is_investor,
        r.survey_weight,
        p.gender,
        p.education_years,
        p.life_stage,
        p.monthly_income_rs,
        g.is_urban,
        g.zone,
        lr.risk_tolerance_preference,
        a.n_products_aware
    FROM respondents r
    LEFT JOIN respondent_profile p ON r.respondent_id = p.respondent_id
    LEFT JOIN respondent_geography g ON r.respondent_id = g.respondent_id
    LEFT JOIN respondent_literacy_risk lr ON r.respondent_id = lr.respondent_id
    LEFT JOIN respondent_awareness a ON r.respondent_id = a.respondent_id
    """

    df = pd.read_sql(query, engine)

    # --- 1. Descriptive Statistics ---
    print("Computing descriptive statistics...")
    desc_stats = []

    for col in ["gender", "life_stage", "is_urban", "zone", "risk_tolerance_preference"]:
        grouped = df.groupby(col)["is_investor"].agg(["mean", "count"]).reset_index()
        grouped["characteristic"] = col
        grouped.rename(
            columns={col: "category", "mean": "participation_rate", "count": "sample_size"},
            inplace=True,
        )
        desc_stats.append(grouped[["characteristic", "category", "participation_rate", "sample_size"]])

    df["income_bucket"] = pd.qcut(df["monthly_income_rs"], q=5, duplicates="drop")
    inc_grouped = df.groupby("income_bucket")["is_investor"].agg(["mean", "count"]).reset_index()
    inc_grouped["characteristic"] = "income_quintile"
    inc_grouped.rename(
        columns={"income_bucket": "category", "mean": "participation_rate", "count": "sample_size"},
        inplace=True,
    )
    inc_grouped["category"] = inc_grouped["category"].astype(str)
    desc_stats.append(inc_grouped[["characteristic", "category", "participation_rate", "sample_size"]])

    final_desc = pd.concat(desc_stats, ignore_index=True)
    final_desc.to_csv("report/data/who_participates_descriptive.csv", index=False)
    print("Descriptive stats saved to report/data/who_participates_descriptive.csv")

    # --- 2. Logistic Regression with Significance Testing ---
    print("Running weighted logistic regression (statsmodels, HC3 robust SEs)...")

    model_df = df.dropna(
        subset=["education_years", "monthly_income_rs", "is_urban", "risk_tolerance_preference", "gender", "life_stage", "zone", "n_products_aware"]
    ).copy()

    model_df["log_income"] = np.log1p(model_df["monthly_income_rs"])
    model_df["is_urban"] = model_df["is_urban"].astype(int)
    model_df["gender_male"] = (model_df["gender"] == 1).astype(int)

    # Life stage dummies (Gen Z = 1 is reference)
    model_df["lifestage_millennial"] = (model_df["life_stage"] == 2).astype(int)
    model_df["lifestage_genx"]       = (model_df["life_stage"] == 3).astype(int)
    model_df["lifestage_boomer"]     = (model_df["life_stage"] == 4).astype(int)

    # Zone dummies (EAST is reference)
    model_df["zone_north"] = (model_df["zone"] == "NORTH").astype(int)
    model_df["zone_south"] = (model_df["zone"] == "SOUTH").astype(int)
    model_df["zone_west"]  = (model_df["zone"] == "WEST").astype(int)

    feature_cols = [
        "education_years", "log_income", "is_urban", "gender_male", "risk_tolerance_preference",
        "n_products_aware",
        "lifestage_millennial", "lifestage_genx", "lifestage_boomer",
        "zone_north", "zone_south", "zone_west",
    ]

    X_raw = model_df[feature_cols]
    y = model_df["is_investor"].astype(int)
    weights = model_df["survey_weight"]

    # Standardise so coefficients are comparable in magnitude (1 SD units)
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(X_raw), columns=feature_cols)
    X_with_const = sm.add_constant(X_scaled)

    # Weighted logistic regression via GLM Binomial + HC3 robust covariance
    glm = sm.GLM(
        y.values,
        X_with_const.values,
        family=sm.families.Binomial(),
        var_weights=weights.values,
    )
    result = glm.fit(cov_type="HC3")

    print(result.summary())

    mcfadden_r2 = 1 - (result.deviance / result.null_deviance)
    print(f"\nMcFadden pseudo-R²: {mcfadden_r2:.4f}")
    print(f"Null deviance:      {result.null_deviance:.2f}")
    print(f"Model deviance:     {result.deviance:.2f}")
    print(f"Log-likelihood:     {result.llf:.2f}")
    print(f"N (model):          {int(result.nobs)}")

    # Extract per-feature results (drop intercept)
    idx = X_with_const.columns.tolist()
    feature_names = [c for c in idx if c != "const"]
    feature_pos = [idx.index(f) for f in feature_names]

    params = result.params[feature_pos]
    bse = result.bse[feature_pos]
    zvals = result.tvalues[feature_pos]
    pvals = result.pvalues[feature_pos]
    ci = result.conf_int()[feature_pos, :]

    coef_df = pd.DataFrame(
        {
            "Feature": feature_names,
            "Coefficient": params,
            "Std_Error_HC3": bse,
            "Z_Stat": zvals,
            "P_Value": pvals,
            "CI_Lower_95": ci[:, 0],
            "CI_Upper_95": ci[:, 1],
            "Odds Ratio": np.exp(params),
            "OR_CI_Lower": np.exp(ci[:, 0]),
            "OR_CI_Upper": np.exp(ci[:, 1]),
            "Significance": [sig_stars(p) for p in pvals],
        }
    ).sort_values("Odds Ratio", ascending=False)

    coef_df.to_csv("report/data/who_participates_logistic_regression.csv", index=False)
    print("Logistic regression results saved to report/data/who_participates_logistic_regression.csv")
    print("\nRegression summary:")
    print(coef_df[["Feature", "Odds Ratio", "OR_CI_Lower", "OR_CI_Upper", "P_Value", "Significance"]].to_string(index=False))

    # --- 3. Barriers Analysis ---
    print("\nAnalyzing barriers for non-investors...")
    df_barriers = pd.read_sql("SELECT * FROM respondent_barriers", engine)

    barrier_cols = [c for c in df_barriers.columns if c.startswith("barrier_")]
    barrier_counts = df_barriers[barrier_cols].sum().reset_index()
    barrier_counts.columns = ["Barrier", "Count"]

    # Denominator: non-investors who answered SS_BB2 (at least one barrier cited)
    n_answered_barriers = int(df_barriers[barrier_cols].any(axis=1).sum())
    barrier_counts["Percentage_of_NonInvestors"] = (barrier_counts["Count"] / n_answered_barriers) * 100
    barrier_counts = barrier_counts.sort_values("Count", ascending=False)

    barrier_counts.to_csv("report/data/who_participates_barriers.csv", index=False)
    print(f"Barriers saved (denominator = {n_answered_barriers:,} non-investors who cited barriers)")


if __name__ == "__main__":
    main()
