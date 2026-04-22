"""
ETL: Respondent Data.XLSX → respondents table in Postgres

Maps all 448 source columns to the schema in db/schema_respondents.sql.
Every output column is numeric/boolean — no free text stored.

Run:
    python src/etl_respondents.py
"""
from pathlib import Path
import os
import re

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]

DATA_DIR = Path(__file__).parent.parent / "data"
RAW_XLSX  = DATA_DIR / "Respondent Data.XLSX"
YEAR = 2025

# ── Categorical encoders ──────────────────────────────────────────────────────

def _nd(s):
    return str(s).replace("–", "-").replace("—", "-").strip()

EDU_MAP = {
    _nd("Illiterate"):                          1,
    _nd("School - upto 4 years"):               1,
    _nd("School - 5 to 9 years"):               2,
    _nd("10th Grade / Secondary Board (e.g., SSC/CBSE/ICSE)"): 3,
    _nd("12th Grade / Higher Secondary Board (e.g., HSC/ISC)"): 4,
    _nd("Some College (incl. a Diploma but not Grad.)"):        4,
}

def map_edu(val):
    if pd.isna(val):
        return None
    v = str(val).strip()
    # exact match with normalized dashes first
    found = EDU_MAP.get(_nd(v))
    if found:
        return found
    # keyword fallback (covers en-dash variants)
    v_lower = v.lower()
    if "illiterate" in v_lower or ("school" in v_lower and "upto 4" in v_lower):
        return 1
    if "school" in v_lower and "5 to 9" in v_lower:
        return 2
    if "10th" in v_lower or "secondary board" in v_lower:
        return 3
    if "12th" in v_lower or "higher secondary" in v_lower or "some college" in v_lower:
        return 4
    if "graduate" in v_lower or "postgraduate" in v_lower:
        return 5
    return None

INC_MAP = {
    "Rs. 5,001 - Rs. 10,000":   1,
    "Rs.10,001 - Rs. 15,000":   1,
    "Rs.15,001 - Rs. 20,000":   1,
    "Rs.20,001 - Rs. 30,000":   2,
    "Rs.30,001 - Rs. 40,000":   2,
    "Rs.40,001 - Rs. 50,000":   2,
    "Rs.50,001 - Rs. 60,000":   3,
    "Rs.60,001 - Rs. 80,000":   3,
    "Rs.80,001 - Rs. 1,00,000": 3,
    "Above Rs. 1,00,000":       4,
}

def map_inc(val):
    if pd.isna(val):
        return None
    return INC_MAP.get(_nd(str(val)))

GENDER_MAP = {"Male": 1, "Female": 2, "Other": 3}
MARITAL_MAP = {"Single": 1, "Married": 2, "Divorced / Separated": 3,
               "Widowed": 4, "Living together": 5}
FAMILY_MAP = {"Nuclear": 1, "Joint": 2, "Others": 3}

DURATION_MAP = {"Short Term": 1, "Mid Term": 2, "Long Term": 3, "DK/CS": 0}

def map_duration(val):
    if pd.isna(val):
        return None
    v = str(val).strip()
    return DURATION_MAP.get(v, 0)

IEP_MODE_MAP = {
    "Have not attended any investor education program": 0,
    "Yes, attended it online (webinars / virtual training sessions)": 1,
    "Yes, attended it in-person (seminars / workshops)": 2,
}

def map_iep(val):
    if pd.isna(val):
        return None, None
    v = str(val).strip()
    mode = IEP_MODE_MAP.get(v, None)
    attended = mode is not None and mode > 0
    return attended, mode

# ── Multi-coded → boolean helpers ────────────────────────────────────────────

def _contains(cell, substr):
    if pd.isna(cell):
        return False
    return substr in str(cell)

