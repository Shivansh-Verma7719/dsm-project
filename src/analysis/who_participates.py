import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Optional: using scikit-learn for Logistic Regression
try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

load_dotenv()

def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)
    
    # Ensure output directories exist
    os.makedirs("report", exist_ok=True)
    os.makedirs("figures", exist_ok=True)

    print("Extracting data for Participation Analysis...")
    
    # Extract merged dataset for determinants
    query = """
    SELECT 
        r.respondent_id,
        r.is_investor,
        r.survey_weight,
        p.gender,
        p.education_years,
        p.life_stage,
        p.monthly_income_rs,
        g.is_urban,
        g.zone,
        lr.risk_tolerance_preference
    FROM respondents r
    LEFT JOIN respondent_profile p ON r.respondent_id = p.respondent_id
    LEFT JOIN respondent_geography g ON r.respondent_id = g.respondent_id
    LEFT JOIN respondent_literacy_risk lr ON r.respondent_id = lr.respondent_id
    """
    
    df = pd.read_sql(query, engine)
    
    # 1. Descriptive Statistics
    print("Computing descriptive statistics...")
    # Group by various demographics to find participation rate (unweighted for simplicity first)
    desc_stats = []
    
    for col in ['gender', 'life_stage', 'is_urban', 'zone', 'risk_tolerance_preference']:
        grouped = df.groupby(col)['is_investor'].agg(['mean', 'count']).reset_index()
        grouped['characteristic'] = col
        grouped.rename(columns={col: 'category', 'mean': 'participation_rate', 'count': 'sample_size'}, inplace=True)
        desc_stats.append(grouped[['characteristic', 'category', 'participation_rate', 'sample_size']])
        
    # Handle income and education grouping
    df['income_bucket'] = pd.qcut(df['monthly_income_rs'], q=5, duplicates='drop')
    inc_grouped = df.groupby('income_bucket')['is_investor'].agg(['mean', 'count']).reset_index()
    inc_grouped['characteristic'] = 'income_quintile'
    inc_grouped.rename(columns={'income_bucket': 'category', 'mean': 'participation_rate', 'count': 'sample_size'}, inplace=True)
    inc_grouped['category'] = inc_grouped['category'].astype(str)
    desc_stats.append(inc_grouped[['characteristic', 'category', 'participation_rate', 'sample_size']])
    
    final_desc = pd.concat(desc_stats, ignore_index=True)
    final_desc.to_csv("report/who_participates_descriptive.csv", index=False)
    print("Descriptive stats saved to report/who_participates_descriptive.csv")

    # 2. Econometric Modeling (Logistic Regression)
    if SKLEARN_AVAILABLE:
        print("Running Logistic Regression for Determinants...")
        # Prepare data: drop na for regression
        model_df = df.dropna(subset=['education_years', 'monthly_income_rs', 'is_urban', 'risk_tolerance_preference', 'gender']).copy()
        
        # Features: education_years, log(income), is_urban(bool to int), gender(binary), risk_tolerance(1 to 3)
        model_df['log_income'] = np.log1p(model_df['monthly_income_rs'])
        model_df['is_urban'] = model_df['is_urban'].astype(int)
        model_df['gender_male'] = (model_df['gender'] == 1).astype(int)
        
        X = model_df[['education_years', 'log_income', 'is_urban', 'gender_male', 'risk_tolerance_preference']]
        y = model_df['is_investor'].astype(int)
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # We can apply sample weights here, but running unweighted first for general insights
        weights = model_df['survey_weight']
        
        clf = LogisticRegression(class_weight='balanced', random_state=42)
        clf.fit(X_scaled, y, sample_weight=weights)
        
        coef_df = pd.DataFrame({
            'Feature': X.columns,
            'Coefficient (Scaled)': clf.coef_[0],
            'Odds Ratio': np.exp(clf.coef_[0])
        }).sort_values(by='Odds Ratio', ascending=False)
        
        coef_df.to_csv("report/who_participates_logistic_regression.csv", index=False)
        print("Logistic Regression results saved to report/who_participates_logistic_regression.csv")
    else:
        print("scikit-learn not available. Skipping Logistic Regression.")

    # 3. Barriers Analysis (Why do non-investors stay out?)
    print("Analyzing barriers for non-investors...")
    barriers_query = """
    SELECT * FROM respondent_barriers
    """
    df_barriers = pd.read_sql(barriers_query, engine)
    
    # Sum up the True values for each barrier column
    barrier_cols = [c for c in df_barriers.columns if c.startswith('barrier_')]
    barrier_counts = df_barriers[barrier_cols].sum().reset_index()
    barrier_counts.columns = ['Barrier', 'Count']
    barrier_counts['Percentage_of_NonInvestors'] = (barrier_counts['Count'] / df_barriers.shape[0]) * 100
    barrier_counts = barrier_counts.sort_values(by='Count', ascending=False)
    
    barrier_counts.to_csv("report/who_participates_barriers.csv", index=False)
    print("Barriers analysis saved to report/who_participates_barriers.csv")

if __name__ == "__main__":
    main()
