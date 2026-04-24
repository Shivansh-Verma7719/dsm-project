import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, classification_report
import numpy as np

load_dotenv()

def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)
    os.makedirs("report/data", exist_ok=True)
    
    print("--- Predictive Modeling ---")
    
    # Extract base features for all models
    query = """
    SELECT 
        r.respondent_id,
        r.is_investor,
        p.gender,
        p.education_years,
        p.monthly_income_rs,
        g.is_urban,
        lr.risk_tolerance_preference
    FROM respondents r
    LEFT JOIN respondent_profile p ON r.respondent_id = p.respondent_id
    LEFT JOIN respondent_geography g ON r.respondent_id = g.respondent_id
    LEFT JOIN respondent_literacy_risk lr ON r.respondent_id = lr.respondent_id
    """
    df_base = pd.read_sql(query, engine).dropna()
    
    features = ['gender', 'education_years', 'monthly_income_rs', 'is_urban', 'risk_tolerance_preference']
    X = df_base[features].copy()
    X['is_urban'] = X['is_urban'].astype(int)
    X['log_income'] = np.log1p(X['monthly_income_rs'])
    X.drop('monthly_income_rs', axis=1, inplace=True)
    feature_cols = ['gender', 'education_years', 'is_urban', 'risk_tolerance_preference', 'log_income']

    # 1. Model 1: Predict Participation (is_investor)
    print("1. Predicting Participation...")
    y_part = df_base['is_investor'].astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(X[feature_cols], y_part, test_size=0.2, random_state=42)
    rf_part = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    rf_part.fit(X_train, y_train)
    
    auc_part = roc_auc_score(y_test, rf_part.predict_proba(X_test)[:, 1])
    print(f"Participation Model AUC: {auc_part:.3f}")
    
    # Save Feature Importance
    fi_part = pd.DataFrame({'Feature': feature_cols, 'Importance': rf_part.feature_importances_}).sort_values('Importance', ascending=False)
    fi_part['Model'] = 'Participation'
    
    # 2. Model 2: Predict How (Will they hold Equity/MF or just FD?)
    print("2. Predicting Securities Choice (Market-Linked vs Traditional)...")
    query_hold = """
    SELECT respondent_id, holds_mf_etf, holds_equity_shares 
    FROM respondent_holdings
    """
    df_hold = pd.read_sql(query_hold, engine)
    df_investors = pd.merge(df_base[df_base['is_investor']==True], df_hold, on='respondent_id')
    
    y_market = ((df_investors['holds_mf_etf'] == True) | (df_investors['holds_equity_shares'] == True)).astype(int)
    X_inv = df_investors[features].copy()
    X_inv['is_urban'] = X_inv['is_urban'].astype(int)
    X_inv['log_income'] = np.log1p(X_inv['monthly_income_rs'])
    
    X_train_i, X_test_i, y_train_i, y_test_i = train_test_split(X_inv[feature_cols], y_market, test_size=0.2, random_state=42)
    rf_sec = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    rf_sec.fit(X_train_i, y_train_i)
    
    auc_sec = roc_auc_score(y_test_i, rf_sec.predict_proba(X_test_i)[:, 1])
    print(f"Securities Choice Model AUC: {auc_sec:.3f}")
    
    fi_sec = pd.DataFrame({'Feature': feature_cols, 'Importance': rf_sec.feature_importances_}).sort_values('Importance', ascending=False)
    fi_sec['Model'] = 'Securities Choice'

    # 3. Model 3: Predict Duration (Long-term vs Short-term Equity)
    print("3. Predicting Horizon (Long-Term Equity)...")
    query_dur = """
    SELECT respondent_id, duration_equity 
    FROM respondent_instrument_duration
    WHERE duration_equity IN (1, 2, 3)
    """
    df_dur = pd.read_sql(query_dur, engine)
    df_dur_full = pd.merge(df_investors, df_dur, on='respondent_id')
    
    y_dur = (df_dur_full['duration_equity'] == 3).astype(int) # 3 is Long term
    X_dur = df_dur_full[features].copy()
    X_dur['is_urban'] = X_dur['is_urban'].astype(int)
    X_dur['log_income'] = np.log1p(X_dur['monthly_income_rs'])
    
    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(X_dur[feature_cols], y_dur, test_size=0.2, random_state=42)
    rf_dur = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    rf_dur.fit(X_train_d, y_train_d)
    
    auc_dur = roc_auc_score(y_test_d, rf_dur.predict_proba(X_test_d)[:, 1])
    print(f"Duration Model AUC: {auc_dur:.3f}")
    
    fi_dur = pd.DataFrame({'Feature': feature_cols, 'Importance': rf_dur.feature_importances_}).sort_values('Importance', ascending=False)
    fi_dur['Model'] = 'Duration (Long-Term)'

    # Combine and save feature importances
    all_fi = pd.concat([fi_part, fi_sec, fi_dur], ignore_index=True)
    all_fi.to_csv("report/data/predictive_feature_importance.csv", index=False)
    print("Saved Predictive Feature Importances.")
    
if __name__ == "__main__":
    main()
