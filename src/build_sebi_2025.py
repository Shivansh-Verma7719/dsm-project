"""
Aggregate 2025 SEBI microdata (Respondent Data.XLSX) into CSVs
that mirror the 2015 SEBI cross-tabulation format for direct comparison.

Output: data/sebi/2025/*.csv
"""
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).parent.parent / "data"
RAW_XLSX = DATA_DIR / "Respondent Data.XLSX"
OUT_DIR = DATA_DIR / "sebi" / "2025"
OUT_DIR.mkdir(parents=True, exist_ok=True)

YEAR = "2025"

# ── Education bucket mapping (2025 labels → 2015 buckets) ─────────────────────
EDU_MAP = {
    "Illiterate":                                                      "Not Literate",
    "School - upto 4 years":                                           "Not Literate",
    "School - 5 to 9 years":                                           "Primary",
    "10th Grade / Secondary Board (e.g., SSC/CBSE/ICSE)":             "Secondary",
    "12th Grade / Higher Secondary Board (e.g., HSC/ISC)":            "Higher Secondary",
    "Some College (incl. a Diploma but not Grad.)":                    "Higher Secondary",
    "Graduate: General – (e.g. – BA/BCom/BSc)":            "Graduate and Above",
    "Graduate: Professional (e.g. – B.Tech/MBBS/LLB/BBA/B.Arch./B.Ed.)": "Graduate and Above",
    "Postgraduate: General – (e.g. – MA/MCom/MSc)":        "Graduate and Above",
    "Postgraduate: Professional (e.g. – MBA/PGDM/M.Tech./LL.M./M.D./M.S./MCA./M.Ed.)": "Graduate and Above",
}

EDU_ORDER = ["Not Literate", "Primary", "Secondary", "Higher Secondary", "Graduate and Above"]
EDU_YRS   = {"Not Literate": "0", "Primary": "1-7", "Secondary": "8-10",
              "Higher Secondary": "11-15", "Graduate and Above": ">15"}

# ── Income bucket mapping (2025 → 2015 bands) ─────────────────────────────────
INC_MAP = {
    "Rs. 5,001 – Rs. 10,000":     "Less than 20,000",
    "Rs.10,001 – Rs. 15,000":     "Less than 20,000",
    "Rs.15,001 – Rs. 20,000":     "Less than 20,000",
    "Rs.20,001 – Rs. 30,000":     "20,000 to 50,000",
    "Rs.30,001 – Rs. 40,000":     "20,000 to 50,000",
    "Rs.40,001 – Rs. 50,000":     "20,000 to 50,000",
    "Rs.50,001 – Rs. 60,000":     "50,000 to 1 lakh",
    "Rs.60,001 – Rs. 80,000":     "50,000 to 1 lakh",
    "Rs.80,001 – Rs. 1,00,000":   "50,000 to 1 lakh",
    "Above Rs. 1,00,000":              "Above 1 lakh",
}

# Instrument label normalisation
INSTR_NORM = {
    "Mutual Funds (One-time Lumpsum / SIP)": "Mutual Fund Investor",
    "MF_ETF":                                "Mutual Fund Investor",
    "Stocks / Shares":                       "Equity Investor",
    "Futures & Options (F&O)":               "Equity Investor",
    "Corporate Bonds":                       "Debt Investor",
}


def load_raw() -> pd.DataFrame:
    df = pd.read_excel(RAW_XLSX, engine="openpyxl")
    # Drop the header-as-row artefact (first data row contains column labels)
    df = df[df["QFL"].isin(["INVESTOR", "NON-INVESTOR"])].copy()
    df = df.reset_index(drop=True)
    return df


def explode_multi(series: pd.Series) -> pd.Series:
    """Explode comma-separated multi-coded cells into one value per row."""
    return series.dropna().str.split(",").explode().str.strip()