# Awareness substrings (Q21A)
AWR = {
    "aware_mf_sip":            "Mutual Funds",
    "aware_equity_shares":     "Stocks / Shares",
    "aware_derivatives_fo":    "Futures & Options",
    "aware_corporate_bonds":   "Corporate Bonds",
    "aware_ppf_vpf":           "Public Provident Fund",
    "aware_nps":               "National Pension System",
    "aware_fd_rd":             "Fixed Deposits",
    "aware_gold_physical_sgb": "Gold",
    "aware_real_estate":       "Real Estate",
    "aware_reits_invits":      "Real Estate Investment Trusts",
    "aware_mf_etf":            "MF_ETF",
    "aware_chit_fund":         "Chit Fund",
    "aware_epf":               "Employees Provident Fund",
    "aware_post_office":       "Post office",
    "aware_ulip":              "Unit Linked",
}

# Info sources (SS_B3)
INFO_SRC = {
    "info_friends_family":           "Friends, Family, and Colleagues",
    "info_social_media_influencers": "Financial Influencers on social media",
    "info_financial_professionals":  "Financial Professionals - Investment Advisors",
    "info_educational_resources":    "Educational Resources",
    "info_online_communities":       "Online Investment Communities",
    "info_news_blogs":               "Financial News & Blogs",
    "info_research_reports":         "Market or company analysis reports",
    "info_sebi_official_websites":   "Websites of SEBI",
    "info_iep_providers":            "Investor Education Programmes",
}

# Motivations (SS_B10)
MOTIVES = {
    "motive_higher_returns":     "Potential for higher returns",
    "motive_financial_goals":    "Investment strategy based on financial goals",
    "motive_long_term_growth":   "Long-term growth",
    "motive_quick_gains":        "Quick gains",
    "motive_additional_income":  "additional sources of income",
    "motive_short_term":         "short term investments",
    "motive_lower_risk":         "Lower risk",
    "motive_inflation_hedge":    "Protection against inflation",
    "motive_tax_benefits":       "Tax benefits",
    "motive_diversification":    "Diversifying",
    "motive_dividends":          "Dividend",
    "motive_convenience":        "Convenience",
    "motive_zero_charges":       "Zero account opening",
    "motive_peer_influence":     "friends/acquaintances are currently investing",
}

# Barriers (SS_BB2)
BARRIERS = {
    "barrier_fear_of_loss":          "Fear of losing money due to market risks",
    "barrier_lack_knowledge":        "Lack of knowledge about stock market",
    "barrier_lack_trust":            "Lack of trust in the Stocks",
    "barrier_dont_know_how":         "I don't know how to start",
    "barrier_regulatory_concerns":   "Regulatory concerns",
    "barrier_info_overload":         "Confusion cause by information overload",
    "barrier_uncertain_returns":     "Uncertainty about returns",
    "barrier_large_capital_needed":  "Requires large amount",
    "barrier_long_term_lock_in":     "long term investment",
    "barrier_too_many_options":      "too many options",
    "barrier_better_alternatives":   "Better returns from other investment",
    "barrier_high_fees":             "High fees",
    "barrier_insufficient_funds":    "I don't have enough money",
    "barrier_family_advice_against": "Advised by family",
    "barrier_liquidity_concerns":    "Takes time to receive invested money",
    "barrier_time_commitment":       "Lack of time to actively manage",
    "barrier_documentation_burden":  "Requires too many documents",
    "barrier_language_barrier":      "Lack of availability of investment platform in local language",
}

# GRIDxP1 columns → holds_* fields
P1_COLS = {
    "holds_mf_etf":          "GRIDxP1[{_1_2}].P1",
    "holds_equity_shares":   "GRIDxP1[{_4}].P1",
    "holds_derivatives_fo":  "GRIDxP1[{_3}].P1",
    "holds_gold_etf":        "GRIDxP1[{_5}].P1",
    "holds_nps":             "GRIDxP1[{_6}].P1",
    "holds_reits_invits":    "GRIDxP1[{_7}].P1",
    "holds_ulip":            "GRIDxP1[{_8}].P1",
    "holds_chit_fund":       "GRIDxP1[{_9}].P1",
    "holds_real_estate":     "GRIDxP1[{_10}].P1",
    "holds_corp_bonds":      "GRIDxP1[{_11}].P1",
    "holds_fd_rd":           "GRIDxP1[{_12}].P1",
    "holds_ppf_vpf":         "GRIDxP1[{_13}].P1",
    "holds_post_office":     "GRIDxP1[{_14}].P1",
    "holds_sgb":             "GRIDxP1[{_15}].P1",
    "holds_epf":             "GRIDxP1[{_16}].P1",
    "holds_pms":             "GRIDxP1[{_17}].P1",
    "holds_gold_physical":   "GRIDxP1[{_18}].P1",
    "holds_crypto":          "GRIDxP1[{_19}].P1",
    "holds_aif":             "GRIDxP1[{_20}].P1",
    "holds_sif":             "GRIDxP1[{_21}].P1",
}

