-- Schema for state_layer.csv
-- Main table: states
CREATE TABLE states (
    state_code INTEGER PRIMARY KEY,
    state_name TEXT NOT NULL UNIQUE,
    total_population BIGINT,
    total_households BIGINT,
    n_districts INTEGER,
    urban_population BIGINT,
    rural_population BIGINT,
    area_sqkm FLOAT,
    pop_per_sqkm FLOAT,
    total_towns INTEGER,
    total_villages INTEGER
);

-- Education-related statistics
CREATE TABLE state_education (
    id SERIAL PRIMARY KEY,
    state_code INTEGER REFERENCES states(state_code) ON DELETE CASCADE,
    literate_persons_2011 BIGINT,
    graduate_above_2011 BIGINT
);
CREATE INDEX idx_state_education_state_code ON state_education(state_code);

-- Income and economic indicators
CREATE TABLE state_income (
    id SERIAL PRIMARY KEY,
    state_code INTEGER REFERENCES states(state_code) ON DELETE CASCADE,
    per_capita_income_2011 BIGINT,
    permanent_houses_2001 FLOAT
);
CREATE INDEX idx_state_income_state_code ON state_income(state_code);
CREATE INDEX idx_state_income_per_capita ON state_income(per_capita_income_2011);

-- Investor and financial participation data
CREATE TABLE state_investors (
    id SERIAL PRIMARY KEY,
    state_code INTEGER REFERENCES states(state_code) ON DELETE CASCADE,
    total_ucc BIGINT,
    investors_last_year BIGINT,
    investors_last_5yr BIGINT,
    investors_pre_2021 BIGINT,
    investors_per_lakh FLOAT
);
CREATE INDEX idx_state_investors_state_code ON state_investors(state_code);
CREATE INDEX idx_state_investors_per_lakh ON state_investors(investors_per_lakh);
