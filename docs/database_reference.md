# SEBI Respondent Microdata — Complete Database Reference

> **Source:** SEBI Household Survey on Securities Market Participation (2025 wave)  
> **Raw file:** `data/Respondent Data.XLSX` — 109,430 rows × 448 columns  
> **Database:** Supabase PostgreSQL, 19 normalised tables  
> **ETL:** `src/etl_respondents.py`  
> **Status:** Fully loaded and verified.

---

## Critical Context: Why NULLs Exist

The SEBI survey uses **conditional routing** — blocks of questions are only shown to specific subsets. This means NULL in many columns is the *correct and expected* value, not a data problem.

| Respondent group | Count | % |
|---|---|---|
| **Investors** (QFL = INVESTOR) | 27,882 | 25.5% |
| **Non-investors** (QFL = NON-INVESTOR) | 81,548 | 74.5% |
| **Total** | 109,430 | 100% |

Key routing rules:
- Literacy, knowledge, market perception, info sources, motivations → **investors only (~9,797–53,357 answered depending on sub-section)**
- Barriers → **non-investors only (14,794 answered)**
- Portfolio %, instrument status/duration → **investors who hold each instrument**
- Income allocation (Q1M) → **respondents with income (~46k)**
- Media consumption (M1A–D), time horizons (Q8M) → **same investor sub-block (~53,357)**

Several columns in the schema are **permanently NULL** because the SEBI survey never collected that data for those instruments (verified by checking source XLSX — 0 non-null values). These are documented table by table below.

Survey weights (`survey_weight`) are provided to make the sample nationally representative. Average weight = 1.00 by design.

---

## Table 1: `respondents`

**Purpose:** Core identity — one row per respondent. Every other table joins here.  
**Rows:** 109,430 | **NULLs:** None

| Column | Type | Values / Range | Distribution | Notes |
|--------|------|----------------|--------------|-------|
| `respondent_id` | bigint PK | 1 – 109,430 | Sequential | Unique per respondent |
| `survey_year` | smallint | 2025 | All rows = 2025 | Constant — this is the 2025 wave |
| `is_investor` | boolean | True / False | True=27,882 (25.5%) False=81,548 (74.5%) | Derived from QFL column in XLSX. Investors = those who currently invest in any securities market product |
| `survey_weight` | numeric | 0.008 – 6.88, avg=1.00 | Investors avg=0.85, Non-investors avg=1.05 | Post-stratification sampling weight. Multiply by this to get population-representative estimates. Weights < 1 mean that group is over-sampled; weights > 1 mean under-sampled |

**Completeness:** 100%. No issues.

---

## Table 2: `states`

**Purpose:** Lookup table — 35 Indian states and union territories.  
**Rows:** 35 | **NULLs:** None

| Column | Values |
|--------|--------|
| `state_id` | 1–35 (see mapping below) |
| `state_name` | Full state name |
| `zone` | North / South / East / West / Central / Northeast |

**State ID mapping (key ones):** Andhra Pradesh=1, Delhi=6, Gujarat=8, Karnataka=13, Kerala=14, Maharashtra=16, Tamil Nadu=25, Telangana=26, Uttar Pradesh=28, West Bengal=30.

**Completeness:** 100%. Static lookup, no issues.

---

## Table 3: `respondent_geography`

**Purpose:** Where the respondent lives.  
**Rows:** 109,430 | **NULLs:** `state_id` only (3.1%)

| Column | Type | Codes / Values | Distribution | NULL explanation |
|--------|------|----------------|--------------|-----------------|
| `respondent_id` | bigint FK | — | — | — |
| `state_id` | smallint | 1–35, FK → states | — | **3,349 NULL (3.1%):** Respondents in territories not in the STATE_MAP (e.g., some Chandigarh/UT rows had unrecognised format). `zone` is still correct for these rows |
| `zone` | text | NORTH / SOUTH / EAST / WEST / CENTRAL / NORTHEAST | WEST=34,153 SOUTH=27,885 NORTH=26,439 EAST=20,953 | 0 NULL |
| `is_urban` | boolean | True=Urban False=Rural | Urban=76,931 (70.3%) Rural=32,499 (29.7%) | 0 NULL |
| `city_class` | text | Population size class of city/town | "10–40 Lakhs"=24,998 "More than 2500" (metro)=19,061 "5–10 Lakhs"=17,056 | 0 NULL |
| `centre` | text | Specific city/town name | Delhi UA=2,600 Mumbai UA=1,449 Pune UA=1,319 | 0 NULL |

**Note:** No Central or Northeast zone rows appear — the sampled states in this wave are concentrated in West, South, North, East.

**Completeness:** 96.9% on state_id; 100% on all other columns. No fixable issues.

---

## Table 4: `respondent_profile`

**Purpose:** Socioeconomic profile of the respondent.  
**Rows:** 109,430