ADI_COLS = {
    "status_mf_etf":       "ADI_Dashboard[{_1_2}].Slice",
    "status_equity":       "ADI_Dashboard[{_4}].Slice",
    "status_fo":           "ADI_Dashboard[{_3}].Slice",
    "status_corp_bonds":   "ADI_Dashboard[{_11}].Slice",
    "status_fd_rd":        "ADI_Dashboard[{_12}].Slice",
    "status_ppf":          "ADI_Dashboard[{_13}].Slice",
    "status_epf":          "ADI_Dashboard[{_16}].Slice",
    "status_gold_physical":"ADI_Dashboard[{_18}].Slice",
}

Q7_COLS = {
    "duration_equity":      "GridxQ7[{_4}].Q7",
    "duration_mf_etf":      "GridxQ7[{_1_2}].Q7",
    "duration_fo":          "GridxQ7[{_3}].Q7",
    "duration_gold_etf":    "GridxQ7[{_5}].Q7",
    "duration_nps":         "GridxQ7[{_6}].Q7",
    "duration_reits":       "GridxQ7[{_7}].Q7",
    "duration_corp_bonds":  "GridxQ7[{_11}].Q7",
    "duration_fd_rd":       "GridxQ7[{_12}].Q7",
    "duration_ppf":         "GridxQ7[{_13}].Q7",
    "duration_sgb":         "GridxQ7[{_15}].Q7",
    "duration_epf":         "GridxQ7[{_16}].Q7",
}

Q2M_COLS = {
    "pct_portfolio_mf_etf":      "Q2MXGrid[{_1_2}].Q2M",
    "pct_portfolio_equity":      "Q2MXGrid[{_4}].Q2M",
    "pct_portfolio_fo":          "Q2MXGrid[{_3}].Q2M",
    "pct_portfolio_gold_etf":    "Q2MXGrid[{_5}].Q2M",
    "pct_portfolio_nps":         "Q2MXGrid[{_6}].Q2M",
    "pct_portfolio_reits":       "Q2MXGrid[{_7}].Q2M",
    "pct_portfolio_ulip":        "Q2MXGrid[{_8}].Q2M",
    "pct_portfolio_corp_bonds":  "Q2MXGrid[{_11}].Q2M",
    "pct_portfolio_fd_rd":       "Q2MXGrid[{_12}].Q2M",
    "pct_portfolio_ppf":         "Q2MXGrid[{_13}].Q2M",
    "pct_portfolio_post_office": "Q2MXGrid[{_14}].Q2M",
    "pct_portfolio_sgb":         "Q2MXGrid[{_15}].Q2M",
    "pct_portfolio_epf":         "Q2MXGrid[{_16}].Q2M",
    "pct_portfolio_real_estate": "Q2MXGrid[{_10}].Q2M",
    "pct_portfolio_gold_physical":"Q2MXGrid[{_18}].Q2M",
    "pct_portfolio_crypto":      "Q2MXGrid[{_19}].Q2M",
    "pct_portfolio_aif":         "Q2MXGrid[{_20}].Q2M",
    "pct_portfolio_sif":         "Q2MXGrid[{_21}].Q2M",
}

Q1M_COLS = {
    "pct_income_expenses":    "Q1MXGrid[{_1}].Q1M",
    "pct_income_savings":     "Q1MXGrid[{_2}].Q1M",
    "pct_income_loan_emi":    "Q1MXGrid[{_3}].Q1M",
    "pct_income_investment":  "Q1MXGrid[{_4}].Q1M",
    "pct_income_other":       "Q1MXGrid[{_5}].Q1M",
}

