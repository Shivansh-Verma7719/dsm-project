import os
import csv
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

STATE_CSV = os.path.join(os.path.dirname(__file__), '../../data/state_layer.csv')

# Column mappings for each table
STATE_COLS = [
    'state_code', 'state_name', 'total_population', 'total_households', 'n_districts',
    'urban_population', 'rural_population', 'area_sqkm', 'pop_per_sqkm', 'total_towns', 'total_villages'
]
EDU_COLS = ['literate_persons_2011', 'graduate_above_2011']
INCOME_COLS = ['permanent_houses_2001', 'per_capita_income_2011']
INVESTOR_COLS = [
    'total_ucc', 'investors_last_year', 'investors_last_5yr',
    'investors_pre_2021', 'investors_per_lakh'
]

def parse_row(row):
    # Convert all values to appropriate types or None
    def conv(val, typ):
        try:
            return typ(val) if val != '' else None
        except Exception:
            return None
    return {
        'state': [
            conv(row['state_code'], int), row['state_name'],
            conv(row['total_population'], int), conv(row['total_households'], int),
            conv(row['n_districts'], int), conv(row['urban_population'], int),
            conv(row['rural_population'], int), conv(row['area_sqkm'], float),
            conv(row['pop_per_sqkm'], float), conv(row['total_towns'], int),
            conv(row['total_villages'], int)
        ],
        'education': [
            conv(row['literate_persons_2011'], int),
            conv(row['graduate_above_2011'], int)
        ],
        'income': [
            conv(row['permanent_houses_2001'], float),
            conv(row['per_capita_income_2011'], int)
        ],
        'investors': [
            conv(row['total_ucc'], int), conv(row['investors_last_year'], int),
            conv(row['investors_last_5yr'], int), conv(row['investors_pre_2021'], int),
            conv(row['investors_per_lakh'], float)
        ]
    }

def main():
    with open(STATE_CSV, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        state_rows, edu_rows, income_rows, investor_rows = [], [], [], []
        for row in reader:
            parsed = parse_row(row)
            state_rows.append(parsed['state'])
            edu_rows.append([parsed['state'][0]] + parsed['education'])
            income_rows.append([parsed['state'][0]] + parsed['income'])
            investor_rows.append([parsed['state'][0]] + parsed['investors'])

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    try:
        # Insert into states
        execute_values(
            cur,
            f"""
            INSERT INTO states ({', '.join(STATE_COLS)})
            VALUES %s
            ON CONFLICT (state_code) DO NOTHING
            """,
            state_rows
        )
        # Insert into state_education
        execute_values(
            cur,
            """
            INSERT INTO state_education (state_code, literate_persons_2011, graduate_above_2011)
            VALUES %s
            ON CONFLICT DO NOTHING
            """,
            edu_rows
        )
        # Insert into state_income
        execute_values(
            cur,
            """
            INSERT INTO state_income (state_code, permanent_houses_2001, per_capita_income_2011)
            VALUES %s
            ON CONFLICT DO NOTHING
            """,
            income_rows
        )
        # Insert into state_investors
        execute_values(
            cur,
            """
            INSERT INTO state_investors (state_code, total_ucc, investors_last_year, investors_last_5yr, investors_pre_2021, investors_per_lakh)
            VALUES %s
            ON CONFLICT DO NOTHING
            """,
            investor_rows
        )
        conn.commit()
        print("ETL completed successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
