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

-- ── Reference: education ordinal (stored inline as years) ────
-- Not Literate=0, Primary=6, Secondary=9, Higher Secondary=12, Graduate=16

-- ============================================================
-- Core identity table (all respondents)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondents (
    respondent_id  bigint   PRIMARY KEY,   -- Resp_ID_DP
    survey_year    smallint NOT NULL,       -- 2025
    is_investor    boolean  NOT NULL,       -- QFL
    survey_weight  numeric                  -- Weight_to_Sample
);

-- ============================================================
-- 1) Geography
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_geography (
    respondent_id  bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    state_id       smallint REFERENCES states(state_id),
    zone           text,      -- North / South / East / West / Central / Northeast
    is_urban       boolean,   -- Urban=true
    city_class     text,      -- Metro / Town / etc.
    centre         text       -- city/town name
);

-- ============================================================
-- 2) Socioeconomic profile
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_profile (
    respondent_id        bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    gender               smallint,   -- 1=Male 2=Female
    marital_status       smallint,   -- 1=Single 2=Married 3=Divorced 4=Widowed
    family_type          smallint,   -- 1=Nuclear 2=Joint 3=Other
    life_stage           smallint,
    nccs_class           smallint,   -- New Consumer Classification System
    education_years      smallint,   -- years of schooling: 0/6/9/12/16
    occupation_raw       smallint,   -- Q14 numeric code
    monthly_income_rs    integer,    -- band midpoint in Rs.
    annual_hh_income_id  smallint,   -- Q10A band code
    internet_plan_type   smallint,   -- 1=No internet 2=Mobile 3=Broadband
    has_demat_account    boolean
);

-- ============================================================
-- 3) Income allocation (% of monthly income)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_income_allocation (
    respondent_id         bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    pct_income_expenses   numeric,
    pct_income_savings    numeric,
    pct_income_loan_emi   numeric,
    pct_income_investment numeric,
    pct_income_other      numeric
);

-- ============================================================
-- 4) Portfolio allocation % across instruments (investors)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_portfolio_allocation (
    respondent_id                bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    pct_portfolio_mf_etf         numeric,
    pct_portfolio_equity         numeric,
    pct_portfolio_fo             numeric,
    pct_portfolio_gold_etf       numeric,
    pct_portfolio_nps            numeric,
    pct_portfolio_reits          numeric,
    pct_portfolio_ulip           numeric,
    pct_portfolio_corp_bonds     numeric,
    pct_portfolio_fd_rd          numeric,
    pct_portfolio_ppf            numeric,
    pct_portfolio_post_office    numeric,
    pct_portfolio_sgb            numeric,
    pct_portfolio_epf            numeric,
    pct_portfolio_real_estate    numeric,
    pct_portfolio_gold_physical  numeric,
    pct_portfolio_crypto         numeric,
    pct_portfolio_aif            numeric,
    pct_portfolio_sif            numeric
);

-- ============================================================
-- 5) Financial goals (rank 1=most important, NULL=not ranked)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_goal_ranks (
    respondent_id                    bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    goal_rank_buy_house              smallint,
    goal_rank_children_education     smallint,
    goal_rank_retirement             smallint,
    goal_rank_emergency_fund         smallint,
    goal_rank_grow_wealth            smallint,
    goal_rank_major_expense          smallint,
    goal_rank_passive_income         smallint,
    goal_rank_support_family         smallint,
    goal_rank_financial_independence smallint,
    goal_rank_child_marriage         smallint,
    goal_rank_tax_savings            smallint,
    goal_rank_daily_trading          smallint
);

-- ============================================================
-- 6) Product awareness (all respondents)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_awareness (
    respondent_id           bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
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
    n_products_aware        smallint
);

-- ============================================================
-- 7) Current holdings by instrument (investors)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_holdings (
    respondent_id         bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    holds_mf_etf          boolean,
    holds_equity_shares   boolean,
    holds_derivatives_fo  boolean,
    holds_gold_etf        boolean,
    holds_nps             boolean,
    holds_reits_invits    boolean,
    holds_ulip            boolean,
    holds_chit_fund       boolean,
    holds_real_estate     boolean,
    holds_corp_bonds      boolean,
    holds_fd_rd           boolean,
    holds_ppf_vpf         boolean,
    holds_post_office     boolean,
    holds_sgb             boolean,
    holds_epf             boolean,
    holds_pms             boolean,
    holds_gold_physical   boolean,
    holds_crypto          boolean,
    holds_aif             boolean,
    holds_sif             boolean,
    n_instruments_held    smallint
);

