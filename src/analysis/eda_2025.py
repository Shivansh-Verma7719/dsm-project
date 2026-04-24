import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found in .env")
    exit(1)

engine = create_engine(db_url)

print("Starting EDA on 2025 Survey Data...")

with engine.connect() as conn:
    print("\n1. Overall Participation Rate:")
    res = pd.read_sql("SELECT is_investor, COUNT(*) as count FROM respondents GROUP BY is_investor", conn)
    res['percentage'] = res['count'] / res['count'].sum() * 100
    print(res)

    print("\n2. Participation by Gender:")
    res = pd.read_sql("""
        SELECT p.gender, r.is_investor, COUNT(*) as count 
        FROM respondent_profile p
        JOIN respondents r ON p.respondent_id = r.respondent_id
        GROUP BY p.gender, r.is_investor
        ORDER BY p.gender, r.is_investor
    """, conn)
    print(res)

    print("\n3. Participation by Literacy/Education (education_years):")
    res = pd.read_sql("""
        SELECT p.education_years, r.is_investor, COUNT(*) as count
        FROM respondent_profile p
        JOIN respondents r ON p.respondent_id = r.respondent_id
        WHERE p.education_years IS NOT NULL
        GROUP BY p.education_years, r.is_investor
        ORDER BY p.education_years
    """, conn)
    print(res)

    print("\n4. Top held securities among investors:")
    res = pd.read_sql("""
        SELECT 
            SUM(CASE WHEN holds_equity_shares THEN 1 ELSE 0 END) as equity,
            SUM(CASE WHEN holds_mf_etf THEN 1 ELSE 0 END) as mf_etf,
            SUM(CASE WHEN holds_ulip THEN 1 ELSE 0 END) as ulip,
            SUM(CASE WHEN holds_fd_rd THEN 1 ELSE 0 END) as fd_rd
        FROM respondent_holdings h
        JOIN respondents r ON h.respondent_id = r.respondent_id
        WHERE r.is_investor = True
    """, conn)
    print(res)
    
    print("\n5. Holding duration preferences (Equity):")
    res = pd.read_sql("""
        SELECT duration_equity, COUNT(*) as count
        FROM respondent_instrument_duration
        WHERE duration_equity IS NOT NULL
        GROUP BY duration_equity
    """, conn)
    print(res)

print("\nEDA basic checks complete.")
