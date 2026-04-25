import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)
    
    os.makedirs("report/data", exist_ok=True)

    print("Extracting data for Securities Analysis...")
    
    # Extract holdings and motivations
    query_holdings = """
    SELECT 
        h.respondent_id,
        p.life_stage,
        p.monthly_income_rs,
        p.nccs_class,
        h.holds_equity_shares,
        h.holds_mf_etf,
        h.holds_ulip,
        h.holds_fd_rd,
        h.holds_post_office,
        h.holds_real_estate,
        h.holds_gold_physical
    FROM respondent_holdings h
    JOIN respondents r ON h.respondent_id = r.respondent_id
    LEFT JOIN respondent_profile p ON r.respondent_id = p.respondent_id
    WHERE r.is_investor = True
    """
    
    df_holdings = pd.read_sql(query_holdings, engine)
    
    print("Computing overall instrument penetration among investors...")
    holding_cols = [c for c in df_holdings.columns if c.startswith('holds_')]
    overall_penetration = df_holdings[holding_cols].mean() * 100
    overall_penetration_df = overall_penetration.reset_index()
    overall_penetration_df.columns = ['Instrument', 'Penetration_%']
    overall_penetration_df = overall_penetration_df.sort_values(by='Penetration_%', ascending=False)
    
    overall_penetration_df.to_csv("report/data/which_securities_overall.csv", index=False)
    print("Overall penetration saved to report/data/which_securities_overall.csv")

    print("Segmenting holdings by Life Stage...")
    life_stage_group = df_holdings.groupby('life_stage')[holding_cols].mean() * 100
    life_stage_group.reset_index(inplace=True)
    life_stage_group.to_csv("report/data/which_securities_by_lifestage.csv", index=False)
    
    print("Segmenting holdings by Income Quartiles...")
    df_holdings['income_quartile'] = pd.qcut(df_holdings['monthly_income_rs'], q=4, duplicates='drop')
    income_group = df_holdings.groupby('income_quartile')[holding_cols].mean() * 100
    income_group.reset_index(inplace=True)
    income_group['income_quartile'] = income_group['income_quartile'].astype(str)
    income_group.to_csv("report/data/which_securities_by_income.csv", index=False)

    print("Analyzing Motivations...")
    query_motives = """
    SELECT * FROM respondent_motivations
    """
    df_motives = pd.read_sql(query_motives, engine)
    motive_cols = [c for c in df_motives.columns if c.startswith('motive_')]
    motive_counts = df_motives[motive_cols].sum().reset_index()
    motive_counts.columns = ['Motivation', 'Count']
    motive_counts = motive_counts.sort_values(by='Count', ascending=False)
    motive_counts.to_csv("report/data/which_securities_motivations.csv", index=False)
    
    print("Securities analysis complete.")

if __name__ == "__main__":
    main()
