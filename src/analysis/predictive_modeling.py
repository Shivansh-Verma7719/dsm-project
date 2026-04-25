import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import roc_auc_score
import numpy as np
import joblib

load_dotenv()

def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)
    os.makedirs("report/data", exist_ok=True)
    
    print("--- Advanced Predictive Modeling ---")
    
    # 1. Extract base features for Model 1 (Participation)
    query_base = """
    SELECT
        r.respondent_id,
        r.is_investor,
        p.gender,
        p.education_years,
        p.monthly_income_rs,
        g.is_urban,
        lr.risk_tolerance_preference,
        a.n_products_aware
    FROM respondents r
    LEFT JOIN respondent_profile p ON r.respondent_id = p.respondent_id
    LEFT JOIN respondent_geography g ON r.respondent_id = g.respondent_id
    LEFT JOIN respondent_literacy_risk lr ON r.respondent_id = lr.respondent_id
    LEFT JOIN respondent_awareness a ON r.respondent_id = a.respondent_id
    """
    df_base = pd.read_sql(query_base, engine)

    # Preprocess
    df_base['is_urban'] = df_base['is_urban'].astype(float)
    df_base['log_income'] = np.log1p(df_base['monthly_income_rs'])

    feature_cols_m1 = ['gender', 'education_years', 'is_urban', 'risk_tolerance_preference', 'log_income', 'n_products_aware']
    
    print("1. Predicting Participation...")
    df_m1 = df_base.dropna(subset=feature_cols_m1 + ['is_investor', 'n_products_aware']).copy()
    X1 = df_m1[feature_cols_m1]
    y1 = df_m1['is_investor'].astype(int)
    
    X_train1, X_test1, y_train1, y_test1 = train_test_split(X1, y1, test_size=0.2, random_state=42)
    clf1 = HistGradientBoostingClassifier(random_state=42, class_weight='balanced', max_iter=200)
    clf1.fit(X_train1, y_train1)
    
    auc1 = roc_auc_score(y_test1, clf1.predict_proba(X_test1)[:, 1])
    print(f"Participation Model AUC: {auc1:.3f}")
    
    r1 = permutation_importance(clf1, X_test1, y_test1, n_repeats=5, random_state=42)
    fi1 = pd.DataFrame({'Feature': feature_cols_m1, 'Importance': r1.importances_mean}).sort_values('Importance', ascending=False)
    fi1['Model'] = 'Participation'

    # Extract behavioral features for investors (Models 2 and 3)
    query_behavioral = """
    SELECT 
        r.respondent_id,
        lr.stock_market_familiarity,
        k.knows_direct_mf_lower_expense,
        k.knows_pension_invests_equity,
        k.knows_compounding_longterm,
        k.knows_kyc_online,
        k.knows_demat_needed,
        k.knows_high_return_high_risk,
        k.knows_diversification_reduces,
        k.knows_cas_overview,
        k.knows_bsda_basic_demat,
        i.info_social_media_influencers,
        i.info_financial_professionals,
        h.holds_mf_etf,
        h.holds_equity_shares,
        d.duration_equity
    FROM respondents r
    LEFT JOIN respondent_literacy_risk lr ON r.respondent_id = lr.respondent_id
    LEFT JOIN respondent_knowledge k ON r.respondent_id = k.respondent_id
    LEFT JOIN respondent_info_sources i ON r.respondent_id = i.respondent_id
    LEFT JOIN respondent_holdings h ON r.respondent_id = h.respondent_id
    LEFT JOIN respondent_instrument_duration d ON r.respondent_id = d.respondent_id
    WHERE r.is_investor = True
    """
    df_beh = pd.read_sql(query_behavioral, engine)
    
    # Calculate knowledge score
    know_cols = [c for c in df_beh.columns if c.startswith('knows_')]
    df_beh['actual_knowledge_score'] = (df_beh[know_cols] == 1).sum(axis=1)
    
    # Fill NA for info sources with 0
    df_beh['info_social_media'] = df_beh['info_social_media_influencers'].fillna(False).astype(float)
    df_beh['info_professionals'] = df_beh['info_financial_professionals'].fillna(False).astype(float)
    
    df_inv = pd.merge(df_base, df_beh, on='respondent_id')
    
    feature_cols_m23 = feature_cols_m1 + ['stock_market_familiarity', 'actual_knowledge_score', 'info_social_media', 'info_professionals']
    
    # 2. Model 2: Predicting Securities Choice
    print("2. Predicting Securities Choice (Market-Linked vs Traditional)...")
    df_m2 = df_inv.dropna(subset=['holds_mf_etf', 'holds_equity_shares']).copy()
    y2 = ((df_m2['holds_mf_etf'] == True) | (df_m2['holds_equity_shares'] == True)).astype(int)
    X2 = df_m2[feature_cols_m23]
    
    X_train2, X_test2, y_train2, y_test2 = train_test_split(X2, y2, test_size=0.2, random_state=42)
    clf2 = HistGradientBoostingClassifier(random_state=42, class_weight='balanced', max_iter=200)
    clf2.fit(X_train2, y_train2)
    
    auc2 = roc_auc_score(y_test2, clf2.predict_proba(X_test2)[:, 1])
    print(f"Securities Choice Model AUC: {auc2:.3f}")
    
    r2 = permutation_importance(clf2, X_test2, y_test2, n_repeats=5, random_state=42)
    fi2 = pd.DataFrame({'Feature': feature_cols_m23, 'Importance': r2.importances_mean}).sort_values('Importance', ascending=False)
    fi2['Model'] = 'Securities Choice'

    # 3. Model 3: Predicting Duration
    print("3. Predicting Horizon (Long-Term Equity)...")
    df_m3 = df_inv[df_inv['duration_equity'].isin([1, 2, 3])].copy()
    y3 = (df_m3['duration_equity'] == 3).astype(int)
    X3 = df_m3[feature_cols_m23]
    
    X_train3, X_test3, y_train3, y_test3 = train_test_split(X3, y3, test_size=0.2, random_state=42)
    clf3 = HistGradientBoostingClassifier(random_state=42, class_weight='balanced', max_iter=200)
    clf3.fit(X_train3, y_train3)
    
    auc3 = roc_auc_score(y_test3, clf3.predict_proba(X_test3)[:, 1])
    print(f"Duration Model AUC: {auc3:.3f}")
    
    r3 = permutation_importance(clf3, X_test3, y_test3, n_repeats=5, random_state=42)
    fi3 = pd.DataFrame({'Feature': feature_cols_m23, 'Importance': r3.importances_mean}).sort_values('Importance', ascending=False)
    fi3['Model'] = 'Duration (Long-Term)'

    # Combine and save feature importances
    all_fi = pd.concat([fi1, fi2, fi3], ignore_index=True)
    # Normalize importance within each model so it plots nicely (0 to 1)
    all_fi['Importance'] = all_fi.groupby('Model')['Importance'].transform(lambda x: x / x.max())
    
    all_fi.to_csv("report/data/predictive_feature_importance.csv", index=False)
    print("Saved Predictive Feature Importances.")
    
    # Save AUC scores to a text file to easily put in the report
    with open("report/data/auc_scores.txt", "w") as f:
        f.write(f"Model 1 (Participation) AUC: {auc1:.3f}\n")
        f.write(f"Model 2 (Securities) AUC: {auc2:.3f}\n")
        f.write(f"Model 3 (Duration) AUC: {auc3:.3f}\n")

    # Save Models for the Dashboard Backend
    os.makedirs('backend/models', exist_ok=True)
    joblib.dump(clf1, 'backend/models/model1_participation.joblib')
    joblib.dump(clf2, 'backend/models/model2_securities.joblib')
    joblib.dump(clf3, 'backend/models/model3_duration.joblib')
    print("Models saved to backend/models/")

if __name__ == "__main__":
    main()