Q14M_COLS = {
    "risk_rank_equity":      "Q14M_RANK_GRID[{_4}].Q14M_RANK",
    "risk_rank_mf_etf":      "Q14M_RANK_GRID[{_1_2}].Q14M_RANK",
    "risk_rank_fo":          "Q14M_RANK_GRID[{_3}].Q14M_RANK",
    "risk_rank_gold":        "Q14M_RANK_GRID[{_5}].Q14M_RANK",
    "risk_rank_fd_rd":       "Q14M_RANK_GRID[{_12}].Q14M_RANK",
    "risk_rank_corp_bonds":  "Q14M_RANK_GRID[{_11}].Q14M_RANK",
    "risk_rank_ppf":         "Q14M_RANK_GRID[{_13}].Q14M_RANK",
    "risk_rank_epf":         "Q14M_RANK_GRID[{_16}].Q14M_RANK",
    "risk_rank_real_estate": "Q14M_RANK_GRID[{_10}].Q14M_RANK",
    "risk_rank_crypto":      "Q14M_RANK_GRID[{_19}].Q14M_RANK",
}

Q15M_COLS = {
    "return_rank_equity":      "Q15M_RANK_GRID[{_4}].Q15M_RANK",
    "return_rank_mf_etf":      "Q15M_RANK_GRID[{_1_2}].Q15M_RANK",
    "return_rank_fo":          "Q15M_RANK_GRID[{_3}].Q15M_RANK",
    "return_rank_gold":        "Q15M_RANK_GRID[{_5}].Q15M_RANK",
    "return_rank_fd_rd":       "Q15M_RANK_GRID[{_12}].Q15M_RANK",
    "return_rank_corp_bonds":  "Q15M_RANK_GRID[{_11}].Q15M_RANK",
    "return_rank_ppf":         "Q15M_RANK_GRID[{_13}].Q15M_RANK",
    "return_rank_epf":         "Q15M_RANK_GRID[{_16}].Q15M_RANK",
    "return_rank_real_estate": "Q15M_RANK_GRID[{_10}].Q15M_RANK",
    "return_rank_crypto":      "Q15M_RANK_GRID[{_19}].Q15M_RANK",
}

Q6_COLS = {
    "goal_rank_buy_house":              "Q6_RANK_GRID[{_1}].Q6_RANK",
    "goal_rank_children_education":     "Q6_RANK_GRID[{_2}].Q6_RANK",
    "goal_rank_retirement":             "Q6_RANK_GRID[{_3}].Q6_RANK",
    "goal_rank_emergency_fund":         "Q6_RANK_GRID[{_4}].Q6_RANK",
    "goal_rank_grow_wealth":            "Q6_RANK_GRID[{_5}].Q6_RANK",
    "goal_rank_major_expense":          "Q6_RANK_GRID[{_6}].Q6_RANK",
    "goal_rank_passive_income":         "Q6_RANK_GRID[{_7}].Q6_RANK",
    "goal_rank_support_family":         "Q6_RANK_GRID[{_8}].Q6_RANK",
    "goal_rank_financial_independence": "Q6_RANK_GRID[{_9}].Q6_RANK",
    "goal_rank_child_marriage":         "Q6_RANK_GRID[{_10}].Q6_RANK",
    "goal_rank_tax_savings":            "Q6_RANK_GRID[{_11}].Q6_RANK",
    "goal_rank_daily_trading":          "Q6_RANK_GRID[{_12}].Q6_RANK",
}

