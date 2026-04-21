# Database Schema Rationale for state_layer.csv

## Overview

This document explains the rationale behind the database schema designed for the raw locational data in state_layer.csv. The schema is implemented in schema.sql in the db directory.

## Main Table: states

- **Purpose:** Central table containing core state-level information.
- **Columns:**
  - state_code (PK)
  - state_name
  - total_population
  - total_households
  - n_districts
  - urban_population
  - rural_population
  - area_sqkm
  - pop_per_sqkm
  - total_towns
  - total_villages

## Related Tables

To ensure normalization and future extensibility, the following related tables are created:

### state_education

- **Purpose:** Education-related statistics for each state.
- **Columns:**
  - id (PK)
  - state_code (FK → states.state_code)
  - literate_persons_2011
  - graduate_above_2011

### state_income

- **Purpose:** Income and economic indicators for each state.
- **Columns:**
  - id (PK)
  - state_code (FK → states.state_code)
  - per_capita_income_2011
  - permanent_houses_2001

### state_investors

- **Purpose:** Investor and financial participation data for each state.
- **Columns:**
  - id (PK)
  - state_code (FK → states.state_code)
  - total_ucc
  - investors_last_year
  - investors_last_5yr
  - investors_pre_2021
  - investors_per_lakh

## Indexes

- Indexes are created on all foreign keys and frequently queried columns (e.g., state_name, per_capita_income_2011) to optimize lookups and joins.

## Normalization

- The schema is normalized to 3NF: no redundant data, all non-key attributes depend only on the key.
- This structure allows for easy extension (e.g., adding new education or investor metrics) without altering the main states table.

## Extensibility

- Additional tables (e.g., for SEBI data) can be linked via state_code.
- The schema supports efficient analytical queries and reporting.

---

See schema.sql for implementation details.