# ── 1. education_participation_2025.csv ───────────────────────────────────────
def build_education_participation(df: pd.DataFrame) -> None:
    d = df[["Q3D", "QFL"]].copy()
    d["edu_bucket"] = d["Q3D"].map(EDU_MAP)
    d = d.dropna(subset=["edu_bucket"])
    grp = d.groupby("edu_bucket")
    total = grp["QFL"].count()
    investors = grp["QFL"].apply(lambda x: (x == "INVESTOR").sum())
    out = pd.DataFrame({
        "education_level": EDU_ORDER,
        "years_schooling": [EDU_YRS[e] for e in EDU_ORDER],
        "pct_who_invest": [round(investors.get(e, 0) / total.get(e, 1) * 100, 1)
                           for e in EDU_ORDER],
    })
    out.to_csv(OUT_DIR / "education_participation_2025.csv", index=False)
    print(f"  education_participation_2025.csv ({len(out)} rows)")


# ── 2. education_instrument_choice_2025.csv ───────────────────────────────────
def build_education_instrument(df: pd.DataFrame) -> None:
    investors = df[df["QFL"] == "INVESTOR"][["Q3D", "Q22A_All"]].copy()
    investors["edu_bucket"] = investors["Q3D"].map(EDU_MAP)
    investors = investors.dropna(subset=["edu_bucket", "Q22A_All"])

    rows = []
    for edu in EDU_ORDER:
        sub = investors[investors["edu_bucket"] == edu]
        n = len(sub)
        if n == 0:
            continue
        holdings = explode_multi(sub["Q22A_All"])
        mf  = holdings.str.contains("Mutual Fund|MF_ETF", case=False).sum()
        eq  = holdings.str.contains("Stocks|Futures", case=False).sum()
        dbt = holdings.str.contains("Bond|Debenture", case=False).sum()
        rows.append({
            "education_level": edu,
            "years_schooling": EDU_YRS[edu],
            "mf_pct":     round(mf  / n * 100, 1),
            "equity_pct": round(eq  / n * 100, 1),
            "debt_pct":   round(dbt / n * 100, 1),
            "n_investors": n,
        })
    out = pd.DataFrame(rows)
    out.to_csv(OUT_DIR / "education_instrument_choice_2025.csv", index=False)
    print(f"  education_instrument_choice_2025.csv ({len(out)} rows)")


# ── 3. 05_income_instrument_2025.csv ─────────────────────────────────────────
def build_income_instrument(df: pd.DataFrame) -> None:
    investors = df[df["QFL"] == "INVESTOR"][["Q10", "Q22A_All"]].copy()
    investors["income_band"] = investors["Q10"].map(INC_MAP)
    investors = investors.dropna(subset=["income_band", "Q22A_All"])

    bands = ["Less than 20,000", "20,000 to 50,000", "50,000 to 1 lakh", "Above 1 lakh"]
    rows = []
    for band in bands:
        sub = investors[investors["income_band"] == band]
        n_total = len(sub)
        holdings = explode_multi(sub["Q22A_All"])
        mf  = holdings.str.contains("Mutual Fund|MF_ETF", case=False).sum()
        eq  = holdings.str.contains("Stocks|Futures", case=False).sum()
        dbt = holdings.str.contains("Bond|Debenture", case=False).sum()
        rows.append({"country": "India", "year": YEAR, "investor_type": "Mutual Fund Investor",
                     "range": "", "income_range": band, "n_investors": mf,
                     "pct_of_total": round(mf / n_total * 100, 1) if n_total else 0})
        rows.append({"country": "India", "year": YEAR, "investor_type": "Equity Investor",
                     "range": "", "income_range": band, "n_investors": eq,
                     "pct_of_total": round(eq / n_total * 100, 1) if n_total else 0})
        rows.append({"country": "India", "year": YEAR, "investor_type": "Debt Investor",
                     "range": "", "income_range": band, "n_investors": dbt,
                     "pct_of_total": round(dbt / n_total * 100, 1) if n_total else 0})
        rows.append({"country": "India", "year": YEAR, "investor_type": "Total Investors",
                     "range": "", "income_range": band, "n_investors": n_total,
                     "pct_of_total": 100.0})
    out = pd.DataFrame(rows)
    out.to_csv(OUT_DIR / "05_income_instrument_2025.csv", index=False)
    print(f"  05_income_instrument_2025.csv ({len(out)} rows)")


