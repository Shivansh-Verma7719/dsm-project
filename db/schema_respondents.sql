-- ============================================================
-- SEBI Household Securities Participation — Respondent Microdata
-- Metrics DB: one row per respondent, no free text, all analytic
-- ============================================================

-- ── Lookup: states ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS states (
    state_id    smallint PRIMARY KEY,
    state_name  text     NOT NULL,
    zone        text     NOT NULL  -- North / South / East / West / Central / Northeast
);

INSERT INTO states VALUES
( 1,'Andhra Pradesh','South'),( 2,'Arunachal Pradesh','Northeast'),
( 3,'Assam','Northeast'),( 4,'Bihar','East'),( 5,'Chhattisgarh','Central'),
( 6,'Delhi','North'),( 7,'Goa','West'),( 8,'Gujarat','West'),
( 9,'Haryana','North'),(10,'Himachal Pradesh','North'),
(11,'Jammu & Kashmir','North'),(12,'Jharkhand','East'),
(13,'Karnataka','South'),(14,'Kerala','South'),
(15,'Madhya Pradesh','Central'),(16,'Maharashtra','West'),
(17,'Manipur','Northeast'),(18,'Meghalaya','Northeast'),
(19,'Mizoram','Northeast'),(20,'Nagaland','Northeast'),
(21,'Odisha','East'),(22,'Punjab','North'),
(23,'Rajasthan','North'),(24,'Sikkim','Northeast'),
(25,'Tamil Nadu','South'),(26,'Telangana','South'),
(27,'Tripura','Northeast'),(28,'Uttar Pradesh','North'),
(29,'Uttarakhand','North'),(30,'West Bengal','East'),
(31,'Andaman & Nicobar','South'),(32,'Chandigarh','North'),
(33,'Dadra & Nagar Haveli','West'),(34,'Lakshadweep','South'),
(35,'Puducherry','South')
ON CONFLICT DO NOTHING;

-- ── Reference: education ordinal (not used as FK; stored inline as years) ────
-- Not Literate=0, Primary=6, Secondary=9, Higher Secondary=12, Graduate=16

