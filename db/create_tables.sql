DROP TABLE IF EXISTS public."sebi_tenure" CASCADE;
CREATE TABLE public."sebi_tenure" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "type_of_investor" text,
  "age_group" text,
  "number_of_investors" bigint,
  "percentage_of_total_investors_uom_percentage_scaling_factor_1" double precision
);
ALTER TABLE public."sebi_tenure" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_savings_urban" CASCADE;
CREATE TABLE public."sebi_savings_urban" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "urban_household_savings" text,
  "urban_household_monthly_income" text,
  "number_of_households" bigint
);
ALTER TABLE public."sebi_savings_urban" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_income_instrument" CASCADE;
CREATE TABLE public."sebi_income_instrument" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "type_of_investors" text,
  "range" text,
  "income_range" text,
  "number_of_investors" bigint,
  "percentage_to_total_investors_uom_percentage_scaling_factor_1" double precision
);
ALTER TABLE public."sebi_income_instrument" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_info_sources" CASCADE;
CREATE TABLE public."sebi_info_sources" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "information_source" text,
  "rank" text,
  "percentage_of_source_information_uom_percentage_scaling_factor_1" double precision
);
ALTER TABLE public."sebi_info_sources" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_risk_return" CASCADE;
CREATE TABLE public."sebi_risk_return" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "name_of_instrument" text,
  "mean_score_of_risk_by_type_of_instrument_uom_percentage_scaling_factor_1" double precision,
  "mean_score_of_return_by_type_of_instrument_uom_percentage_scaling_factor_1" double precision,
  "mean_score_of_time_horizon_by_type_of_instrument_uom_percentage_scaling_factor_1" double precision
);
ALTER TABLE public."sebi_risk_return" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_risk_mitigation" CASCADE;
CREATE TABLE public."sebi_risk_mitigation" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "rank" bigint,
  "stock_or_bond_of_known_company_uom_percentage_scaling_factor_1" bigint,
  "primarily_invest_in_mutual_fund_uom_percentage_scaling_factor_1" bigint,
  "observe_markets_in_detail_uom_percentage_scaling_factor_1" bigint,
  "use_well_established_brokers_uom_percentage_scaling_factor_1" bigint,
  "invest_in_small_parts_uom_percentage_scaling_factor_1" bigint
);
ALTER TABLE public."sebi_risk_mitigation" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_motivations" CASCADE;
CREATE TABLE public."sebi_motivations" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "rank" text,
  "reasons_for_clients_to_invest_in_securities_markets" text,
  "number_of_investments_in_securities_markets" bigint
);
ALTER TABLE public."sebi_motivations" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_barriers" CASCADE;
CREATE TABLE public."sebi_barriers" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "rank" text,
  "reasons_for_low_participation" text,
  "number_of_low_participations" bigint
);
ALTER TABLE public."sebi_barriers" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_investor_education" CASCADE;
CREATE TABLE public."sebi_investor_education" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "current_investment" text,
  "non_participant_investors" bigint,
  "percentage_of_non_participant_investors_uom_percentage_scaling_factor_1" double precision,
  "participant_investors" bigint,
  "percentage_of_participant_investors_uom_percentage_scaling_factor_1" double precision,
  "totals" bigint
);
ALTER TABLE public."sebi_investor_education" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_debt_by_income" CASCADE;
CREATE TABLE public."sebi_debt_by_income" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "monthly_income" text,
  "debt" text,
  "number_of_households" bigint
);
ALTER TABLE public."sebi_debt_by_income" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_occupation" CASCADE;
CREATE TABLE public."sebi_occupation" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "occupation" text,
  "percentage_of_non_investors_uom_percentage_scaling_factor_1" double precision,
  "percentage_of_urban_investors_uom_percentage_scaling_factor_1" double precision
);
ALTER TABLE public."sebi_occupation" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_awareness" CASCADE;
CREATE TABLE public."sebi_awareness" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "awareness_of_investment_instruments" text,
  "percentage_of_mutual_funds_in_urban_household_awareness_of_investment_instruments_uom_percentage_scaling_factor_1" double precision,
  "percentage_of_equities_in_urban_household_awareness_of_investment_instruments_equities_are_a_common_type_of_investment_instrument_traded_on_stock_exchanges_uom_percentage_scaling_factor_1" double precision,
  "percentage_of_debentures_in_urban_household_awareness_of_investment_instruments_debentures_are_debt_instruments_issued_by_companies_or_governments_that_offer_fixed_interest_payments_and_repayment_of_the_principal_amount_at_maturity_uom_percentage_scaling_factor_1" double precision,
  "equity_or_currency_derivatives_uom_percentage_scaling_factor_1" double precision,
  "percentage_of_commodity_futures_in_urban_household_awareness_of_investment_instruments_uom_percentage_scaling_factor_1" double precision
);
ALTER TABLE public."sebi_awareness" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_ipo_holding" CASCADE;
CREATE TABLE public."sebi_ipo_holding" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "holding_period" text,
  "number_of_equities_purchased_through_initial_public_offering_ipo" bigint,
  "percent_uom_percentage_scaling_factor_1" double precision,
  "cumulative_uom_percentage_scaling_factor_1" double precision
);
ALTER TABLE public."sebi_ipo_holding" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_zone_instruments" CASCADE;
CREATE TABLE public."sebi_zone_instruments" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "instrument" text,
  "zone" text,
  "number_of_investors" bigint
);
ALTER TABLE public."sebi_zone_instruments" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_mf_holding" CASCADE;
CREATE TABLE public."sebi_mf_holding" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "mutual_funds_mf_holding_duration" text,
  "percentage_of_mutual_funds_mf_holding_duration_uom_percentage_scaling_factor_1" double precision,
  "cumulative_of_mutual_funds_mf_holding_duration_uom_percentage_scaling_factor_1" double precision
);
ALTER TABLE public."sebi_mf_holding" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_years_participating" CASCADE;
CREATE TABLE public."sebi_years_participating" (
  id bigserial primary key,
  "country" text,
  "year" text,
  "years_in_the_market" text,
  "frequency_of_participating_in_securities_markets" bigint,
  "percentage_of_participating_in_securities_markets_uom_percentage_scaling_factor_1" double precision
);
ALTER TABLE public."sebi_years_participating" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_education_participation" CASCADE;
CREATE TABLE public."sebi_education_participation" (
  id bigserial primary key,
  "education_level" text,
  "years_schooling" text,
  "pct_who_invest" double precision
);
ALTER TABLE public."sebi_education_participation" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."sebi_education_instrument" CASCADE;
CREATE TABLE public."sebi_education_instrument" (
  id bigserial primary key,
  "education_level" text,
  "years_schooling" text,
  "mf_pct" double precision,
  "equity_pct" double precision,
  "debt_pct" double precision,
  "n_investors" bigint
);
ALTER TABLE public."sebi_education_instrument" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public."census_districts" CASCADE;
CREATE TABLE public."census_districts" (
  id bigserial primary key,
  "state_code" bigint,
  "district_code" bigint,
  "district_name" text,
  "district_key" text,
  "households_2011" bigint,
  "persons_2011" bigint,
  "males_2011" bigint,
  "females_2011" bigint,
  "rural_pop_2011" bigint,
  "rural_hh_2011" bigint,
  "urban_pop_2011" bigint,
  "urban_hh_2011" bigint,
  "urban_pct_2011" double precision,
  "persons_2001" double precision,
  "males_2001" double precision,
  "females_2001" double precision,
  "rural_2001" text,
  "number_of_households_2001" double precision,
  "scheduled_caste_population_2001" text,
  "scheduled_tribe_population_2001" text,
  "persons_literate_2001" double precision,
  "persons_literacy_rate_2001" double precision,
  "males_literatacy_rate_2001" double precision,
  "females_literacy_rate_2001" double precision,
  "total_educated_2001" double precision,
  "below_primary_2001" double precision,
  "primary_2001" double precision,
  "middle_2001" double precision,
  "matric_higher_secondary_diploma_2001" double precision,
  "graduate_and_above_2001" double precision,
  "x0_4_years_2001" double precision,
  "x5_14_years_2001" double precision,
  "x15_59_years_2001" double precision,
  "total_workers_2001" double precision,
  "main_workers_2001" double precision,
  "marginal_workers_2001" double precision,
  "non_workers_2001" double precision,
  "total_inhabited_villages_2001" double precision,
  "drinking_water_facilities_2001" double precision,
  "safe_drinking_water_2001" double precision,
  "primary_school_2001" double precision,
  "middle_schools_2001" text,
  "college_2001" text,
  "medical_facility_2001" double precision,
  "primary_health_centre_2001" text,
  "bus_services_2001" text,
  "paved_approach_road_2001" text,
  "permanent_house_2001" double precision,
  "semi_permanent_house_2001" double precision,
  "temporary_house_2001" double precision,
  "villages_inhabited" bigint,
  "villages_uninhabited" bigint,
  "towns" bigint,
  "area_sqkm" double precision,
  "pop_per_sqkm" double precision
);
ALTER TABLE public."census_districts" DISABLE ROW LEVEL SECURITY;