-- ============================================================
-- 8) Active / Dormant investor status per instrument
--    1=Active  2=Dormant  3=Never invested
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_instrument_status (
    respondent_id         bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    status_mf_etf         smallint,
    status_equity         smallint,
    status_fo             smallint,
    status_corp_bonds     smallint,
    status_fd_rd          smallint,
    status_ppf            smallint,
    status_epf            smallint,
    status_gold_physical  smallint
);

-- ============================================================
-- 9) Holding duration by instrument  1=Short  2=Mid  3=Long  0=DK
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_instrument_duration (
    respondent_id        bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    duration_equity      smallint,
    duration_mf_etf      smallint,
    duration_fo          smallint,
    duration_gold_etf    smallint,
    duration_nps         smallint,
    duration_reits       smallint,
    duration_corp_bonds  smallint,
    duration_fd_rd       smallint,
    duration_ppf         smallint,
    duration_sgb         smallint,
    duration_epf         smallint
);

-- ============================================================
-- 10) Respondent's own definition of time horizons (months)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_time_horizons (
    respondent_id      bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    short_term_months  smallint,
    mid_term_months    smallint,
    long_term_months   smallint
);

-- ============================================================
-- 11) Financial literacy & risk perception
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_literacy_risk (
    respondent_id                bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    stock_market_familiarity     smallint,   -- 1=Not at all .. 5=Very familiar
    risk_return_threshold        smallint,   -- rate of return at which respondent accepts risk
    market_downturn_reaction     smallint,   -- 1=Sell all .. 5=Buy more
    risk_tolerance_preference    smallint,   -- low / medium / high
    -- perceived risk rank per instrument (lower rank = riskier)
    risk_rank_equity             smallint,
    risk_rank_mf_etf             smallint,
    risk_rank_fo                 smallint,
    risk_rank_gold               smallint,
    risk_rank_fd_rd              smallint,
    risk_rank_corp_bonds         smallint,
    risk_rank_ppf                smallint,
    risk_rank_epf                smallint,
    risk_rank_real_estate        smallint,
    risk_rank_crypto             smallint,
    -- perceived return rank per instrument (1=highest expected return)
    return_rank_equity           smallint,
    return_rank_mf_etf           smallint,
    return_rank_fo               smallint,
    return_rank_gold             smallint,
    return_rank_fd_rd            smallint,
    return_rank_corp_bonds       smallint,
    return_rank_ppf              smallint,
    return_rank_epf              smallint,
    return_rank_real_estate      smallint,
    return_rank_crypto           smallint
);

-- ============================================================
-- 12) Financial knowledge  1=True  2=False  3=Don't know
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_knowledge (
    respondent_id                 bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    knows_direct_mf_lower_expense smallint,
    knows_pension_invests_equity  smallint,
    knows_compounding_longterm    smallint,
    knows_kyc_online              smallint,
    knows_demat_needed            smallint,
    knows_high_return_high_risk   smallint,
    knows_diversification_reduces smallint,
    knows_cas_overview            smallint,
    knows_bsda_basic_demat        smallint
);

-- ============================================================
-- 13) Market institution perception  1=Strongly agree .. 5=Disagree
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_market_perception (
    respondent_id                      bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    perceive_market_well_regulated     smallint,
    perceive_market_handles_volatility smallint,
    perceive_market_new_instruments    smallint,
    perceive_market_accessible         smallint,
    perceive_market_wealth_creation    smallint,
    perceive_market_easy_convenient    smallint
);