-- ============================================================
-- Main respondent fact table
-- Source columns → meaningful names mapping in comments
-- ============================================================
CREATE TABLE IF NOT EXISTS respondents (
    -- ── Identity ─────────────────────────────────────────────
    respondent_id       bigint  PRIMARY KEY,   -- Resp_ID_DP
    survey_year         smallint NOT NULL,      -- always 2025 for this file

    -- ── Geography ────────────────────────────────────────────
    state_id            smallint REFERENCES states(state_id),   -- SELECTED_STATE
    zone                text,                  -- Zone_DP  (North/South/East/West/Central/Northeast)
    is_urban            boolean,               -- URBANRURAL  (Urban=true)
    city_class          text,                  -- SELECTED_CLASS  (Metro / Town / etc.)
    centre              text,                  -- AOL_VAR_CENTRE  (city/town name)

    -- ── Socioeconomic profile ─────────────────────────────────
    is_investor         boolean  NOT NULL,     -- QFL
    gender              smallint,              -- Q1  (1=Male 2=Female)
    marital_status      smallint,              -- Q13 (1=Single 2=Married 3=Divorced 4=Widowed)
    family_type         smallint,              -- Q5A (1=Nuclear 2=Joint 3=Other)
    life_stage          smallint,              -- Life_Stage (coded)
    nccs_class          smallint,              -- SECNEW (New Consumer Classification System A1-E2)
    education_years     smallint,              -- Q3D → years of schooling (0/6/9/12/16)
    occupation_raw      smallint,              -- Q14 (raw numeric code)
    monthly_income_rs   integer,               -- Q10 → band midpoint in Rs. (12500/35000/75000/150000)
    annual_hh_income_id smallint,              -- Q10A (coded annual HH income band)
    internet_plan_type  smallint,              -- QC1 (1=No internet 2=Mobile data 3=Broadband etc.)
    has_demat_account   boolean,               -- Q29

    -- ── Income allocation (% of monthly income) ──────────────
    -- Source: Q1MXGrid[{_1..5}].Q1M
    pct_income_expenses   numeric,             -- monthly expenses share
    pct_income_savings    numeric,             -- savings share
    pct_income_loan_emi   numeric,             -- loan repayment share
    pct_income_investment numeric,             -- investment share
    pct_income_other      numeric,             -- other expenses share

    -- ── Portfolio allocation % across instruments (investors) ─
    -- Source: Q2MXGrid[{_n}].Q2M (proportion of portfolio)
    pct_portfolio_mf_etf     numeric,          -- MF + ETF
    pct_portfolio_equity     numeric,          -- Stocks / Shares
    pct_portfolio_fo         numeric,          -- Futures & Options
    pct_portfolio_gold_etf   numeric,          -- Gold ETF
    pct_portfolio_nps        numeric,          -- NPS
    pct_portfolio_reits      numeric,          -- REITs/InvITs
    pct_portfolio_ulip       numeric,          -- ULIPs
    pct_portfolio_corp_bonds numeric,          -- Corporate Bonds
    pct_portfolio_fd_rd      numeric,          -- FD / RD / Savings account
    pct_portfolio_ppf        numeric,          -- PPF/VPF
    pct_portfolio_post_office numeric,         -- Post office / KVP / NSC
    pct_portfolio_sgb        numeric,          -- Sovereign Gold Bond
    pct_portfolio_epf        numeric,          -- EPF
    pct_portfolio_real_estate numeric,         -- Real estate investment
    pct_portfolio_gold_physical numeric,       -- Physical gold
    pct_portfolio_crypto     numeric,          -- Cryptocurrency
    pct_portfolio_aif        numeric,          -- AIF
    pct_portfolio_sif        numeric,          -- SIF

    -- ── Financial goals (rank 1=most important, NULL=not ranked)
    -- Source: Q6_RANK_GRID[{_n}].Q6_RANK
    goal_rank_buy_house         smallint,
    goal_rank_children_education smallint,
    goal_rank_retirement        smallint,
    goal_rank_emergency_fund    smallint,
    goal_rank_grow_wealth       smallint,
    goal_rank_major_expense     smallint,
    goal_rank_passive_income    smallint,
    goal_rank_support_family    smallint,
    goal_rank_financial_independence smallint,
    goal_rank_child_marriage    smallint,
    goal_rank_tax_savings       smallint,
    goal_rank_daily_trading     smallint,

    -- ── Product awareness (all respondents) ───────────────────
    -- Source: Q21A (multi-coded; converted to boolean flags)
    aware_mf_sip            boolean,
    aware_equity_shares     boolean,
    aware_derivatives_fo    boolean,
    aware_corporate_bonds   boolean,
    aware_ppf_vpf           boolean,
    aware_nps               boolean,
    aware_fd_rd             boolean,
    aware_gold_physical_sgb boolean,
    aware_real_estate       boolean,
    aware_reits_invits      boolean,
    aware_mf_etf            boolean,
    aware_chit_fund         boolean,
    aware_epf               boolean,
    aware_post_office       boolean,
    aware_ulip              boolean,
    n_products_aware        smallint,          -- computed count of aware products

    -- ── Current holdings by instrument (investors) ────────────
    -- Source: GRIDxP1[{_n}].P1 (pre-coded per instrument, not multi-coded text)
    holds_mf_etf            boolean,           -- GRIDxP1[{_1_2}].P1
    holds_equity_shares     boolean,           -- GRIDxP1[{_4}].P1
    holds_derivatives_fo    boolean,           -- GRIDxP1[{_3}].P1
    holds_gold_etf          boolean,           -- GRIDxP1[{_5}].P1
    holds_nps               boolean,           -- GRIDxP1[{_6}].P1
    holds_reits_invits      boolean,           -- GRIDxP1[{_7}].P1
    holds_ulip              boolean,           -- GRIDxP1[{_8}].P1
    holds_chit_fund         boolean,           -- GRIDxP1[{_9}].P1
    holds_real_estate       boolean,           -- GRIDxP1[{_10}].P1
    holds_corp_bonds        boolean,           -- GRIDxP1[{_11}].P1
    holds_fd_rd             boolean,           -- GRIDxP1[{_12}].P1
    holds_ppf_vpf           boolean,           -- GRIDxP1[{_13}].P1
    holds_post_office       boolean,           -- GRIDxP1[{_14}].P1
    holds_sgb               boolean,           -- GRIDxP1[{_15}].P1
    holds_epf               boolean,           -- GRIDxP1[{_16}].P1
    holds_pms               boolean,           -- GRIDxP1[{_17}].P1
    holds_gold_physical     boolean,           -- GRIDxP1[{_18}].P1
    holds_crypto            boolean,           -- GRIDxP1[{_19}].P1
    holds_aif               boolean,           -- GRIDxP1[{_20}].P1
    holds_sif               boolean,           -- GRIDxP1[{_21}].P1
    n_instruments_held      smallint,          -- computed

    -- ── Active / Dormant investor status per instrument ───────
    -- Source: ADI_Dashboard[{_n}].Slice  (1=Active 2=Dormant 3=Never)
    status_mf_etf           smallint,
    status_equity           smallint,
    status_fo               smallint,
    status_corp_bonds       smallint,
    status_fd_rd            smallint,
    status_ppf              smallint,
    status_epf              smallint,
    status_gold_physical    smallint,

    -- ── Holding duration by instrument (1=Short 2=Mid 3=Long 0=DK)
    -- Source: GridxQ7[{_n}].Q7
    duration_equity         smallint,          -- GridxQ7[{_4}].Q7
    duration_mf_etf         smallint,          -- GridxQ7[{_1_2}].Q7
    duration_fo             smallint,          -- GridxQ7[{_3}].Q7
    duration_gold_etf       smallint,          -- GridxQ7[{_5}].Q7
    duration_nps            smallint,          -- GridxQ7[{_6}].Q7
    duration_reits          smallint,          -- GridxQ7[{_7}].Q7
    duration_corp_bonds     smallint,          -- GridxQ7[{_11}].Q7
    duration_fd_rd          smallint,          -- GridxQ7[{_12}].Q7
    duration_ppf            smallint,          -- GridxQ7[{_13}].Q7
    duration_sgb            smallint,          -- GridxQ7[{_15}].Q7
    duration_epf            smallint,          -- GridxQ7[{_16}].Q7

    -- ── Respondent's own definition of time horizons (months) ─
    -- Source: GridxQ8M[{_1..3}].Q8M
    short_term_months       smallint,          -- what respondent calls "short term"
    mid_term_months         smallint,
    long_term_months        smallint,

    -- ── Financial literacy & risk perception ──────────────────
    stock_market_familiarity  smallint,        -- Q11M (1=Not at all to 5=Very familiar)
    risk_return_threshold     smallint,        -- Q12M (rate of return at which risk is accepted)
    market_downturn_reaction  smallint,        -- Q10M (1=Sell all ... 5=Buy more)
    risk_tolerance_preference smallint,        -- QRT (low/medium/high risk tolerance)

    -- Perceived RISK rank per instrument (1=most risky; lower=riskier)
    -- Source: Q14M_RANK_GRID[{_n}].Q14M_RANK
    risk_rank_equity        smallint,
    risk_rank_mf_etf        smallint,
    risk_rank_fo            smallint,
    risk_rank_gold          smallint,
    risk_rank_fd_rd         smallint,
    risk_rank_corp_bonds    smallint,
    risk_rank_ppf           smallint,
    risk_rank_epf           smallint,
    risk_rank_real_estate   smallint,
    risk_rank_crypto        smallint,

    -- Perceived RETURN rank per instrument (1=highest return expected)
    -- Source: Q15M_RANK_GRID[{_n}].Q15M_RANK
    return_rank_equity      smallint,
    return_rank_mf_etf      smallint,
    return_rank_fo          smallint,
    return_rank_gold        smallint,
    return_rank_fd_rd       smallint,
    return_rank_corp_bonds  smallint,
    return_rank_ppf         smallint,
    return_rank_epf         smallint,
    return_rank_real_estate smallint,
    return_rank_crypto      smallint,

    -- Financial knowledge (T/F statements; 1=True 2=False 3=Don't know)
    -- Source: GRIDxQ15AM[{_1..9}].Q15AM
    knows_direct_mf_lower_expense  smallint,   -- Direct plans have lower expense ratio
    knows_pension_invests_equity   smallint,   -- Pension fund invests in equity
    knows_compounding_longterm     smallint,   -- Compounding is long-term benefit
    knows_kyc_online               smallint,   -- KYC can be done online
    knows_demat_needed             smallint,   -- Demat account needed for securities
    knows_high_return_high_risk    smallint,   -- High returns = higher risk
    knows_diversification_reduces  smallint,   -- Diversification reduces risk
    knows_cas_overview             smallint,   -- CAS gives portfolio overview
    knows_bsda_basic_demat         smallint,   -- BSDA is basic demat account

    -- Market institution perception (1=Strongly agree to 5=Strongly disagree)
    -- Source: g_Q1B[{_1..6}].Q1B
    perceive_market_well_regulated    smallint,
    perceive_market_handles_volatility smallint,
    perceive_market_new_instruments   smallint,
    perceive_market_accessible        smallint,
    perceive_market_wealth_creation   smallint,
    perceive_market_easy_convenient   smallint,

    -- ── Grievance awareness ───────────────────────────────────
    aware_sebi_grievance_mechanism  boolean,   -- Q17M
    grievance_approach_entity       smallint,  -- Q16M (who would you approach for grievance)

    -- ── IEP (Investor Education Programmes) ───────────────────
    iep_attended            boolean,           -- Q20AM
    iep_mode                smallint,          -- 0=none 1=online 2=in-person
    iep_found_useful        smallint,          -- Q20BM (effectiveness rating)
    iep_preferred_mode      smallint,          -- Q20CM
    iep_preferred_language  smallint,          -- Q20E (coded)

    -- ── Information sources (investors, top 3 select) ─────────
    -- Source: SS_B3 (multi-coded; converted to flags)
    info_friends_family             boolean,
    info_social_media_influencers   boolean,
    info_financial_professionals    boolean,
    info_educational_resources      boolean,
    info_online_communities         boolean,
    info_news_blogs                 boolean,
    info_research_reports           boolean,
    info_sebi_official_websites     boolean,
    info_iep_providers              boolean,

    -- ── Investment motivations (investors, top 3) ─────────────
    -- Source: SS_B10
    motive_higher_returns           boolean,
    motive_financial_goals          boolean,
    motive_long_term_growth         boolean,
    motive_quick_gains              boolean,
    motive_additional_income        boolean,
    motive_short_term               boolean,
    motive_lower_risk               boolean,
    motive_inflation_hedge          boolean,
    motive_tax_benefits             boolean,
    motive_diversification          boolean,
    motive_dividends                boolean,
    motive_convenience              boolean,
    motive_zero_charges             boolean,
    motive_peer_influence           boolean,

    -- ── Barriers to investing (non-investors, top 3) ──────────
    -- Source: SS_BB2
    barrier_fear_of_loss            boolean,
    barrier_lack_knowledge          boolean,
    barrier_lack_trust              boolean,
    barrier_dont_know_how           boolean,
    barrier_regulatory_concerns     boolean,
    barrier_info_overload           boolean,
    barrier_uncertain_returns       boolean,
    barrier_large_capital_needed    boolean,
    barrier_long_term_lock_in       boolean,
    barrier_too_many_options        boolean,
    barrier_better_alternatives     boolean,
    barrier_high_fees               boolean,
    barrier_insufficient_funds      boolean,
    barrier_family_advice_against   boolean,
    barrier_liquidity_concerns      boolean,
    barrier_time_commitment         boolean,
    barrier_documentation_burden    boolean,
    barrier_language_barrier        boolean,

    -- ── Media & internet consumption ──────────────────────────
    -- Source: M1A-M1D (frequency 1=Never to 5=Daily)
    tv_frequency            smallint,
    radio_frequency         smallint,
    newspaper_frequency     smallint,
    internet_frequency      smallint,

    -- ── Survey weight ─────────────────────────────────────────
    survey_weight           numeric            -- Weight_to_Sample
);

-- ============================================================
-- Indexes
-- ============================================================

-- Core filters
CREATE INDEX IF NOT EXISTS idx_resp_survey_year      ON respondents(survey_year);
CREATE INDEX IF NOT EXISTS idx_resp_is_investor      ON respondents(is_investor);
CREATE INDEX IF NOT EXISTS idx_resp_state            ON respondents(state_id);
CREATE INDEX IF NOT EXISTS idx_resp_zone             ON respondents(zone);
CREATE INDEX IF NOT EXISTS idx_resp_urban            ON respondents(is_urban);
CREATE INDEX IF NOT EXISTS idx_resp_education        ON respondents(education_years);
CREATE INDEX IF NOT EXISTS idx_resp_income           ON respondents(monthly_income_rs);
CREATE INDEX IF NOT EXISTS idx_resp_occupation       ON respondents(occupation_raw);
CREATE INDEX IF NOT EXISTS idx_resp_gender           ON respondents(gender);
CREATE INDEX IF NOT EXISTS idx_resp_nccs             ON respondents(nccs_class);
CREATE INDEX IF NOT EXISTS idx_resp_life_stage       ON respondents(life_stage);

-- Composite: most frequent analysis joins
CREATE INDEX IF NOT EXISTS idx_resp_state_investor   ON respondents(state_id, is_investor);
CREATE INDEX IF NOT EXISTS idx_resp_edu_investor     ON respondents(education_years, is_investor);
CREATE INDEX IF NOT EXISTS idx_resp_income_investor  ON respondents(monthly_income_rs, is_investor);
CREATE INDEX IF NOT EXISTS idx_resp_urban_investor   ON respondents(is_urban, is_investor);
CREATE INDEX IF NOT EXISTS idx_resp_edu_income       ON respondents(education_years, monthly_income_rs);
CREATE INDEX IF NOT EXISTS idx_resp_year_investor    ON respondents(survey_year, is_investor);
CREATE INDEX IF NOT EXISTS idx_resp_zone_urban       ON respondents(zone, is_urban);
CREATE INDEX IF NOT EXISTS idx_resp_gender_investor  ON respondents(gender, is_investor);

-- Risk & literacy analysis
CREATE INDEX IF NOT EXISTS idx_resp_familiarity      ON respondents(stock_market_familiarity, is_investor);
CREATE INDEX IF NOT EXISTS idx_resp_risk_tolerance   ON respondents(risk_tolerance_preference, is_investor);

-- Instrument-specific (partial — only rows that matter)
CREATE INDEX IF NOT EXISTS idx_resp_holds_equity     ON respondents(education_years, monthly_income_rs)
    WHERE holds_equity_shares = true;
CREATE INDEX IF NOT EXISTS idx_resp_holds_mf         ON respondents(education_years, monthly_income_rs)
    WHERE holds_mf_etf = true;
CREATE INDEX IF NOT EXISTS idx_resp_iep              ON respondents(iep_attended, education_years)
    WHERE is_investor = true;
CREATE INDEX IF NOT EXISTS idx_resp_aware_mf         ON respondents(state_id, is_urban)
    WHERE aware_mf_sip = false;

-- Geographic drill-down
CREATE INDEX IF NOT EXISTS idx_resp_state_urban_inv  ON respondents(state_id, is_urban, is_investor);
CREATE INDEX IF NOT EXISTS idx_resp_zone_edu_inv     ON respondents(zone, education_id, is_investor);

-- Duration analysis
CREATE INDEX IF NOT EXISTS idx_resp_duration_equity  ON respondents(duration_equity)
    WHERE duration_equity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resp_duration_mf      ON respondents(duration_mf_etf)
    WHERE duration_mf_etf IS NOT NULL;
