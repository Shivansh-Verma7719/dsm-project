"""
ETL: Respondent Data.XLSX → normalized Postgres schema (db/schema_respondents.sql)

Inserts into 17 sub-tables in a single transaction.  All output columns are
numeric or boolean — no free text stored.

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
from tqdm import tqdm

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]

DATA_DIR = Path(__file__).parent.parent / "data"
RAW_XLSX  = DATA_DIR / "Respondent Data.XLSX"
YEAR = 2025

# ── Categorical encoders ──────────────────────────────────────────────────────

def _nd(s):
    return str(s).replace("–", "-").replace("—", "-").strip()

def map_edu(val):
    if pd.isna(val):
        return None
    v = str(val).strip().lower()
    if "illiterate" in v or ("school" in v and "upto 4" in v):
        return 0
    if "school" in v and "5 to 9" in v:
        return 6
    if "10th" in v or "secondary board" in v:
        return 9
    if "12th" in v or "higher secondary" in v or "some college" in v:
        return 12
    if "graduate" in v or "postgraduate" in v:
        return 16
    return None

INC_MAP = {
    "Rs. 5,001 - Rs. 10,000":    7500,
    "Rs.10,001 - Rs. 15,000":   12500,
    "Rs.15,001 - Rs. 20,000":   17500,
    "Rs.20,001 - Rs. 30,000":   25000,
    "Rs.30,001 - Rs. 40,000":   35000,
    "Rs.40,001 - Rs. 50,000":   45000,
    "Rs.50,001 - Rs. 60,000":   55000,
    "Rs.60,001 - Rs. 80,000":   70000,
    "Rs.80,001 - Rs. 1,00,000": 90000,
    "Above Rs. 1,00,000":      150000,
}

def map_inc(val):
    if pd.isna(val):
        return None
    return INC_MAP.get(_nd(str(val)))

GENDER_MAP = {"Male": 1, "Female": 2, "Other": 3}

def map_marital(val):
    if pd.isna(val):
        return None
    v = str(val).lower()
    if "single" in v:
        return 1
    if "married" in v:
        return 2
    if "divorced" in v or "separated" in v:
        return 3
    if "widowed" in v:
        return 4
    if "living together" in v:
        return 5
    return None

def map_family(val):
    if pd.isna(val):
        return None
    v = str(val).lower()
    if "nuclear" in v:
        return 1
    if "joint" in v:
        return 2
    return 3  # single-person household or other

NCCS_MAP = {"A1": 1, "A2": 2, "A3": 3, "B1": 4, "B2": 5,
            "C1": 6, "C2": 7, "D1": 8, "D2": 9, "E1": 10, "E2": 11}

LIFE_STAGE_MAP = {"Gen Z": 1, "Millennials": 2, "Generation X": 3, "Baby Boomers": 4}

OCC_MAP = {
    "unskilled":           1,
    "skilled worker":      2,
    "clerk":               3,
    "salesman":            3,
    "supervisory":         4,
    "officer":             5,
    "executive":           5,
    "self-employed":       6,
    "business":            7,
    "industrialist":       7,
    "homemaker":           8,
    "housewife":           8,
    "student":             9,
    "retired":             10,
    "unemployed":          11,
    "farmer":              12,
}

def map_occupation(val):
    if pd.isna(val):
        return None
    v = str(val).lower()
    for kw, code in OCC_MAP.items():
        if kw in v:
            return code
    return None

STATE_MAP = {
    "ANDHRA PRADESH": 1, "ARUNACHAL PRADESH": 2, "ASSAM": 3,
    "BIHAR": 4, "CHHATTISGARH": 5, "DELHI": 6, "GOA": 7,
    "GUJARAT": 8, "HARYANA": 9, "HIMACHAL PRADESH": 10,
    "JAMMU & KASHMIR": 11, "JHARKHAND": 12, "KARNATAKA": 13,
    "KERALA": 14, "MADHYA PRADESH": 15, "MAHARASHTRA": 16,
    "MANIPUR": 17, "MEGHALAYA": 18, "MIZORAM": 19, "NAGALAND": 20,
    "ODISHA": 21, "PUNJAB": 22, "RAJASTHAN": 23, "SIKKIM": 24,
    "TAMIL NADU": 25, "TELANGANA": 26, "TRIPURA": 27,
    "UTTAR PRADESH": 28, "UTTARAKHAND": 29, "WEST BENGAL": 30,
    "ANDAMAN & NICOBAR": 31, "CHANDIGARH": 32,
    "DADRA & NAGAR HAVELI": 33, "LAKSHADWEEP": 34, "PUDUCHERRY": 35,
}

def map_inc(val):
    if pd.isna(val):
        return None
    v = str(val)
    nums = re.findall(r'[\d,]+', v)
    if not nums:
        return None
    first = int(nums[0].replace(',', ''))
    # Map lower bound of bracket → midpoint in Rs.
    bracket = {
        5001: 7500, 10001: 12500, 15001: 17500, 20001: 25000,
        30001: 35000, 40001: 45000, 50001: 55000, 60001: 70000,
        80001: 90000, 100001: 112500, 125001: 137500, 150001: 175000,
    }
    return bracket.get(first, 150000 if first > 100000 else None)

def map_demat(val):
    if pd.isna(val):
        return None
    v = str(val).lower().strip()
    if v == "yes":
        return True
    if v == "no":
        return False
    return None

def map_qrt(val):
    if pd.isna(val):
        return None
    v = str(val).lower()
    if "preservation" in v:
        return 1
    if "stable" in v or "minimal losses" in v:
        return 2
    if "better" in v or "higher returns" in v:
        return 3
    if "high returns" in v or "not too concerned" in v:
        return 4
    return None

def map_q11m(val):
    """Stock market familiarity: 1=Not at all .. 5=Very familiar"""
    if pd.isna(val):
        return None
    v = str(val).lower()
    if "don't know" in v or "not at all" in v:
        return 1
    if "know a little" in v:
        return 2
    if "some knowledge" in v or "basic" in v:
        return 3
    if "familiar" in v and ("periodically" in v or "update" in v):
        return 4
    if "very familiar" in v or "regular basis" in v:
        return 5
    return None

def map_q12m(val):
    """Risk-return threshold: 1=Less than today 2=Same 3=More than today"""
    if pd.isna(val):
        return None
    v = str(val).lower()
    if "less than" in v:
        return 1
    if "exactly" in v or "same" in v:
        return 2
    if "more than" in v:
        return 3
    return None

def map_q10m(val):
    """Market downturn reaction: 1=Sell all .. 5=Buy more"""
    if pd.isna(val):
        return None
    v = str(val).lower()
    if "safer options" in v or "stop investing" in v:
        return 1
    if "take out some" in v or "bit worried" in v:
        return 2
    if "wait for the market" in v or "keep my money invested" in v:
        return 3
    if "invest more" in v or "earn better" in v:
        return 5
    return 3  # default to hold

def map_adi(val):
    """Instrument status: 1=Active 2=Dormant 3=Never invested. NULL if ADI has no data."""
    if pd.isna(val):
        return None
    v = str(val).lower()
    if "active" in v:
        return 1
    if "dormant" in v:
        return 2
    return None

def map_q1b(val):
    """Market perception agreement: 1=Strongly Agree .. 5=Strongly Disagree"""
    if pd.isna(val):
        return None
    v = str(val).lower()
    if "strongly agree" in v:    return 1
    if "strongly disagree" in v: return 5
    if "slightly agree" in v:    return 2
    if "slightly disagree" in v: return 4
    if "neither" in v:           return 3
    if "agree" in v:             return 2
    if "disagree" in v:          return 4
    return None

Q8M_MAP = {
    "less than one month":   1,
    "1 - 3 months":          2,
    "upto 3 months":         2,
    "up to 3 months":        2,
    "3 months - 6 months":   5,
    "6 months - 1 year":     9,
    "1 year - 3 years":     24,
    "3 years - 5 years":    48,
    "5 years - 7 years":    72,
    "7 years - 10 years":  102,
    "10 years":            144,
}

def map_q8m(val):
    """Time horizon text range → midpoint in months"""
    if pd.isna(val):
        return None
    v = str(val).lower()
    for key, months in Q8M_MAP.items():
        if key in v:
            return months
    return None

KNOWLEDGE_MAP = {"TRUE": 1, "True": 1, "FALSE": 2, "False": 2, "Not Aware": 3}

def map_knowledge(val):
    if pd.isna(val):
        return None
    v = str(val).strip()
    return KNOWLEDGE_MAP.get(v)

def map_media(val):
    """Keyword-based to avoid en-dash encoding mismatch from XLSX.
    Scale: 1=Never  2=Monthly  3=Weekly  4=<1hr/day  5=1+hr/day
    """
    if pd.isna(val):
        return None
    v = str(val).lower().strip()
    if "don't" in v or "don't" in v or "does not" in v or "no internet" in v:
        return 1
    if "month" in v:
        return 2
    if "week" in v:
        return 3
    if "less than 1 hour" in v or "less than one hour" in v:
        return 4
    if "hour" in v or "more than" in v:
        return 5
    return None

def map_internet(val):
    if pd.isna(val):
        return None
    v = str(val).lower()
    if "don't have" in v or "no internet" in v:
        return 1
    if "mobile" in v and not any(x in v for x in ["broadband", "fiber", "dsl", "cable", "fixed", "satellite"]):
        return 2
    return 3  # any broadband type or mixed

INC_CODE_MAP = {
    5001: 1, 10001: 2, 15001: 3, 20001: 4, 30001: 5,
    40001: 6, 50001: 7, 60001: 8, 80001: 9, 100001: 10,
    125001: 11, 150001: 12,
}

def map_inc_code(val):
    if pd.isna(val):
        return None
    nums = re.findall(r'[\d,]+', str(val))
    if not nums:
        return None
    first = int(nums[0].replace(',', ''))
    return INC_CODE_MAP.get(first, 10 if first > 100000 else None)

def map_duration(val):
    """Holding duration — handles single values and comma-separated multi-select.
    Takes the longest horizon selected. 1=Short 2=Mid 3=Long 0=DK"""
    if pd.isna(val):
        return None
    v = str(val)
    if "Long Term" in v:
        return 3
    if "Mid Term" in v:
        return 2
    if "Short Term" in v:
        return 1
    return 0

def _int(val):
    try:
        return int(float(val)) if not pd.isna(val) else None
    except (ValueError, TypeError):
        return None

def _num(val):
    try:
        return float(val) if not pd.isna(val) else None
    except (ValueError, TypeError):
        return None

def _contains(cell, substr):
    if pd.isna(cell):
        return False
    return substr in str(cell)

def _str(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    return s or None

# ── Multi-coded field substrings ──────────────────────────────────────────────

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

# Q22A_All substring matching for traditional/non-securities instruments
# (P1 columns only cover securities; Q22A covers all instruments the person claims to hold)
Q22A_HOLDS = {
    "holds_fd_rd":         "Fixed Deposits",
    "holds_gold_physical": "Gold - Physical",
    "holds_sgb":           "Sovereign Gold Bond",
    "holds_ulip":          "Unit Linked Insurance",
    "holds_nps":           "National Pension",
    "holds_ppf_vpf":       "Public Provident Fund",
    "holds_post_office":   "Post office savings",
    "holds_epf":           "Employees Provident",
    "holds_real_estate":   "Real Estate",
    "holds_crypto":        "Cryptocurrency",
    "holds_pms":           "Portfolio Management",
    "holds_chit_fund":     "Chit Fund",
    "holds_gold_etf":      "Gold ETF",
    "holds_sif":           "Specialized Investment",
    # backup for securities instruments (in case P1 is null but Q22A shows holding)
    "holds_mf_etf":        "Mutual Funds",
    "holds_equity_shares": "Stocks / Shares",
    "holds_derivatives_fo":"Futures & Options",
    "holds_reits_invits":  "Real Estate Investment Trust",
    "holds_corp_bonds":    "Corporate Bond",
    "holds_aif":           "Alternative Investment",
}

# ── Column mappings (dest_field → source_column) ─────────────────────────────

P1_COLS = {
    "holds_mf_etf":         "GRIDxP1[{_1_2}].P1",
    "holds_equity_shares":  "GRIDxP1[{_4}].P1",
    "holds_derivatives_fo": "GRIDxP1[{_3}].P1",
    "holds_gold_etf":       "GRIDxP1[{_5}].P1",
    "holds_nps":            "GRIDxP1[{_6}].P1",
    "holds_reits_invits":   "GRIDxP1[{_7}].P1",
    "holds_ulip":           "GRIDxP1[{_8}].P1",
    "holds_chit_fund":      "GRIDxP1[{_9}].P1",
    "holds_real_estate":    "GRIDxP1[{_10}].P1",
    "holds_corp_bonds":     "GRIDxP1[{_11}].P1",
    "holds_fd_rd":          "GRIDxP1[{_12}].P1",
    "holds_ppf_vpf":        "GRIDxP1[{_13}].P1",
    "holds_post_office":    "GRIDxP1[{_14}].P1",
    "holds_sgb":            "GRIDxP1[{_15}].P1",
    "holds_epf":            "GRIDxP1[{_16}].P1",
    "holds_pms":            "GRIDxP1[{_17}].P1",
    "holds_gold_physical":  "GRIDxP1[{_18}].P1",
    "holds_crypto":         "GRIDxP1[{_19}].P1",
    "holds_aif":            "GRIDxP1[{_20}].P1",
    "holds_sif":            "GRIDxP1[{_21}].P1",
}

ADI_COLS = {
    "status_mf_etf":        "ADI_Dashboard[{_1_2}].Slice",
    "status_equity":        "ADI_Dashboard[{_4}].Slice",
    "status_fo":            "ADI_Dashboard[{_3}].Slice",
    "status_corp_bonds":    "ADI_Dashboard[{_11}].Slice",
    "status_fd_rd":         "ADI_Dashboard[{_12}].Slice",
    "status_ppf":           "ADI_Dashboard[{_13}].Slice",
    "status_epf":           "ADI_Dashboard[{_16}].Slice",
    "status_gold_physical": "ADI_Dashboard[{_18}].Slice",
}

Q7_COLS = {
    "duration_equity":     "GridxQ7[{_4}].Q7",
    "duration_mf_etf":     "GridxQ7[{_1_2}].Q7",
    "duration_fo":         "GridxQ7[{_3}].Q7",
    "duration_gold_etf":   "GridxQ7[{_5}].Q7",
    "duration_nps":        "GridxQ7[{_6}].Q7",
    "duration_reits":      "GridxQ7[{_7}].Q7",
    "duration_corp_bonds": "GridxQ7[{_11}].Q7",
    "duration_fd_rd":      "GridxQ7[{_12}].Q7",
    "duration_ppf":        "GridxQ7[{_13}].Q7",
    "duration_sgb":        "GridxQ7[{_15}].Q7",
    "duration_epf":        "GridxQ7[{_16}].Q7",
}

Q2M_COLS = {
    "pct_portfolio_mf_etf":       "Q2MXGrid[{_1_2}].Q2M",
    "pct_portfolio_equity":       "Q2MXGrid[{_4}].Q2M",
    "pct_portfolio_fo":           "Q2MXGrid[{_3}].Q2M",
    "pct_portfolio_gold_etf":     "Q2MXGrid[{_5}].Q2M",
    "pct_portfolio_nps":          "Q2MXGrid[{_6}].Q2M",
    "pct_portfolio_reits":        "Q2MXGrid[{_7}].Q2M",
    "pct_portfolio_ulip":         "Q2MXGrid[{_8}].Q2M",
    "pct_portfolio_corp_bonds":   "Q2MXGrid[{_11}].Q2M",
    "pct_portfolio_fd_rd":        "Q2MXGrid[{_12}].Q2M",
    "pct_portfolio_ppf":          "Q2MXGrid[{_13}].Q2M",
    "pct_portfolio_post_office":  "Q2MXGrid[{_14}].Q2M",
    "pct_portfolio_sgb":          "Q2MXGrid[{_15}].Q2M",
    "pct_portfolio_epf":          "Q2MXGrid[{_16}].Q2M",
    "pct_portfolio_real_estate":  "Q2MXGrid[{_10}].Q2M",
    "pct_portfolio_gold_physical":"Q2MXGrid[{_18}].Q2M",
    "pct_portfolio_crypto":       "Q2MXGrid[{_19}].Q2M",
    "pct_portfolio_aif":          "Q2MXGrid[{_20}].Q2M",
    "pct_portfolio_sif":          "Q2MXGrid[{_21}].Q2M",
}

Q1M_COLS = {
    "pct_income_expenses":   "Q1MXGrid[{_1}].Q1M",
    "pct_income_savings":    "Q1MXGrid[{_2}].Q1M",
    "pct_income_loan_emi":   "Q1MXGrid[{_3}].Q1M",
    "pct_income_investment": "Q1MXGrid[{_4}].Q1M",
    "pct_income_other":      "Q1MXGrid[{_5}].Q1M",
}

Q6_COLS = {
    "goal_rank_buy_house":               "Q6_RANK_GRID[{_1}].Q6_RANK",
    "goal_rank_children_education":      "Q6_RANK_GRID[{_2}].Q6_RANK",
    "goal_rank_retirement":              "Q6_RANK_GRID[{_3}].Q6_RANK",
    "goal_rank_emergency_fund":          "Q6_RANK_GRID[{_4}].Q6_RANK",
    "goal_rank_grow_wealth":             "Q6_RANK_GRID[{_5}].Q6_RANK",
    "goal_rank_major_expense":           "Q6_RANK_GRID[{_6}].Q6_RANK",
    "goal_rank_passive_income":          "Q6_RANK_GRID[{_7}].Q6_RANK",
    "goal_rank_support_family":          "Q6_RANK_GRID[{_8}].Q6_RANK",
    "goal_rank_financial_independence":  "Q6_RANK_GRID[{_9}].Q6_RANK",
    "goal_rank_child_marriage":          "Q6_RANK_GRID[{_10}].Q6_RANK",
    "goal_rank_tax_savings":             "Q6_RANK_GRID[{_11}].Q6_RANK",
    "goal_rank_daily_trading":           "Q6_RANK_GRID[{_12}].Q6_RANK",
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
    "perceive_market_well_regulated":      "g_Q1B[{_1}].Q1B",
    "perceive_market_handles_volatility":  "g_Q1B[{_2}].Q1B",
    "perceive_market_new_instruments":     "g_Q1B[{_3}].Q1B",
    "perceive_market_accessible":          "g_Q1B[{_4}].Q1B",
    "perceive_market_wealth_creation":     "g_Q1B[{_5}].Q1B",
    "perceive_market_easy_convenient":     "g_Q1B[{_6}].Q1B",
}


# ── Row transformer ───────────────────────────────────────────────────────────

def transform_row(r: dict, cols: set) -> dict:
    """Map one source row → dict of {table_name: row_dict}."""
    rid = _int(r.get("Resp_ID_DP"))
    is_investor = str(r.get("QFL", "")).strip() == "INVESTOR"

    # awareness
    awr_vals = {k: _contains(r.get("Q21A"), s) for k, s in AWR.items()}
    n_aware = sum(1 for v in awr_vals.values() if v)

    # holdings: P1 recency text = held; supplement with Q22A_All for non-securities
    holds_vals = {}
    for dest, src in P1_COLS.items():
        raw = r.get(src) if src in cols else None
        holds_vals[dest] = (raw is not None and not pd.isna(raw))
    q22a = r.get("Q22A_All", "")
    for dest, substr in Q22A_HOLDS.items():
        if not holds_vals.get(dest):
            holds_vals[dest] = _contains(q22a, substr)
    n_held = sum(1 for v in holds_vals.values() if v)

    # multi-coded text → boolean
    info_vals    = {k: _contains(r.get("SS_B3"),  s) for k, s in INFO_SRC.items()}
    motive_vals  = {k: _contains(r.get("SS_B10"), s) for k, s in MOTIVES.items()}
    barrier_vals = {k: _contains(r.get("SS_BB2"), s) for k, s in BARRIERS.items()}

    state_raw = _str(r.get("SELECTED_STATE"))
    state_id  = STATE_MAP.get(state_raw.upper().strip()) if state_raw else None

    def _col(src_col):
        return r.get(src_col) if src_col in cols else None

    return {
        "respondents": {
            "respondent_id": rid,
            "survey_year":   YEAR,
            "is_investor":   is_investor,
            "survey_weight": _num(r.get("Weight_to_Sample")),
        },
        "respondent_geography": {
            "respondent_id": rid,
            "state_id":      state_id,
            "zone":          _str(r.get("Zone_DP")),
            "is_urban":      _str(r.get("URBANRURAL", "")).upper() == "URBAN",
            "city_class":    _str(r.get("SELECTED_CLASS")),
            "centre":        _str(r.get("AOL_VAR_CENTRE")),
        },
        "respondent_profile": {
            "respondent_id":       rid,
            "gender":              GENDER_MAP.get(_str(r.get("Q1")) or ""),
            "marital_status":      map_marital(r.get("Q13")),
            "family_type":         map_family(r.get("Q5A")),
            "life_stage":          LIFE_STAGE_MAP.get(_str(r.get("Life_Stage")) or ""),
            "nccs_class":          NCCS_MAP.get(_str(r.get("SECNEW")) or ""),
            "education_years":     map_edu(r.get("Q3D")),
            "occupation_raw":      map_occupation(r.get("Q14")),
            "monthly_income_rs":   map_inc(r.get("Q10")),
            "annual_hh_income_id": map_inc_code(r.get("Q10A")),
            "internet_plan_type":  map_internet(r.get("QC1")),
            "has_demat_account":   map_demat(r.get("Q29")),
        },
        "respondent_income_allocation": {
            "respondent_id":       rid,
            **{k: _num(_col(v)) for k, v in Q1M_COLS.items()},
        },
        "respondent_portfolio_allocation": {
            "respondent_id":       rid,
            **{k: _num(_col(v)) for k, v in Q2M_COLS.items()},
        },
        "respondent_goal_ranks": {
            "respondent_id":       rid,
            **{k: _int(_col(v)) for k, v in Q6_COLS.items()},
        },
        "respondent_awareness": {
            "respondent_id":    rid,
            **awr_vals,
            "n_products_aware": n_aware,
        },
        "respondent_holdings": {
            "respondent_id":      rid,
            **holds_vals,
            "n_instruments_held": n_held,
        },
        "respondent_instrument_status": {
            "respondent_id": rid,
            **{k: map_adi(_col(v)) for k, v in ADI_COLS.items()},
        },
        "respondent_instrument_duration": {
            "respondent_id": rid,
            **{k: map_duration(_col(v)) for k, v in Q7_COLS.items()},
        },
        "respondent_time_horizons": {
            "respondent_id":     rid,
            "short_term_months": map_q8m(r.get("GridxQ8M[{_1}].Q8M")),
            "mid_term_months":   map_q8m(r.get("GridxQ8M[{_2}].Q8M")),
            "long_term_months":  map_q8m(r.get("GridxQ8M[{_3}].Q8M")),
        },
        "respondent_literacy_risk": {
            "respondent_id":             rid,
            "stock_market_familiarity":  map_q11m(r.get("Q11M")),
            "risk_return_threshold":     map_q12m(r.get("Q12M")),
            "market_downturn_reaction":  map_q10m(r.get("Q10M")),
            "risk_tolerance_preference": map_qrt(r.get("QRT")),
            **{k: _int(_col(v)) for k, v in Q14M_COLS.items()},
            **{k: _int(_col(v)) for k, v in Q15M_COLS.items()},
        },
        "respondent_knowledge": {
            "respondent_id": rid,
            **{k: map_knowledge(_col(v)) for k, v in Q15AM_COLS.items()},
        },
        "respondent_market_perception": {
            "respondent_id": rid,
            **{k: map_q1b(_col(v)) for k, v in Q1B_COLS.items()},
        },
        "respondent_info_sources": {
            "respondent_id": rid,
            **info_vals,
        },
        "respondent_motivations": {
            "respondent_id": rid,
            **motive_vals,
        },
        "respondent_barriers": {
            "respondent_id": rid,
            **barrier_vals,
        },
        "respondent_media": {
            "respondent_id":       rid,
            "tv_frequency":        map_media(r.get("M1A")),
            "radio_frequency":     map_media(r.get("M1B")),
            "newspaper_frequency": map_media(r.get("M1C")),
            "internet_frequency":  map_media(r.get("M1D")),
        },
    }


# Insert order: parent table first, then children
TABLE_ORDER = [
    "respondents",
    "respondent_geography",
    "respondent_profile",
    "respondent_income_allocation",
    "respondent_portfolio_allocation",
    "respondent_goal_ranks",
    "respondent_awareness",
    "respondent_holdings",
    "respondent_instrument_status",
    "respondent_instrument_duration",
    "respondent_time_horizons",
    "respondent_literacy_risk",
    "respondent_knowledge",
    "respondent_market_perception",
    "respondent_info_sources",
    "respondent_motivations",
    "respondent_barriers",
    "respondent_media",
]


def load_and_insert():
    print("Loading XLSX (~2 min)...")
    df = pd.read_excel(RAW_XLSX, engine="openpyxl")
    df = df[df["QFL"].isin(["INVESTOR", "NON-INVESTOR"])].copy().reset_index(drop=True)
    col_set = set(df.columns)
    print(f"  {len(df)} respondents, {len(df.columns)} columns")

    print("Transforming rows...")
    tables: dict[str, list[dict]] = {t: [] for t in TABLE_ORDER}
    for _, r in tqdm(df.iterrows(), total=len(df), unit="row"):
        row_map = transform_row(r.to_dict(), col_set)
        for tname, row in row_map.items():
            tables[tname].append(row)

    print(f"  {len(tables['respondents'])} respondents transformed. Inserting...")
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()
    cur.execute("SET statement_timeout = 0")
    try:
        for tname in TABLE_ORDER:
            rows = tables[tname]
            if not rows:
                continue
            cols_list = list(rows[0].keys())
            sql = (
                f"INSERT INTO {tname} ({', '.join(cols_list)}) VALUES %s "
                f"ON CONFLICT DO NOTHING"
            )
            vals = [tuple(row[c] for c in cols_list) for row in rows]
            execute_values(cur, sql, vals, page_size=500)
            print(f"  {tname}: {len(vals)} rows")
        conn.commit()
        print("Done. All tables committed.")
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    load_and_insert()
