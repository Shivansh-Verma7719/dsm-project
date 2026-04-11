# Determinants of Household Participation in Securities Markets in India

## Research Question

Q2: What determines household participation in securities markets in India?

Expanded objective:

- Who is likely to participate?
- Which securities are they likely to use?
- For how long do they stay invested/participate?

This project studies why some households participate in securities markets while others do not. The focus is on:

- Income
- Education
- Risk perception
- Savings behavior
- Information access
- Instrument choice
- Holding/participation duration

The managerial objective is to identify how investor outreach and financial inclusion can be improved.

## Project Scope

The repository currently contains cleaned and reorganized SEBI investor survey CSV files in a research-ready structure.

- Total source files reviewed: 21
- Active files retained for Q2 analysis: 19
- Irrelevant files archived: 2

## Repository Structure

```text
.
├── README.md
├── data/
│   └── sebi/
│       ├── <19 active csv files>
│       ├── dataset_mapping_q2.md
│       └── irrelevant/
│           └── <2 archived csv files>
└── db/
```

## Data Mapping for Q2

The table below maps each CSV file to the corresponding dataset title and its relevance to the research question.

| CSV filename                                                 | Mapped dataset title                                                                                     | Relevance to Q2                                                                   | Status               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------- |
| 01_education_investment_instrument_choice_urban_copy_1.csv   | Investor Survey - Education and Investment Instrument Choice of Urban (copy 1)                           | Medium (contains investor-type distribution by year bands; usable but not direct) | Kept                 |
| 02_education_investment_instrument_choice_urban_copy_2.csv   | Investor Survey - Education and Investment Instrument Choice of Urban (copy 2)                           | Medium (same structure as above)                                                  | Kept                 |
| 16_holding_period_equities_purchased_via_ipo.csv             | Investor Survey - Holding Period of Equities Purchased through the Initial Public Offering (IPO) Process | High (equity holding duration)                                                    | Kept                 |
| 17_urban_zone_investors_and_instruments_used.csv             | Investor Survey - Investors and Investment Instruments used by Urban zone                                | Medium (what securities are used across zones)                                    | Kept                 |
| 03_total_savings_rural_household_pct_annual_income.csv       | Investor Survey - Total Savings of Rural Household as Percentage of Annual Income                        | High (savings behavior)                                                           | Kept                 |
| 04_total_savings_urban_household_pct_annual_income.csv       | Investor Survey - Total Urban Household Savings as a Percentage of the Households Annual Income          | High (savings behavior + income)                                                  | Kept                 |
| 05_urban_investment_instrument_choice_by_income.csv          | Investor Survey - Urban Investment Instrument Choice, by Income                                          | High (income determinant)                                                         | Kept                 |
| 18_mutual_fund_holding_duration.csv                          | Investor Survey- Holding Duration of Mutual Funds                                                        | High (mutual fund holding duration)                                               | Kept                 |
| 06_information_sources_market_participants.csv               | Investor Survey- Information Sources of Market Participants (MPs)                                        | High (information access)                                                         | Kept                 |
| 19_years_participating_securities_markets_urban_investor.csv | Investor Survey- Number of Years Participating in the Securities Markets of Urban Investor               | High (market participation duration)                                              | Kept                 |
| 07_perceived_risk_return_time_horizon.csv                    | Investor Survey- Perceived Risk, Return and Time Horizon                                                 | High (risk perception)                                                            | Kept                 |
| 08_risk_mitigation_process_urban_investors.csv               | Investor Survey- Process used for Risk Mitigation of Urban Investors                                     | Medium (risk behavior among investors, still informative)                         | Kept                 |
| 09_reasons_for_clients_to_invest_securities_markets.csv      | Investor Survey- Reasons for Clients to Invest in Securities Markets                                     | High (participation motives)                                                      | Kept                 |
| 10_reasons_for_low_participation_securities_markets.csv      | Investor Survey- Reasons for Low Participation in Securities Markets                                     | High (direct non-participation barriers)                                          | Kept                 |
| 11_investor_education_program_participation_tabulation.csv   | Investor Survey- Tabulation of Investors by Participation in Investor Education Programs                 | High (education/outreach determinant)                                             | Kept                 |
| 12_total_urban_debt_pct_annual_income_by_income_band.csv     | Investor Survey- Total Urban Debt as Percentage of Annual Income                                         | High (financial constraints via debt)                                             | Kept                 |
| 13_urban_household_total_debt_pct_annual_income.csv          | Investor Survey- Urban Household Total Debt as Percentage of Annual Income                               | High (financial constraints via debt)                                             | Kept                 |
| 14_urban_investors_by_occupation.csv                         | Investor Survey- Urban Investors by Occupation                                                           | High (household socioeconomic determinant)                                        | Kept                 |
| 03_business_age_distribution_market_participants.csv         | Investor Survey- Business Age Distribution for Market Participants                                       | Low (intermediary/distributor profile, not household behavior)                    | Moved to irrelevant/ |
| 06_state_level_rural_urban_listings_and_samples.csv          | Investor Survey-All India State-Level Rural and Urban Listings and Samples                               | Low (survey sampling frame metadata)                                              | Moved to irrelevant/ |
| 15_urban_household_awareness_investment_instruments.csv      | Investor Survey-Urban Household Awareness of Investment Instruments                                      | High (information access/awareness)                                               | Kept                 |

## Current Research Dataset (Active)

The active dataset set in data/sebi supports determinant-focused analysis via:

- Income and socioeconomic profile
- Savings and debt burden
- Risk and return perception
- Awareness and information channels
- Instrument choice patterns
- Holding and participation duration
- Participation and non-participation motives
- Exposure to investor education programs

## Suggested Analysis Workflow

1. Build a household-level or grouped participation indicator from investor/non-investor tables.
2. Construct determinant features from income, debt, savings, education-program participation, awareness, and risk perception data.
3. Standardize category labels across all CSVs.
4. Run descriptive comparisons between participants and non-participants.
5. Estimate determinant effects using logistic/probit or grouped regression models.
6. Translate significant drivers into investor outreach recommendations.

## Data Notes and Limitations

- Most files are from 2015 and are aggregated/cross-tab summaries, not raw household panel data.
- Some files appear to be conceptually similar or duplicated in naming.
- The active set includes instrument and duration tables because the expanded objective asks who participates, what they use, and for how long.

## Reproducibility Notes

- The full mapping and sorting rationale is documented in data/sebi/dataset_mapping_q2.md.
- Archived files remain available in data/sebi/irrelevant for auditability and future alternate research questions.