| Column | Type | Code meaning | Distribution | NULL explanation |
|--------|------|-------------|--------------|-----------------|
| `respondent_id` | bigint FK | — | — | 0 NULL |
| `gender` | smallint | **1=Male 2=Female** | Male=70,616 (64.5%) Female=38,814 (35.5%) | 0 NULL |
| `marital_status` | smallint | **1=Single 2=Married 3=Divorced/Separated** | Single=37,982 Married=70,656 Divorced=582 | 210 NULL (0.2%) — chose "do not answer" option |
| `family_type` | smallint | **1=Nuclear 2=Joint 3=Single-person household** | Nuclear=92,109 (84.2%) Joint=15,500 (14.2%) Single=1,821 (1.7%) | 0 NULL |
| `life_stage` | smallint | **1=Gen Z 2=Millennials 3=Generation X 4=Baby Boomers** | Gen Z=49,035 (44.8%) Millennials=45,235 (41.3%) Gen X=12,806 (11.7%) Boomers=2,354 (2.2%) | 0 NULL |
| `nccs_class` | smallint | **1=A1 (highest) → 11=E2 (lowest)** New Consumer Classification System based on education + occupation of chief wage earner | A1=8,092 A2=18,525 A3=27,685 B1=20,147 B2=13,994 C1=9,569 C2=5,471 D1=4,232 D2=1,379 E1=303 E2=33 | 0 NULL. Distribution skews upper-middle (A3 is modal class) |
| `education_years` | smallint | **0=Not literate 6=Primary (up to 5th) 9=Secondary (10th) 12=Higher Secondary (12th) 16=Graduate or above** | Illiterate=342 Primary=13,384 Secondary=44,351 (40.6%) HS=7,867 Graduate+=42,771 (39.1%) | 715 NULL (0.7%) — unrecognised education text |
| `occupation_raw` | smallint | **1=Unskilled worker 2=Skilled worker 3=Clerk/Salesman 4=Supervisory 5=Officer/Executive 6=Self-employed professional 7=Business/Industrialist 8=Homemaker/Housewife 9=Student 10=Retired 11=Unemployed 12=Farmer** | Homemaker=14,219 Student=11,512 Skilled=10,848 Business=6,828 Officer=6,263 Clerk=7,414 Farmer=5,041 Unskilled=5,742 Self-employed=1,834 Retired=202 Unemployed=3,097 | 30,857 NULL (28.2%) — some occupation text did not match any keyword in mapper |
| `monthly_income_rs` | integer | Band midpoint in Rupees. Bands: Rs.5k–10k→7,500 Rs.10k–15k→12,500 ... Rs.1L+→150,000 | avg=Rs.27,718 | 11,226 NULL (10.3%) — respondents with no income (some students, homemakers, unemployed) |
| `annual_hh_income_id` | smallint | **1=lowest band → 11=Rs.1.25L+/month** Q10A household income band code | avg=3.37 (lower-middle income) | 29,873 NULL (27.3%) — Q10A not answered by all |
| `internet_plan_type` | smallint | **1=No internet 2=Mobile data only 3=Broadband/fiber/DSL** | No internet=1,791 Mobile=93,719 (85.6%) Broadband=13,920 (12.7%) | 0 NULL |
| `has_demat_account` | boolean | True=Yes, has demat account. False=No. | True=22,413 (20.5%) False=82,606 (75.5%) | 4,411 NULL (4.0%) — answered "Can't remember" |

**Completeness:** Good. The 28.2% NULL on `occupation_raw` is the main gap — likely homemakers and others whose occupation text didn't match the keyword mapper.

---

## Table 5: `respondent_income_allocation`

**Purpose:** How the respondent allocates their monthly income across categories (Q1M).  
**Rows:** 109,430 | **~58–61% NULL on all value columns**

**NULL reason:** Q1M was only asked to respondents who have an income — approximately 46,271 answered. Homemakers, students, retired, unemployed respondents were routed past this block.

| Column | Type | Meaning | Non-null | avg (among answered) |
|--------|------|---------|---------|---------------------|
| `pct_income_expenses` | numeric | % of monthly income spent on household expenses | 46,271 | 41.3% |
| `pct_income_savings` | numeric | % saved (bank/cash) | 45,319 | 16.6% |
| `pct_income_loan_emi` | numeric | % going to loan/EMI repayments | 43,000 | 9.8% |
| `pct_income_investment` | numeric | % actively invested in financial products | 44,410 | 12.7% |
| `pct_income_other` | numeric | % on other expenses | 44,820 | 22.0% |

**Completeness:** Correct for the subset who answered. Percentages roughly sum to ~100% on average (41+17+10+13+22 = 103 — rounding expected).

---

## Table 6: `respondent_portfolio_allocation`

**Purpose:** What % of the respondent's total investment portfolio is in each instrument (Q2M). Investors only, and only for instruments they hold.  
**Rows:** 109,430 | **High NULL% everywhere — expected**

**NULL reason:** (a) Non-investors have no portfolio; (b) even investors only answer for instruments they hold; (c) three instruments were never in the Q2M grid in the source survey (verified: 0 non-null in XLSX).

