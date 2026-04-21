# state_layer.csv — Column Sources

35 rows (one per Indian state/UT) × 21 columns. Built by `src/build_state_layer.py`.

---

## Identifiers

| Column | Type | Source | Notes |
|--------|------|--------|-------|
| state_code | integer | Census 2011 | Standard Census state/UT code (1–35) |
| state_name | string | Census 2011 | Standard Census state/UT name |

---

## Demographics — Census 2011

Source file: `data/census/A-1_NO_OF_VILLAGES_TOWNS_HOUSEHOLDS_POPULATION_AND_AREA.xlsx`  
Coverage: All 35 states/UTs. Year: 2011.

| Column | Description |
|--------|-------------|
| total_population | Total persons (rural + urban) |
| total_households | Total census households |
| n_districts | Count of districts (from district_census_consolidated.csv) |
| urban_population | Population in urban areas |
| rural_population | Population in rural areas |
| area_sqkm | Total geographic area in sq km |
| pop_per_sqkm | Population density (total_population / area_sqkm) — derived |
| total_towns | Number of towns/urban units |
| total_villages | Number of inhabited villages |

---

## Education and Labour — Census 2011 PCA

Source file: `data/census/DDW_PCA0000_2011_Indiastatedist.xlsx`  
Rows used: Level = "STATE", TRU = "Total" (all persons, state totals).  
Coverage: All 35 states/UTs. Year: 2011.

| Column | Source Column | Description |
|--------|--------------|-------------|
| literate_persons_2011 | P_LIT | Total literate persons (age 7+) |
| total_workers_2011 | TOT_WORK_P | Total workers (main + marginal) |

---

## Educational Attainment — Census 2011 C-08

Source file: `data/census/DDW-0000C-08.xlsx`  
Rows used: Distt. code = "000" (state-level), TRU = "Total", Age = "All ages".  
Coverage: All 35 states/UTs. Year: 2011.

| Column | Description |
|--------|-------------|
| graduate_above_2011 | Total persons with Graduate & above qualification |

---

## Housing Quality — Census 2001

Source file: `data/census/district_census_consolidated.csv` (aggregated from pincode census)  
Coverage: ~501 of 640 districts matched; state totals complete for all 35 states.  
Year: 2001.

| Column | Source Column | Description |
|--------|--------------|-------------|
| permanent_houses_2001 | permanent_house_2001 | Count of permanent (pucca) census houses |

Note: Census 2011 H-series housing data (H-11) was not available for download at time of collection. 2001 values used.

---

## Per Capita Income — 2011-12

Source file: `data/state_per_capita_nsdp_2011.csv`  
Original source: RBI Handbook of Statistics on Indian States 2016-17, Table on Per Capita Net State Domestic Product at Current Prices (₹), 2011-12.  
Coverage: 32 of 35 states/UTs.

| Column | Description |
|--------|-------------|
| per_capita_income_2011 | Per capita Net State Domestic Product at current prices (₹), 2011-12 |

Fallback values for 3 UTs that do not publish SDP estimates (CSO/MoSPI):
- Daman & Diu (25): ₹229,064
- Dadra & Nagar Haveli (26): ₹159,002
- Lakshadweep (31): ₹79,696

---

## NSE Investor Data — 2026

Source file: `data/state_investors_nse.csv`  
Original source: NSE (National Stock Exchange) state-wise registered Unique Client Codes (UCC).  
As of: April 18, 2026.

Note: Telangana (bifurcated 2014) merged into Andhra Pradesh (code 28). Ladakh (bifurcated 2019) merged into Jammu & Kashmir (code 1). Both predate Census 2011 boundaries.

| Column | Description |
|--------|-------------|
| total_ucc | Total registered unique client codes (cumulative) |
| investors_last_year | New investors added in the last 1 year |
| investors_last_5yr | New investors added in the last 5 years (post-2021) |
| investors_pre_2021 | Investors registered before 2021 (total_ucc − investors_last_5yr) — derived |
| investors_per_lakh | Total UCC per 100,000 population — derived outcome variable |
