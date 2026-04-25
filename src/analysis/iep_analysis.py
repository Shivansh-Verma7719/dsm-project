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
        i.info_friends_family,
        i.info_social_media_influencers,
        i.info_financial_professionals,
        i.info_educational_resources,
        i.info_online_communities,
        i.info_news_blogs,
        i.info_research_reports,
        i.info_sebi_official_websites,
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

    # Two comparison groups:
    # - non_iep_all: all non-IEP investors (for knowledge/awareness/holdings — no routing bias)
    # - non_iep_ss_b3: only investors who answered the info-source question (for motivations)
    info_cols = [c for c in df.columns if c.startswith("info_")]
    df_ss_b3 = df[df[info_cols].any(axis=1)].copy()

    iep = df_ss_b3[df_ss_b3["iep_exposed"]]
    non_iep_all = df[~df["iep_exposed"]]
    non_iep_ss_b3 = df_ss_b3[~df_ss_b3["iep_exposed"]]

    print(f"IEP-exposed investors:        {len(iep):,}")
    print(f"Non-IEP all investors:        {len(non_iep_all):,}")
    print(f"Non-IEP SS_B3 investors:      {len(non_iep_ss_b3):,}")

    # --- 1. Knowledge / awareness / risk — use full non-IEP population ---
    results = {
        "Group": ["IEP-Exposed", "Non-IEP (all)", "Non-IEP (info-active)"],
        "N": [len(iep), len(non_iep_all), len(non_iep_ss_b3)],
        "Mean_Knowledge_Score": [iep["knowledge_score"].mean(), non_iep_all["knowledge_score"].mean(), non_iep_ss_b3["knowledge_score"].mean()],
        "Mean_Products_Aware": [iep["n_products_aware"].mean(), non_iep_all["n_products_aware"].mean(), non_iep_ss_b3["n_products_aware"].mean()],
        "Mean_Risk_Tolerance": [iep["risk_tolerance_preference"].mean(), non_iep_all["risk_tolerance_preference"].mean(), non_iep_ss_b3["risk_tolerance_preference"].mean()],
    }

    # --- 2. Holdings — use full non-IEP population ---
    for col in ["holds_mf_etf", "holds_equity_shares", "holds_fd_rd", "holds_derivatives_fo", "holds_ulip"]:
        results[col] = [
            iep[col].fillna(False).mean() * 100,
            non_iep_all[col].fillna(False).mean() * 100,
            non_iep_ss_b3[col].fillna(False).mean() * 100,
        ]

    # --- 3. Motivations — use SS_B3 non-IEP only (avoids non-answerer dilution) ---
    for col in ["motive_long_term_growth", "motive_quick_gains", "motive_higher_returns", "motive_financial_goals"]:
        results[col] = [
            iep[col].fillna(False).mean() * 100,
            non_iep_all[col].fillna(False).mean() * 100,
            non_iep_ss_b3[col].fillna(False).mean() * 100,
        ]

    out = pd.DataFrame(results)
    out.to_csv("report/data/iep_analysis.csv", index=False)
    print("\nIEP analysis summary:")
    print(out.to_string(index=False))
    print("\nSaved to report/data/iep_analysis.csv")


if __name__ == "__main__":
    main()
