import os
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()


def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)
    os.makedirs("report/data", exist_ok=True)

    print("Extracting IEP analysis data...")

    query = """
    SELECT
        r.respondent_id,
        r.is_investor,
        i.info_iep_providers,
        k.knows_direct_mf_lower_expense,
        k.knows_pension_invests_equity,
        k.knows_compounding_longterm,
        k.knows_kyc_online,
        k.knows_demat_needed,
        k.knows_high_return_high_risk,
        k.knows_diversification_reduces,
        k.knows_cas_overview,
        k.knows_bsda_basic_demat,
        h.holds_mf_etf,
        h.holds_equity_shares,
        h.holds_fd_rd,
        h.holds_derivatives_fo,
        h.holds_ulip,
        m.motive_long_term_growth,
        m.motive_quick_gains,
        m.motive_higher_returns,
        m.motive_financial_goals,
        a.n_products_aware,
        lr.risk_tolerance_preference
    FROM respondents r
    LEFT JOIN respondent_info_sources i ON r.respondent_id = i.respondent_id
    LEFT JOIN respondent_knowledge k ON r.respondent_id = k.respondent_id
    LEFT JOIN respondent_holdings h ON r.respondent_id = h.respondent_id
    LEFT JOIN respondent_motivations m ON r.respondent_id = m.respondent_id
    LEFT JOIN respondent_awareness a ON r.respondent_id = a.respondent_id
    LEFT JOIN respondent_literacy_risk lr ON r.respondent_id = lr.respondent_id
    WHERE r.is_investor = True
    """

    df = pd.read_sql(query, engine)

    know_cols = [c for c in df.columns if c.startswith("knows_")]
    df["knowledge_score"] = (df[know_cols] == 1).sum(axis=1)

    df["iep_exposed"] = df["info_iep_providers"].fillna(False).astype(bool)

    iep = df[df["iep_exposed"]]
    non_iep = df[~df["iep_exposed"]]

    print(f"IEP-exposed investors:     {len(iep):,}")
    print(f"Non-IEP investors:         {len(non_iep):,}")

    # --- 1. Knowledge score comparison ---
    results = {
        "Group": ["IEP-Exposed", "Non-IEP"],
        "N": [len(iep), len(non_iep)],
        "Mean_Knowledge_Score": [iep["knowledge_score"].mean(), non_iep["knowledge_score"].mean()],
        "Mean_Products_Aware": [iep["n_products_aware"].mean(), non_iep["n_products_aware"].mean()],
        "Mean_Risk_Tolerance": [iep["risk_tolerance_preference"].mean(), non_iep["risk_tolerance_preference"].mean()],
    }

    # --- 2. Holdings penetration ---
    for col in ["holds_mf_etf", "holds_equity_shares", "holds_fd_rd", "holds_derivatives_fo", "holds_ulip"]:
        results[col] = [
            iep[col].fillna(False).mean() * 100,
            non_iep[col].fillna(False).mean() * 100,
        ]

    # --- 3. Motivations ---
    for col in ["motive_long_term_growth", "motive_quick_gains", "motive_higher_returns", "motive_financial_goals"]:
        results[col] = [
            iep[col].fillna(False).mean() * 100,
            non_iep[col].fillna(False).mean() * 100,
        ]

    out = pd.DataFrame(results)
    out.to_csv("report/data/iep_analysis.csv", index=False)
    print("\nIEP analysis summary:")
    print(out.to_string(index=False))
    print("\nSaved to report/data/iep_analysis.csv")


if __name__ == "__main__":
    main()