# ── 4. 14_occupation_2025.csv ─────────────────────────────────────────────────
def build_occupation(df: pd.DataFrame) -> None:
    d = df[["Q14", "QFL"]].copy().dropna(subset=["Q14"])
    grp = d.groupby("Q14")
    total = grp["QFL"].count()
    investors = grp["QFL"].apply(lambda x: (x == "INVESTOR").sum())
    out = pd.DataFrame({
        "country": "India", "year": YEAR,
        "occupation": total.index,
        "pct_non_investor": ((1 - investors / total) * 100).round(1).values,
        "pct_investor":     (investors / total * 100).round(1).values,
    }).sort_values("pct_investor", ascending=False)
    out.to_csv(OUT_DIR / "14_occupation_2025.csv", index=False)
    print(f"  14_occupation_2025.csv ({len(out)} rows)")


# ── 5. 15_awareness_2025.csv ─────────────────────────────────────────────────
def build_awareness(df: pd.DataFrame) -> None:
    instruments = [
        "Mutual Funds (One-time Lumpsum / SIP)", "Stocks / Shares",
        "Corporate Bonds", "Futures & Options (F&O)", "Chit Fund",
    ]
    groups = {
        "Investor Awareness":     df[df["QFL"] == "INVESTOR"],
        "Non - Investor Awareness": df[df["QFL"] == "NON-INVESTOR"],
        "Awareness":              df,
    }
    rows = []
    for grp_name, sub in groups.items():
        n = len(sub)
        row = {"country": "India", "year": YEAR, "group": grp_name}
        aware = explode_multi(sub["Q21A"])
        for instr in instruments:
            short = instr.split("(")[0].strip()[:8].lower().replace(" ", "_").replace("/", "_")
            row[short] = round(aware.str.contains(instr, regex=False).sum() / n * 100, 1)
        rows.append(row)
    out = pd.DataFrame(rows)
    out.to_csv(OUT_DIR / "15_awareness_2025.csv", index=False)
    print(f"  15_awareness_2025.csv ({len(out)} rows)")


# ── 6. 10_barriers_2025.csv ───────────────────────────────────────────────────
def build_barriers(df: pd.DataFrame) -> None:
    non_inv = df[df["QFL"] == "NON-INVESTOR"]["SS_BB2"].dropna()
    reasons = explode_multi(non_inv)
    counts = reasons.value_counts().reset_index()
    counts.columns = ["reason", "n"]
    counts.insert(0, "year", YEAR)
    counts.insert(0, "country", "India")
    counts.insert(2, "rank", "Rank I")
    counts.to_csv(OUT_DIR / "10_barriers_2025.csv", index=False)
    print(f"  10_barriers_2025.csv ({len(counts)} rows)")


# ── 7. 09_motivations_2025.csv ────────────────────────────────────────────────
def build_motivations(df: pd.DataFrame) -> None:
    inv = df[df["QFL"] == "INVESTOR"]["SS_B10"].dropna()
    reasons = explode_multi(inv)
    counts = reasons.value_counts().reset_index()
    counts.columns = ["reason", "n"]
    counts.insert(0, "year", YEAR)
    counts.insert(0, "country", "India")
    counts.insert(2, "rank", "Rank I")
    counts.to_csv(OUT_DIR / "09_motivations_2025.csv", index=False)
    print(f"  09_motivations_2025.csv ({len(counts)} rows)")


# ── 8. 06_info_sources_2025.csv ──────────────────────────────────────────────
def build_info_sources(df: pd.DataFrame) -> None:
    inv = df[df["QFL"] == "INVESTOR"]["SS_B3"].dropna()
    sources = explode_multi(inv)
    counts = sources.value_counts().reset_index()
    counts.columns = ["source", "n"]
    total = counts["n"].sum()
    counts["pct"] = (counts["n"] / total * 100).round(1)
    counts.insert(0, "year", YEAR)
    counts.insert(0, "country", "India")
    counts.insert(2, "rank", "Rank I")
    counts.to_csv(OUT_DIR / "06_info_sources_2025.csv", index=False)
    print(f"  06_info_sources_2025.csv ({len(counts)} rows)")