Q15AM_COLS = {
    "knows_direct_mf_lower_expense": "GRIDxQ15AM[{_1}].Q15AM",
    "knows_pension_invests_equity":  "GRIDxQ15AM[{_2}].Q15AM",
    "knows_compounding_longterm":    "GRIDxQ15AM[{_3}].Q15AM",
    "knows_kyc_online":              "GRIDxQ15AM[{_4}].Q15AM",
    "knows_demat_needed":            "GRIDxQ15AM[{_5}].Q15AM",
    "knows_high_return_high_risk":   "GRIDxQ15AM[{_6}].Q15AM",
    "knows_diversification_reduces": "GRIDxQ15AM[{_7}].Q15AM",
    "knows_cas_overview":            "GRIDxQ15AM[{_8}].Q15AM",
    "knows_bsda_basic_demat":        "GRIDxQ15AM[{_9}].Q15AM",
}

Q1B_COLS = {
    "perceive_market_well_regulated":     "g_Q1B[{_1}].Q1B",
    "perceive_market_handles_volatility": "g_Q1B[{_2}].Q1B",
    "perceive_market_new_instruments":    "g_Q1B[{_3}].Q1B",
    "perceive_market_accessible":         "g_Q1B[{_4}].Q1B",
    "perceive_market_wealth_creation":    "g_Q1B[{_5}].Q1B",
    "perceive_market_easy_convenient":    "g_Q1B[{_6}].Q1B",
}


# ── Row builder ──────────────────────────────────────────────────────────────

def _int(val):
    try:
        v = int(float(val))
        return v if not pd.isna(val) else None
    except (ValueError, TypeError):
        return None

def _num(val):
    try:
        return float(val) if not pd.isna(val) else None
    except (ValueError, TypeError):
        return None

