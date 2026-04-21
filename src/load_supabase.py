import os
import re
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

DATA_DIR = Path(__file__).parent.parent / "data"
SEBI_DIR = DATA_DIR / "sebi"
CENSUS_DIR = DATA_DIR / "census"

client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

CHUNK = 500


def snake(col: str) -> str:
    col = re.sub(r"\(UOM:[^)]*\),?\s*Scaling Factor:\d+", "", col, flags=re.IGNORECASE)
    col = re.sub(r"[^a-zA-Z0-9]", "_", col.strip())
    col = re.sub(r"_+", "_", col).strip("_").lower()
    return col


def load(table: str, df: pd.DataFrame) -> None:
    df.columns = [snake(c) for c in df.columns]
    df = df.where(pd.notna(df), None)
    rows = df.to_dict(orient="records")

    client.table(table).delete().gte("id", 0).execute()

    for i in range(0, len(rows), CHUNK):
        client.table(table).insert(rows[i : i + CHUNK]).execute()

    print(f"  {table}: {len(rows)} rows")


def load_csv(table: str, path: Path) -> None:
    df = pd.read_csv(path, encoding="utf-8-sig", low_memory=False)
    df.columns = [c.replace("\xa0", " ").strip() for c in df.columns]
    load(table, df)


def run() -> None:
    print("Loading SEBI survey tables...")

    sebi_files = {
        "sebi_tenure":              "01_education_investment_instrument_choice_urban_copy_1.csv",
        "sebi_savings_urban":       "04_total_savings_urban_household_pct_annual_income.csv",
        "sebi_income_instrument":   "05_urban_investment_instrument_choice_by_income.csv",
        "sebi_info_sources":        "06_information_sources_market_participants.csv",
        "sebi_risk_return":         "07_perceived_risk_return_time_horizon.csv",
        "sebi_risk_mitigation":     "08_risk_mitigation_process_urban_investors.csv",
        "sebi_motivations":         "09_reasons_for_clients_to_invest_securities_markets.csv",
        "sebi_barriers":            "10_reasons_for_low_participation_securities_markets.csv",
        "sebi_investor_education":  "11_investor_education_program_participation_tabulation.csv",
        "sebi_debt_by_income":      "12_total_urban_debt_pct_annual_income_by_income_band.csv",
        "sebi_occupation":          "14_urban_investors_by_occupation.csv",
        "sebi_awareness":           "15_urban_household_awareness_investment_instruments.csv",
        "sebi_ipo_holding":         "16_holding_period_equities_purchased_via_ipo.csv",
        "sebi_zone_instruments":    "17_urban_zone_investors_and_instruments_used.csv",
        "sebi_mf_holding":          "18_mutual_fund_holding_duration.csv",
        "sebi_years_participating": "19_years_participating_securities_markets_urban_investor.csv",
    }

    for table, filename in sebi_files.items():
        load_csv(table, SEBI_DIR / filename)

    print("\nLoading education tables...")
    load_csv("sebi_education_participation", SEBI_DIR / "education_participation.csv")
    load_csv("sebi_education_instrument", SEBI_DIR / "education_instrument_choice.csv")

    print("\nLoading state layer...")
    load_csv("state_layer", DATA_DIR / "state_layer.csv")

    print("\nLoading savings instruments...")
    load_csv("savings_instruments_urban", SEBI_DIR / "savings_instruments_all_urban.csv")

    print("\nLoading census district table...")
    df = pd.read_csv(CENSUS_DIR / "district_census_consolidated.csv", low_memory=False)
    df = df.drop(columns=["pincodes"], errors="ignore")
    load("census_districts", df)

    print("\nAll done.")


if __name__ == "__main__":
    run()