# ── 9. 11_iep_2025.csv ───────────────────────────────────────────────────────
def build_iep(df: pd.DataFrame) -> None:
    inv = df[df["QFL"] == "INVESTOR"][["Q20AM", "Q22A_All"]].copy()
    inv["attended"] = ~inv["Q20AM"].str.contains("not attended", case=False, na=True)

    instruments = ["Mutual Funds", "Stocks / Shares", "Futures & Options",
                   "Corporate Bonds", "All Investors"]
    rows = []
    for instr in instruments:
        if instr == "All Investors":
            sub = inv
        else:
            sub = inv[inv["Q22A_All"].str.contains(instr, na=False, regex=False)]
        total = len(sub)
        part = sub["attended"].sum()
        non_part = total - part
        rows.append({
            "country": "India", "year": YEAR,
            "investment": instr,
            "non_participant": int(non_part),
            "pct_non": round(non_part / total * 100, 1) if total else 0,
            "participant": int(part),
            "pct_part": round(part / total * 100, 1) if total else 0,
            "total": total,
        })
    out = pd.DataFrame(rows)
    out.to_csv(OUT_DIR / "11_iep_2025.csv", index=False)
    print(f"  11_iep_2025.csv ({len(out)} rows)")


# ── 10. 16_equity_holding_2025.csv ───────────────────────────────────────────
def build_equity_holding(df: pd.DataFrame) -> None:
    col = "GridxQ7[{_4}].Q7"  # Stocks / Shares Q7
    inv = df[df["QFL"] == "INVESTOR"][[col]].dropna()
    counts = inv[col].value_counts().reset_index()
    counts.columns = ["period", "n"]
    total = counts["n"].sum()
    counts["pct"] = (counts["n"] / total * 100).round(1)
    counts["cumulative"] = counts["pct"].cumsum().round(1)
    counts.insert(0, "year", YEAR)
    counts.insert(0, "country", "India")
    counts.to_csv(OUT_DIR / "16_equity_holding_2025.csv", index=False)
    print(f"  16_equity_holding_2025.csv ({len(counts)} rows)")


# ── 11. 18_mf_holding_2025.csv ───────────────────────────────────────────────
def build_mf_holding(df: pd.DataFrame) -> None:
    col = "GridxQ7[{_1_2}].Q7"  # MF_ETF Q7
    inv = df[df["QFL"] == "INVESTOR"][[col]].dropna()
    counts = inv[col].value_counts().reset_index()
    counts.columns = ["period", "n"]
    total = counts["n"].sum()
    counts["pct"] = (counts["n"] / total * 100).round(1)
    counts["cumulative"] = counts["pct"].cumsum().round(1)
    counts.insert(0, "year", YEAR)
    counts.insert(0, "country", "India")
    counts.to_csv(OUT_DIR / "18_mf_holding_2025.csv", index=False)
    print(f"  18_mf_holding_2025.csv ({len(counts)} rows)")


def run() -> None:
    print("Loading 2025 SEBI microdata...")
    df = load_raw()
    print(f"  {len(df)} respondents ({(df['QFL']=='INVESTOR').sum()} investors, "
          f"{(df['QFL']=='NON-INVESTOR').sum()} non-investors)\n")

    print("Building aggregated CSVs...")
    build_education_participation(df)
    build_education_instrument(df)
    build_income_instrument(df)
    build_occupation(df)
    build_awareness(df)
    build_barriers(df)
    build_motivations(df)
    build_info_sources(df)
    build_iep(df)
    build_equity_holding(df)
    build_mf_holding(df)

    print(f"\nDone — output in {OUT_DIR}")


if __name__ == "__main__":
    run()
