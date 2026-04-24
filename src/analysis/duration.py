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
    
    os.makedirs("report", exist_ok=True)

    print("Extracting data for Duration Analysis...")
    
    # 1. Analyze actual duration preference (duration_equity, duration_fo, duration_reits, duration_corp_bonds)
    # The codes are 1=Short term, 2=Mid term, 3=Long term, 0=Don't know
    query_durations = """
    SELECT 
        duration_equity,
        duration_fo,
        duration_reits,
        duration_corp_bonds
    FROM respondent_instrument_duration
    """
    
    df_durations = pd.read_sql(query_durations, engine)
    
    print("Computing holding duration preferences...")
    duration_stats = []
    
    for col in df_durations.columns:
        counts = df_durations[col].value_counts().reset_index()
        counts.columns = ['Duration_Code', 'Count']
        counts['Instrument'] = col.replace('duration_', '')
        
        # Map codes to labels
        code_map = {0: "Don't Know", 1: "Short term", 2: "Mid term", 3: "Long term"}
        counts['Duration_Label'] = counts['Duration_Code'].map(code_map)
        
        counts['Percentage'] = (counts['Count'] / counts['Count'].sum()) * 100
        duration_stats.append(counts)
        
    final_durations = pd.concat(duration_stats, ignore_index=True)
    final_durations = final_durations[['Instrument', 'Duration_Code', 'Duration_Label', 'Count', 'Percentage']]
    final_durations.to_csv("report/duration_preferences.csv", index=False)
    print("Duration preferences saved to report/duration_preferences.csv")

    # 2. Analyze time horizons definition (short_term_months, mid_term_months, long_term_months)
    query_horizons = """
    SELECT 
        short_term_months,
        mid_term_months,
        long_term_months
    FROM respondent_time_horizons
    """
    
    df_horizons = pd.read_sql(query_horizons, engine)
    
    print("Computing perceived time horizons (months)...")
    horizons_summary = df_horizons.describe().transpose()
    horizons_summary.to_csv("report/duration_time_horizons_summary.csv")
    print("Time horizons summary saved to report/duration_time_horizons_summary.csv")
    
    print("Duration analysis complete.")

if __name__ == "__main__":
    main()