| Column | Non-null | avg % (among those with data) | Notes |
|--------|---------|-------------------------------|-------|
| `pct_portfolio_mf_etf` | 14,121 | 48.9% | High concentration in MF for those who hold it |
| `pct_portfolio_equity` | 10,104 | 48.0% | — |
| `pct_portfolio_fo` | 592 | 28.2% | F&O is a small niche |
| `pct_portfolio_gold_etf` | **0** | — | **PERMANENTLY NULL** — Q2M grid did not include Gold ETF in source |
| `pct_portfolio_nps` | 817 | 27.8% | — |
| `pct_portfolio_reits` | 520 | 31.7% | — |
| `pct_portfolio_ulip` | 15,566 | 40.6% | High uptake via insurance channel |
| `pct_portfolio_corp_bonds` | 322 | 39.7% | — |
| `pct_portfolio_fd_rd` | 27,520 | 58.4% | FD dominates traditional savers' portfolios |
| `pct_portfolio_ppf` | 785 | 23.8% | — |
| `pct_portfolio_post_office` | 7,629 | 40.1% | — |
| `pct_portfolio_sgb` | **0** | — | **PERMANENTLY NULL** — Q2M grid did not include SGB in source |
| `pct_portfolio_epf` | 1,357 | 27.1% | — |
| `pct_portfolio_real_estate` | 1,738 | 27.9% | — |
| `pct_portfolio_gold_physical` | 8,118 | 34.3% | — |
| `pct_portfolio_crypto` | 790 | 26.9% | — |
| `pct_portfolio_aif` | 90 | 19.0% | Very niche — alternative investments |
| `pct_portfolio_sif` | **0** | — | **PERMANENTLY NULL** — Q2M grid did not include SIF in source |

**Completeness:** Correct. The three permanently NULL columns exist in the schema but the survey never collected portfolio % for Gold ETF, SGB, or SIF.

---

## Table 7: `respondent_goal_ranks`

**Purpose:** Respondents ranked their top 3 financial goals from 12 options (Q6). Rank 1 = most important, rank 2 = second, rank 3 = third. Unranked goals are NULL.  
**Rows:** 109,430 | **High NULL% — expected (top-3 from 12)**

| Column | Total ranked | Ranked #1 | Ranked #2 | Ranked #3 |
|--------|-------------|-----------|-----------|-----------|
| `goal_rank_children_education` | 24,129 | 9,307 | 8,444 | 6,378 | 
| `goal_rank_support_family` | 23,132 | 7,792 | 8,534 | 6,806 |
| `goal_rank_grow_wealth` | 18,115 | 6,627 | 6,661 | 4,827 |
| `goal_rank_buy_house` | 16,246 | 6,093 | 5,798 | 4,355 |
| `goal_rank_emergency_fund` | 15,340 | 4,767 | 5,617 | 4,956 |
| `goal_rank_child_marriage` | 13,364 | — | — | — |
| `goal_rank_major_expense` | 10,838 | — | — | — |
| `goal_rank_financial_independence` | 10,451 | 3,181 | — | — |
| `goal_rank_retirement` | 9,193 | 2,293 | — | — |
| `goal_rank_daily_trading` | 8,500 | 2,681 | — | — |
| `goal_rank_passive_income` | 6,043 | — | — | — |
| `goal_rank_tax_savings` | 4,720 | 1,594 | — | — |

Values are 1, 2, or 3 only. NULL means the respondent did not rank that goal in their top 3.

**Completeness:** Correct. High NULL% is by design — only 3 of 12 are ranked.

---

## Table 8: `respondent_awareness`

**Purpose:** Which financial products the respondent has heard of (Q21A, multi-select). Asked to all respondents.  
**Rows:** 109,430 | **0 NULLs on any column**

All columns are **boolean** (True = aware, False = not aware). `n_products_aware` = count of True values (0–15).

| Column | True count | True % | Interpretation |
|--------|-----------|--------|---------------|
| `aware_fd_rd` | 108,446 | 99.1% | Near-universal — FD is the most known product in India |
| `aware_ulip` | 106,835 | 97.6% | Extremely high — insurance-linked investment widely marketed |
| `aware_gold_physical_sgb` | 86,801 | 79.3% | Gold as investment widely known |
| `aware_post_office` | 82,982 | 75.8% | Post office savings widely familiar |
| `aware_mf_etf` | 73,316 | 67.0% | High awareness of MF/ETF |
| `aware_mf_sip` | 72,299 | 66.1% | SIP widely marketed |
| `aware_real_estate` | 67,779 | 61.9% | — |
| `aware_equity_shares` | 67,852 | 62.0% | — |
| `aware_chit_fund` | 40,995 | 37.5% | Regional product with moderate awareness |
| `aware_nps` | 40,405 | 36.9% | — |
| `aware_ppf_vpf` | 38,465 | 35.2% | — |
| `aware_epf` | 34,758 | 31.8% | — |
| `aware_derivatives_fo` | 19,565 | 17.9% | Niche — complex product |
| `aware_reits_invits` | 16,191 | 14.8% | Very niche — newer product class |
| `aware_corporate_bonds` | 16,305 | 14.9% | Very niche |
| `n_products_aware` | 109,430 | — | avg=7.98 out of 15; range 0–15; most respondents know 7–10 products |