-- ============================================================
-- 14) Information sources (investors, top 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_info_sources (
    respondent_id                 bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    info_friends_family           boolean,
    info_social_media_influencers boolean,
    info_financial_professionals  boolean,
    info_educational_resources    boolean,
    info_online_communities       boolean,
    info_news_blogs               boolean,
    info_research_reports         boolean,
    info_sebi_official_websites   boolean,
    info_iep_providers            boolean
);

-- ============================================================
-- 15) Investment motivations (investors, top 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_motivations (
    respondent_id            bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    motive_higher_returns    boolean,
    motive_financial_goals   boolean,
    motive_long_term_growth  boolean,
    motive_quick_gains       boolean,
    motive_additional_income boolean,
    motive_short_term        boolean,
    motive_lower_risk        boolean,
    motive_inflation_hedge   boolean,
    motive_tax_benefits      boolean,
    motive_diversification   boolean,
    motive_dividends         boolean,
    motive_convenience       boolean,
    motive_zero_charges      boolean,
    motive_peer_influence    boolean
);

-- ============================================================
-- 16) Barriers to investing (non-investors, top 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_barriers (
    respondent_id                  bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    barrier_fear_of_loss           boolean,
    barrier_lack_knowledge         boolean,
    barrier_lack_trust             boolean,
    barrier_dont_know_how          boolean,
    barrier_regulatory_concerns    boolean,
    barrier_info_overload          boolean,
    barrier_uncertain_returns      boolean,
    barrier_large_capital_needed   boolean,
    barrier_long_term_lock_in      boolean,
    barrier_too_many_options       boolean,
    barrier_better_alternatives    boolean,
    barrier_high_fees              boolean,
    barrier_insufficient_funds     boolean,
    barrier_family_advice_against  boolean,
    barrier_liquidity_concerns     boolean,
    barrier_time_commitment        boolean,
    barrier_documentation_burden   boolean,
    barrier_language_barrier       boolean
);

-- ============================================================
-- 17) Media & internet consumption  1=Never .. 5=Daily
-- ============================================================
CREATE TABLE IF NOT EXISTS respondent_media (
    respondent_id        bigint PRIMARY KEY REFERENCES respondents(respondent_id) ON DELETE CASCADE,
    tv_frequency         smallint,
    radio_frequency      smallint,
    newspaper_frequency  smallint,
    internet_frequency   smallint
);

-- ============================================================
-- Indexes
-- ============================================================

-- respondents (core filters)
CREATE INDEX IF NOT EXISTS idx_resp_investor     ON respondents(is_investor);
CREATE INDEX IF NOT EXISTS idx_resp_year         ON respondents(survey_year);
CREATE INDEX IF NOT EXISTS idx_resp_year_inv     ON respondents(survey_year, is_investor);

-- geography
CREATE INDEX IF NOT EXISTS idx_geo_state         ON respondent_geography(state_id);
CREATE INDEX IF NOT EXISTS idx_geo_zone          ON respondent_geography(zone);
CREATE INDEX IF NOT EXISTS idx_geo_urban         ON respondent_geography(is_urban);
CREATE INDEX IF NOT EXISTS idx_geo_state_urban   ON respondent_geography(state_id, is_urban);

-- profile
CREATE INDEX IF NOT EXISTS idx_prof_edu          ON respondent_profile(education_years);
CREATE INDEX IF NOT EXISTS idx_prof_income       ON respondent_profile(monthly_income_rs);
CREATE INDEX IF NOT EXISTS idx_prof_gender       ON respondent_profile(gender);
CREATE INDEX IF NOT EXISTS idx_prof_nccs         ON respondent_profile(nccs_class);
CREATE INDEX IF NOT EXISTS idx_prof_occ          ON respondent_profile(occupation_raw);
CREATE INDEX IF NOT EXISTS idx_prof_edu_income   ON respondent_profile(education_years, monthly_income_rs);

-- literacy & risk (common join for regression)
CREATE INDEX IF NOT EXISTS idx_lit_familiarity   ON respondent_literacy_risk(stock_market_familiarity);
CREATE INDEX IF NOT EXISTS idx_lit_tolerance     ON respondent_literacy_risk(risk_tolerance_preference);

-- holdings (partial — only investors who hold each instrument)
CREATE INDEX IF NOT EXISTS idx_hold_equity       ON respondent_holdings(respondent_id) WHERE holds_equity_shares = true;
CREATE INDEX IF NOT EXISTS idx_hold_mf           ON respondent_holdings(respondent_id) WHERE holds_mf_etf = true;
CREATE INDEX IF NOT EXISTS idx_hold_n            ON respondent_holdings(n_instruments_held);

-- awareness
CREATE INDEX IF NOT EXISTS idx_awr_n             ON respondent_awareness(n_products_aware);