def build_row(r, cols):
    """Map one DataFrame row to the respondents insert tuple."""
    iep_attended, iep_mode = map_iep(r.get("Q20AM"))

    # Awareness flags
    awr_vals = {k: _contains(r.get("Q21A"), substr) for k, substr in AWR.items()}
    n_aware  = sum(1 for v in awr_vals.values() if v)

    # Holdings from pre-coded P1 columns (1=currently holds, 0=not)
    holds_vals = {}
    for dest, src in P1_COLS.items():
        if src in cols:
            raw = r.get(src)
            holds_vals[dest] = bool(_int(raw)) if raw is not None and not pd.isna(raw) else False
        else:
            holds_vals[dest] = None
    n_held = sum(1 for v in holds_vals.values() if v)

    # Multi-coded text → boolean flags
    info_vals    = {k: _contains(r.get("SS_B3"),  substr) for k, substr in INFO_SRC.items()}
    motive_vals  = {k: _contains(r.get("SS_B10"), substr) for k, substr in MOTIVES.items()}
    barrier_vals = {k: _contains(r.get("SS_BB2"), substr) for k, substr in BARRIERS.items()}

    row = {
        "respondent_id":  _int(r.get("Resp_ID_DP")),
        "survey_year":    YEAR,
        # Geography
        "state_id":       None,  # SELECTED_STATE is text → lookup needed; set None for now
        "zone":           str(r.get("Zone_DP", "")).strip() or None,
        "is_urban":       str(r.get("URBANRURAL", "")).strip().upper() == "URBAN",
        "city_class":     str(r.get("SELECTED_CLASS", "")).strip() or None,
        "centre":         str(r.get("AOL_VAR_CENTRE", "")).strip() or None,
        # Socioeconomic
        "is_investor":    str(r.get("QFL", "")).strip() == "INVESTOR",
        "gender":         GENDER_MAP.get(str(r.get("Q1", "")).strip()),
        "marital_status": MARITAL_MAP.get(str(r.get("Q13", "")).strip()),
        "family_type":    FAMILY_MAP.get(str(r.get("Q5A", "")).strip()),
        "life_stage":     _int(r.get("Life_Stage")),
        "nccs_class":     _int(r.get("SECNEW")),
        "education_id":   map_edu(r.get("Q3D")),
        "occupation_raw": _int(r.get("Q14")) if str(r.get("Q14","")).isdigit() else None,
        "income_id":      map_inc(r.get("Q10")),
        "annual_hh_income_id": _int(r.get("Q10A")),
        "internet_plan_type":  _int(r.get("QC1")),
        "has_demat_account":   _int(r.get("Q29")) == 1 if r.get("Q29") is not None else None,
        # Income allocation
        **{k: _num(r.get(v)) for k, v in Q1M_COLS.items() if v in cols},
        # Portfolio allocation
        **{k: _num(r.get(v)) for k, v in Q2M_COLS.items() if v in cols},
        # Financial goals
        **{k: _int(r.get(v)) for k, v in Q6_COLS.items() if v in cols},
        # Awareness
        **awr_vals,
        "n_products_aware": n_aware,
        # Holdings
        **holds_vals,
        "n_instruments_held": n_held,
        # Active/dormant status
        **{k: _int(r.get(v)) for k, v in ADI_COLS.items() if v in cols},
        # Holding duration
        **{k: map_duration(r.get(v)) for k, v in Q7_COLS.items() if v in cols},
        # Respondent's definition of terms
        "short_term_months": _int(r.get("GridxQ8M[{_1}].Q8M")),
        "mid_term_months":   _int(r.get("GridxQ8M[{_2}].Q8M")),
        "long_term_months":  _int(r.get("GridxQ8M[{_3}].Q8M")),
        # Financial literacy & risk
        "stock_market_familiarity":  _int(r.get("Q11M")),
        "risk_return_threshold":     _int(r.get("Q12M")),
        "market_downturn_reaction":  _int(r.get("Q10M")),
        "risk_tolerance_preference": _int(r.get("QRT")),
        # Perceived risk ranks
        **{k: _int(r.get(v)) for k, v in Q14M_COLS.items() if v in cols},
        # Perceived return ranks
        **{k: _int(r.get(v)) for k, v in Q15M_COLS.items() if v in cols},
        # Financial knowledge
        **{k: _int(r.get(v)) for k, v in Q15AM_COLS.items() if v in cols},
        # Market perception
        **{k: _int(r.get(v)) for k, v in Q1B_COLS.items() if v in cols},
        # Grievance
        "aware_sebi_grievance_mechanism": _int(r.get("Q17M")) == 1 if r.get("Q17M") is not None else None,
        "grievance_approach_entity":      _int(r.get("Q16M")),
        # IEP
        "iep_attended":           iep_attended,
        "iep_mode":               iep_mode,
        "iep_found_useful":       _int(r.get("Q20BM")),
        "iep_preferred_mode":     _int(r.get("Q20CM")),
        "iep_preferred_language": _int(r.get("Q20E")),
        # Info sources
        **info_vals,
        # Motivations
        **motive_vals,
        # Barriers
        **barrier_vals,
        # Media
        "tv_frequency":        _int(r.get("M1A")),
        "radio_frequency":     _int(r.get("M1B")),
        "newspaper_frequency": _int(r.get("M1C")),
        "internet_frequency":  _int(r.get("M1D")),
        # Weight
        "survey_weight": _num(r.get("Weight_to_Sample")),
    }
    return row


# ── Load & insert ────────────────────────────────────────────────────────────

COLUMNS = list(build_row({}, set()).keys())  # get column order

INSERT_SQL = f"""
    INSERT INTO respondents ({', '.join(COLUMNS)})
    VALUES %s
    ON CONFLICT (respondent_id) DO NOTHING
"""

def load_and_insert():
    print("Loading XLSX (~2 min)...")
    df = pd.read_excel(RAW_XLSX, engine="openpyxl")
    df = df[df["QFL"].isin(["INVESTOR", "NON-INVESTOR"])].copy().reset_index(drop=True)
    col_set = set(df.columns)
    print(f"  {len(df)} respondents, {len(df.columns)} columns")

    print("Transforming rows...")
    rows = []
    for _, r in df.iterrows():
        row = build_row(r.to_dict(), col_set)
        rows.append(tuple(row[c] for c in COLUMNS))

    print(f"  {len(rows)} rows built. Inserting into Postgres...")
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()
    execute_values(cur, INSERT_SQL, rows, page_size=2000)
    conn.commit()
    cur.close()
    conn.close()
    print(f"  Done. {len(rows)} rows inserted into respondents.")


if __name__ == "__main__":
    load_and_insert()