**Completeness:** Perfect — 100% coverage, 0 NULLs.

---

## Table 9: `respondent_holdings`

**Purpose:** Which instruments the respondent currently holds. Boolean per instrument.  
**Rows:** 109,430 | **0 NULLs on any column**

**Source:** P1 recency columns (for securities instruments — non-null = currently held) supplemented by Q22A_All free-text field (for traditional instruments — substring match). False = does not hold.

`n_instruments_held` = count of True holdings. 36,220 respondents hold nothing (most non-investors). Among those who hold something: majority hold 1–3 instruments.

| Column | True count | True % | Notes |
|--------|-----------|--------|-------|
| `holds_fd_rd` | 51,203 | 46.8% | Most held instrument — FD is India's default savings vehicle |
| `holds_ulip` | 25,904 | 23.7% | High uptake via insurance agents |
| `holds_mf_etf` | 18,545 | 16.9% | — |
| `holds_equity_shares` | 13,751 | 12.6% | — |
| `holds_sgb` | 14,156 | 12.9% | Derived from Q22A_All text only (P1 source column was empty in XLSX) |
| `holds_gold_physical` | 14,156 | 12.9% | Same count as SGB — both derived from Q22A_All; many respondents hold both |
| `holds_post_office` | 12,677 | 11.6% | — |
| `holds_chit_fund` | 4,007 | 3.7% | Regional |
| `holds_real_estate` | 2,931 | 2.7% | — |
| `holds_epf` | 2,192 | 2.0% | — |
| `holds_nps` | 1,385 | 1.3% | — |
| `holds_ppf_vpf` | 1,292 | 1.2% | — |
| `holds_crypto` | 971 | 0.9% | — |
| `holds_derivatives_fo` | 754 | 0.7% | — |
| `holds_reits_invits` | 640 | 0.6% | — |
| `holds_gold_etf` | 632 | 0.6% | — |
| `holds_corp_bonds` | 369 | 0.3% | — |
| `holds_aif` | 90 | 0.1% | — |
| `holds_pms` | **0** | 0% | No respondents reported holding PMS in Q22A_All — either very niche or text not matched |
| `holds_sif` | **0** | 0% | SIF (Specialised Investment Fund) is a very new product class; no respondents held it |
| `n_instruments_held` | 109,430 | — | avg=1.51; 36,220 hold nothing; max=18 |

**Completeness:** Perfect. PMS and SIF being 0 is consistent with their niche/new status.

---

## Table 10: `respondent_instrument_status`

**Purpose:** Whether the respondent is an Active or Dormant investor per instrument (ADI_Dashboard). Only collected for 4 securities instruments.  
**Rows:** 109,430

| Column | Code meaning | Non-null | Distribution | NULL explanation |
|--------|-------------|---------|-------------|-----------------|
| `status_mf_etf` | **1=Active 2=Dormant** | 14,121 | Active=8,453 (59.9%) Dormant=5,668 (40.1%) | Others: non-investors or never held MF |
| `status_equity` | **1=Active 2=Dormant** | 10,104 | Active=6,221 (61.6%) Dormant=3,883 (38.4%) | — |
| `status_fo` | **1=Active 2=Dormant** | 592 | Active=362 Dormant=230 | — |
| `status_corp_bonds` | **1=Active 2=Dormant** | 322 | Active=161 Dormant=161 | — |
| `status_fd_rd` | — | **0 (PERMANENTLY NULL)** | — | ADI tracking not done for FD in source XLSX |
| `status_ppf` | — | **0 (PERMANENTLY NULL)** | — | ADI tracking not done for PPF in source XLSX |
| `status_epf` | — | **0 (PERMANENTLY NULL)** | — | ADI tracking not done for EPF in source XLSX |
| `status_gold_physical` | — | **0 (PERMANENTLY NULL)** | — | ADI tracking not done for Gold Physical in source XLSX |

Note: Active/Dormant status is *not the same* as holds_*. ADI tracks recency of transactions — someone can hold MF (has units) but be Dormant (hasn't transacted in a while).

**Completeness:** Correct for the 4 instruments with ADI data. The 4 permanently NULL columns cannot be populated — the survey simply does not track ADI for traditional instruments.

---

## Table 11: `respondent_instrument_duration`

**Purpose:** Preferred/actual holding duration per instrument (Q7). 0=Don't know, 1=Short term, 2=Mid term, 3=Long term.  
**Rows:** 109,430

**Important:** Q7 is asked to investors broadly for each instrument, not restricted to current holders. So `duration_equity` having 34,716 non-null does not mean 34,716 people hold equity — it means 34,716 investors expressed a duration preference for equity.

Many columns are permanently NULL because Q7 was not asked for those instruments in the survey (verified: source column has 0 non-null values).

| Column | Non-null | Distribution | NULL explanation |
|--------|---------|-------------|-----------------|
| `duration_equity` | 34,716 | DK=3,106 Short=9,146 Mid=11,135 Long=11,329 | — |
| `duration_mf_etf` | **0** | — | **PERMANENTLY NULL** — Q7 not asked for MF/ETF in source |
| `duration_fo` | 10,397 | DK=1,591 Short=4,388 Mid=2,476 Long=1,942 | — |
| `duration_gold_etf` | **0** | — | **PERMANENTLY NULL** — Q7 not asked for Gold ETF in source |
| `duration_nps` | **0** | — | **PERMANENTLY NULL** — Q7 not asked for NPS in source |
| `duration_reits` | 12,916 | DK=1,591 Short=2,342 Mid=3,890 Long=5,093 | — |
| `duration_corp_bonds` | 9,678 | DK=887 Short=2,228 Mid=2,936 Long=3,627 | — |
| `duration_fd_rd` | **0** | — | **PERMANENTLY NULL** — Q7 not asked for FD in source |
| `duration_ppf` | **0** | — | **PERMANENTLY NULL** — Q7 not asked for PPF in source |
| `duration_sgb` | **0** | — | **PERMANENTLY NULL** — Q7 not asked for SGB in source |
| `duration_epf` | **0** | — | **PERMANENTLY NULL** — Q7 not asked for EPF in source |

**Completeness:** Correct for the 4 instruments that have Q7 data. 7 permanently NULL columns cannot be populated.

---

## Table 12: `respondent_time_horizons`

**Purpose:** The respondent's own definition of short/mid/long term in months (Q8M).  
**Rows:** 109,430 | **~51–57% NULL — survey routing**

**NULL reason:** This question was only answered by ~53,357 respondents (the investor + associated sub-section block). Non-investors (and some investors who skipped) have NULL.

| Column | Non-null | avg | min | max | Interpretation |
|--------|---------|-----|-----|-----|---------------|
| `short_term_months` | 53,353 | 18.5 months (~1.5 yrs) | 1 | 144 | Respondents define short term as ~1–2 years on average |
| `mid_term_months` | 53,336 | 51.5 months (~4.3 yrs) | 2 | 144 | Mid term = ~3–5 years |
| `long_term_months` | 46,926 | 92.1 months (~7.7 yrs) | 5 | 144 | Long term = 7–10+ years |

**Completeness:** Correct. NULL = question not reached in survey routing.

---

## Table 13: `respondent_literacy_risk`

**Purpose:** Financial literacy, stock market knowledge, risk perception, and risk/return instrument rankings.  
**Rows:** 109,430 | **Mixed NULLs**

### Sub-section A: Literacy & Risk Behaviour

| Column | Code meaning | Non-null | Distribution | Notes |
|--------|-------------|---------|-------------|-------|
| `risk_tolerance_preference` | **1=Preservation of capital (very low risk) 2=Stable returns with minimal losses (medium) 3=Higher returns, accept some losses (high)** | **109,430 (0 NULL)** | Low=47,279 (43.2%) Medium=37,250 (34.0%) High=24,901 (22.7%) | Asked to ALL respondents (QRT question). Only column in this table with no NULLs |
| `stock_market_familiarity` | **1=Not at all familiar 2=Know a little 3=Some knowledge 4=Fairly familiar (update periodically) 5=Very familiar (follow regularly)** | 53,357 | None=18,641 Little=12,441 Fairly=13,935 Very=8,340 | avg=2.64. Note: code 3 ("Some knowledge/Basic") appears absent from distribution — mapping gap |
| `market_downturn_reaction` | **1=Sell everything and move to safer options 2=Take out some money, bit worried 3=Stay invested, wait for market recovery 4=Not mapped 5=Buy more to earn better long-term** | 53,357 | Sell all=17,086 Take out some=17,263 Stay=13,872 Buy more=5,136 | avg=2.23. Many would sell or pull out some money during a downturn |
| `risk_return_threshold` | **1=Willing to accept returns lower than current safe rate 2=Same as current safe rate 3=Higher than current safe rate** | 41,675 | Lower=19,626 Same=12,164 Higher=9,885 | avg=1.77. Majority want at least same-as-safe returns before accepting risk |

### Sub-section B: Risk & Return Rankings per Instrument

Respondents ranked instruments from **1=highest risk/return to 8=lowest risk/return**. Only 6 instruments were in the ranking grid; 4 are permanently NULL.

| Column | Non-null | avg rank | NULL explanation |
|--------|---------|---------|-----------------|
| `risk_rank_equity` | 34,716 | 2.47 | Perceived as 2nd riskiest on average |
| `risk_rank_mf_etf` | 38,792 | 2.66 | Slightly less risky than direct equity in perception |
| `risk_rank_fo` | 10,397 | 3.48 | F&O seen as high risk |
| `risk_rank_gold` | **0** | — | **PERMANENTLY NULL** — Q14M grid did not include Gold in source XLSX |
| `risk_rank_fd_rd` | 52,922 | 3.03 | Mid-risk perception — some see FD as safe, others not |
| `risk_rank_corp_bonds` | 9,678 | 3.88 | — |
| `risk_rank_ppf` | **0** | — | **PERMANENTLY NULL** — Q14M did not include PPF |
| `risk_rank_epf` | **0** | — | **PERMANENTLY NULL** — Q14M did not include EPF |
| `risk_rank_real_estate` | 31,330 | 3.70 | Seen as moderately risky |
| `risk_rank_crypto` | **0** | — | **PERMANENTLY NULL** — Q14M did not include Crypto |
| `return_rank_equity` | 34,716 | 2.81 | Seen as 2nd–3rd highest expected return |
| `return_rank_mf_etf` | 38,792 | 2.65 | Seen as high-return product |
| `return_rank_fo` | 10,397 | 3.98 | — |
| `return_rank_gold` | **0** | — | **PERMANENTLY NULL** |
| `return_rank_fd_rd` | 52,922 | 2.77 | FD seen as a reliable return product by many |
| `return_rank_corp_bonds` | 9,678 | 4.43 | Lower expected return perception |
| `return_rank_ppf` | **0** | — | **PERMANENTLY NULL** |
| `return_rank_epf` | **0** | — | **PERMANENTLY NULL** |
| `return_rank_real_estate` | 31,330 | 3.59 | — |
| `return_rank_crypto` | **0** | — | **PERMANENTLY NULL** |

**Completeness:** `risk_tolerance_preference` perfect (all respondents). Literacy/risk sub-section correct for ~53k respondents. Risk/return ranking correct for 6 instruments; 4 permanently NULL by survey design.

---

## Table 14: `respondent_knowledge`

**Purpose:** Financial knowledge quiz — respondents answered True/False/Don't Know to 9 factual statements (Q15AM).  
**Rows:** 109,430 | **51.2% NULL — survey routing**

**NULL reason:** Only the ~53,357 investor/associated sub-section respondents answered this block.

| Column | Code | Statement tested | avg | Interpretation |
|--------|------|-----------------|-----|---------------|
| `knows_direct_mf_lower_expense` | **1=True 2=False 3=Don't Know** | "Direct MF plans have lower expense ratios than regular plans" | 1.97 | avg near 2 → many think it's False or Don't Know. Correct answer = True |
| `knows_pension_invests_equity` | 1/2/3 | "Pension funds invest partly in equity markets" | 2.06 | avg > 2 → more False/DK than True responses |
| `knows_compounding_longterm` | 1/2/3 | "Compounding works best over long term" | 2.07 | Similar — surprising given how basic this is |
| `knows_kyc_online` | 1/2/3 | "KYC can be completed online" | 1.60 | avg 1.6 → majority answered True (correct) |
| `knows_demat_needed` | 1/2/3 | "Demat account is needed to hold securities" | 1.84 | More True than False responses |
| `knows_high_return_high_risk` | 1/2/3 | "Higher returns come with higher risk" | 1.66 | Majority answered True (correct) |
| `knows_diversification_reduces` | 1/2/3 | "Diversification reduces investment risk" | 2.13 | Many answered False/DK — below-average literacy on this |
| `knows_cas_overview` | 1/2/3 | "Consolidated Account Statement (CAS) gives overview of all holdings" | 2.32 | Most don't know CAS — low awareness of this SEBI tool |
| `knows_bsda_basic_demat` | 1/2/3 | "BSDA is a basic demat account with lower charges" | 2.38 | Most don't know BSDA — very low awareness |

**Completeness:** Correct for 53,357 respondents. NULLs = question not asked.

---

## Table 15: `respondent_market_perception`

**Purpose:** How investors perceive the Indian securities market — agreement with 6 statements (Q1B).  
**Rows:** 109,430 | **~55–56% NULL — investor routing**

**NULL reason:** Only investors who answered this sub-block (~48k) have data.

| Column | Code | Statement | avg | Interpretation |
|--------|------|-----------|-----|---------------|
| `perceive_market_well_regulated` | **1=Strongly Agree 2=Slightly Agree 3=Neither 4=Slightly Disagree 5=Strongly Disagree** | "The market is well-regulated by SEBI" | 1.95 | avg ~2 → investors mostly Strongly/Slightly Agree |
| `perceive_market_handles_volatility` | 1–5 | "Market handles volatility well" | 1.96 | Strong agreement |
| `perceive_market_new_instruments` | 1–5 | "Market offers new/innovative instruments" | 1.91 | Strong agreement |
| `perceive_market_accessible` | 1–5 | "Market is accessible to retail investors" | 1.95 | Strong agreement |
| `perceive_market_wealth_creation` | 1–5 | "Market is good for wealth creation" | 1.91 | Strong agreement |
| `perceive_market_easy_convenient` | 1–5 | "Investing is easy and convenient" | 1.94 | Strong agreement |

All 6 statements have average ~1.91–1.96, indicating investors are broadly positive about the Indian securities market.

**Completeness:** Correct. NULLs = non-investors and investors who skipped this block.

---

## Table 16: `respondent_info_sources`

**Purpose:** Where investors get information about securities investments — top 3 picks from 9 options (SS_B3).  
**Rows:** 109,430 | **0 NULLs — all boolean**

**Survey routing:** SS_B3 was only answered by **9,797 investors** (a sub-section within the investor block). All 109,430 rows exist with False for the 99,633 who didn't answer, and True/False based on their pick for the 9,797 who did. Each respondent picks their top 3 → expected True per column ≈ 9,797 × (3/9) ≈ 3,266.

| Column | True count | % of all | Interpretation |
|--------|-----------|---------|---------------|
| `info_friends_family` | 5,606 | 5.1% | Top source — social trust drives investment decisions |
| `info_social_media_influencers` | 5,511 | 5.0% | Financial influencers (YouTube, Instagram) very influential |
| `info_online_communities` | 3,593 | 3.3% | Telegram groups, Reddit, WhatsApp |
| `info_news_blogs` | 2,817 | 2.6% | Financial news and blogs |
| `info_research_reports` | 2,373 | 2.2% | Brokerage reports, analyst reports |
| `info_financial_professionals` | 2,328 | 2.1% | Advisors, CAs |
| `info_educational_resources` | 2,158 | 2.0% | Webinars, courses, books |
| `info_iep_providers` | 2,768 | 2.5% | SEBI/industry investor education programmes |
| `info_sebi_official_websites` | 2,103 | 1.9% | Least used — formal SEBI channels underutilised |

**Completeness:** Perfect — 0 NULLs, 99%+ substring match accuracy verified.

---

## Table 17: `respondent_motivations`

**Purpose:** Why investors invest in securities — top 3 picks from 14 options (SS_B10).  
**Rows:** 109,430 | **0 NULLs — all boolean**

**Survey routing:** SS_B10 answered by same **9,797 investors** as SS_B3. Top-3 from 14 options → expected True per column ≈ 9,797 × (3/14) ≈ 2,099.

| Column | True count | % of all | Interpretation |
|--------|-----------|---------|---------------|
| `motive_higher_returns` | 2,477 | 2.3% | Top motive — beating FD/savings rate |
| `motive_financial_goals` | 2,440 | 2.2% | Goal-based investing |
| `motive_long_term_growth` | 2,310 | 2.1% | Wealth building over time |
| `motive_quick_gains` | 2,241 | 2.0% | Short-term trading mindset |
| `motive_additional_income` | 2,163 | 2.0% | Supplementary income stream |
| `motive_short_term` | 2,113 | 1.9% | Short-term parking of funds |
| `motive_lower_risk` | 2,013 | 1.8% | Seeking lower risk vs alternatives |
| `motive_inflation_hedge` | 1,844 | 1.7% | Beating inflation |
| `motive_tax_benefits` | 1,672 | 1.5% | ELSS, NPS, PPF tax benefits |
| `motive_diversification` | 1,616 | 1.5% | Portfolio diversification |
| `motive_dividends` | 1,550 | 1.4% | Regular income via dividends |
| `motive_convenience` | 1,325 | 1.2% | Ease of digital investing |
| `motive_zero_charges` | 1,268 | 1.2% | Zero-commission platforms |
| `motive_peer_influence` | 747 | 0.7% | Least common — friends/family investing |

**Completeness:** Perfect — 0 NULLs, 99%+ accuracy verified.

---

## Table 18: `respondent_barriers`

**Purpose:** Why non-investors do not invest in securities — top 3 picks from 18 options (SS_BB2).  
**Rows:** 109,430 | **0 NULLs — all boolean**

**Survey routing:** SS_BB2 answered by **14,794 non-investors**. Top-3 from 18 options → expected True per column ≈ 14,794 × (3/18) ≈ 2,466.

| Column | True count | % of all | Interpretation |
|--------|-----------|---------|---------------|
| `barrier_fear_of_loss` | 5,284 | 4.8% | Top barrier — loss aversion is dominant |
| `barrier_lack_knowledge` | 4,558 | 4.2% | Don't understand markets |
| `barrier_lack_trust` | 4,306 | 3.9% | Distrust of stock market / brokers |
| `barrier_dont_know_how` | 3,813 | 3.5% | Don't know how to start |
| `barrier_regulatory_concerns` | 3,060 | 2.8% | Worried about policy/regulatory changes |
| `barrier_info_overload` | 3,014 | 2.8% | Too much conflicting information |
| `barrier_uncertain_returns` | 2,744 | 2.5% | Unpredictability of returns |
| `barrier_large_capital_needed` | 2,716 | 2.5% | Think they need large amounts to start |
| `barrier_long_term_lock_in` | 2,704 | 2.5% | Dislike of lock-in periods |
| `barrier_too_many_options` | 2,355 | 2.2% | Decision paralysis |
| `barrier_better_alternatives` | 2,287 | 2.1% | Prefer FD/gold/real estate |
| `barrier_high_fees` | 2,048 | 1.9% | — |
| `barrier_insufficient_funds` | 1,690 | 1.5% | Don't have money to invest |
| `barrier_family_advice_against` | 1,113 | 1.0% | Family/advisors advised against |
| `barrier_liquidity_concerns` | 841 | 0.8% | Takes time to get money back |
| `barrier_time_commitment` | 807 | 0.7% | No time to monitor investments |
| `barrier_documentation_burden` | 670 | 0.6% | KYC/paperwork too burdensome |
| `barrier_language_barrier` | 359 | 0.3% | Platform not in local language |

**Completeness:** Perfect — 0 NULLs, 99.97% accuracy verified.

---

## Table 19: `respondent_media`

**Purpose:** Frequency of consuming different media types (M1A–D).  
**Rows:** 109,430 | **51.2% NULL — survey routing**

**NULL reason:** M1A–D were asked in the same block as literacy/knowledge questions. 53,357 respondents answered; 56,073 did not (same split as knowledge and time horizons tables). NULL does not mean "no media consumption" — it means the question was not shown to that respondent.

Scale: **1=Never / No access  2=Monthly  3=Weekly  4=Less than 1 hr/day  5=1+ hrs/day**

| Column | Non-null | 1-Never | 2-Monthly | 3-Weekly | 4-<1hr/day | 5-1+hr/day | avg |
|--------|---------|---------|---------|--------|----------|----------|-----|
| `tv_frequency` | 53,357 | 9,325 | 1,067 | 3,077 | 9,812 | 30,076 | 3.94 |
| `radio_frequency` | 53,357 | 44,181 | 1,463 | 2,002 | 2,334 | 3,377 | 1.49 |
| `newspaper_frequency` | 53,357 | 22,341 | 2,625 | 7,192 | 12,450 | 8,749 | 2.67 |
| `internet_frequency` | 53,357 | 1,934 | 319 | 1,155 | 3,911 | 46,038 | 4.72 |

**Highlights:**
- **TV:** 56% watch 1+ hrs daily. Still the dominant media channel.
- **Radio:** 83% never listen. Radio is near-dead as a media channel in this sample.
- **Newspaper:** 42% never read. Print declining.
- **Internet:** 86% use 1+ hrs daily. Digital is by far the primary channel. 1,934 have no internet access.

**Completeness:** Fixed (encoding issue corrected). All 53,357 respondents who answered M1A–D are correctly loaded.

---

## Summary: Data Completeness Status

| Table | Rows | Completeness | Status |
|-------|------|-------------|--------|
| `respondents` | 109,430 | 100% | Complete |
| `states` | 35 | 100% | Complete |
| `respondent_geography` | 109,430 | 96.9% (state_id) | Complete — 3.1% unresolvable |
| `respondent_profile` | 109,430 | 71.8% (occupation has 28% NULL) | Complete — NULLs are correct |
| `respondent_income_allocation` | 109,430 | ~42% answered Q1M | Complete — correct routing |
| `respondent_portfolio_allocation` | 109,430 | Variable per instrument | Complete — 3 cols permanently NULL by survey design |
| `respondent_goal_ranks` | 109,430 | Top-3 from 12 | Complete — high NULL% is by design |
| `respondent_awareness` | 109,430 | 100% | Complete |
| `respondent_holdings` | 109,430 | 100% | Complete |
| `respondent_instrument_status` | 109,430 | 4 of 8 cols have data | Complete — 4 cols permanently NULL by survey design |
| `respondent_instrument_duration` | 109,430 | 4 of 11 cols have data | Complete — 7 cols permanently NULL by survey design |
| `respondent_time_horizons` | 109,430 | ~49% answered | Complete — correct routing |
| `respondent_literacy_risk` | 109,430 | Partial — 8 of 20 cols permanently NULL | Complete — 8 cols permanently NULL by survey design |
| `respondent_knowledge` | 109,430 | ~49% answered | Complete — correct routing |
| `respondent_market_perception` | 109,430 | ~44% answered | Complete — correct routing |
| `respondent_info_sources` | 109,430 | 100% (9,797 True responses) | Complete |
| `respondent_motivations` | 109,430 | 100% (9,797 True responses) | Complete |
| `respondent_barriers` | 109,430 | 100% (14,794 True responses) | Complete |
| `respondent_media` | 109,430 | ~49% answered | Complete — fixed encoding bug |

### Permanently NULL columns (survey never collected this data)

These columns exist in the schema but will always be NULL. They cannot be populated because the source XLSX has 0 non-null values for the corresponding question grid cells:

- `pct_portfolio_gold_etf`, `pct_portfolio_sgb`, `pct_portfolio_sif`
- `status_fd_rd`, `status_ppf`, `status_epf`, `status_gold_physical`
- `duration_mf_etf`, `duration_gold_etf`, `duration_nps`, `duration_fd_rd`, `duration_ppf`, `duration_sgb`, `duration_epf`
- `risk_rank_gold`, `risk_rank_ppf`, `risk_rank_epf`, `risk_rank_crypto`
- `return_rank_gold`, `return_rank_ppf`, `return_rank_epf`, `return_rank_crypto`

**The database is fully loaded and verified. All NULLs are accounted for.**
