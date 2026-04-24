import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

load_dotenv()

def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)
    os.makedirs("report/data", exist_ok=True)

    print("--- Advanced Behavioral Analysis ---")

    # 1. Dunning-Kruger Effect
    print("1. Analyzing Knowledge vs Confidence...")
    query_dk = """
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
        h.holds_derivatives_fo,
        h.holds_crypto
    FROM respondents r
    JOIN respondent_literacy_risk lr ON r.respondent_id = lr.respondent_id
    JOIN respondent_knowledge k ON r.respondent_id = k.respondent_id
    LEFT JOIN respondent_holdings h ON r.respondent_id = h.respondent_id
    WHERE lr.stock_market_familiarity IS NOT NULL
    """
    df_dk = pd.read_sql(query_dk, engine)
    
    # Calculate actual knowledge score (True = 1, else 0 for most, except some where True is correct)
    # Based on database_reference: 
    # True (1) is correct for: knows_direct_mf_lower_expense, knows_pension_invests_equity, knows_compounding_longterm, knows_kyc_online, knows_demat_needed, knows_high_return_high_risk, knows_diversification_reduces, knows_cas_overview, knows_bsda_basic_demat
    # Actually, all statements are technically True. So score is count of '1's.
    knowledge_cols = [c for c in df_dk.columns if c.startswith('knows_')]
    df_dk['actual_score'] = (df_dk[knowledge_cols] == 1).sum(axis=1)
    
    # Map familiarity to overconfidence
    # High familiarity (4 or 5) but low score (<=4 out of 9) -> Overconfident
    df_dk['is_overconfident'] = ((df_dk['stock_market_familiarity'] >= 4) & (df_dk['actual_score'] <= 4))
    
    # See if overconfident hold risky assets
    dk_risky = df_dk.groupby('is_overconfident')[['holds_derivatives_fo', 'holds_crypto']].mean() * 100
    dk_risky.reset_index(inplace=True)
    dk_risky.to_csv("report/data/advanced_dunning_kruger.csv", index=False)
    print("Saved Dunning-Kruger insights.")

    # 2. Finfluencer Effect
    print("2. Analyzing Finfluencer Impact...")
    query_fin = """
    SELECT 
        r.respondent_id,
        i.info_social_media_influencers,
        i.info_financial_professionals,
        h.holds_mf_etf,
        h.holds_equity_shares,
        h.holds_derivatives_fo,
        m.motive_quick_gains,
        m.motive_long_term_growth
    FROM respondent_info_sources i
    JOIN respondents r ON i.respondent_id = r.respondent_id
    JOIN respondent_holdings h ON i.respondent_id = h.respondent_id
    JOIN respondent_motivations m ON i.respondent_id = m.respondent_id
    """
    df_fin = pd.read_sql(query_fin, engine)
    
    # Segment: strictly influencers vs strictly pros
    df_fin['cohort'] = 'Mixed / Other'
    df_fin.loc[(df_fin['info_social_media_influencers'] == True) & (df_fin['info_financial_professionals'] == False), 'cohort'] = 'Finfluencers Only'
    df_fin.loc[(df_fin['info_social_media_influencers'] == False) & (df_fin['info_financial_professionals'] == True), 'cohort'] = 'Professionals Only'
    
    fin_stats = df_fin[df_fin['cohort'] != 'Mixed / Other'].groupby('cohort')[['holds_mf_etf', 'holds_equity_shares', 'holds_derivatives_fo', 'motive_quick_gains', 'motive_long_term_growth']].mean() * 100
    fin_stats.reset_index(inplace=True)
    fin_stats.to_csv("report/data/advanced_finfluencers.csv", index=False)
    print("Saved Finfluencer insights.")

    # 3. Behavioral Archetypes (Clustering)
    print("3. Unsupervised Clustering of Investors...")
    query_cluster = """
    SELECT 
        r.respondent_id,
        p.monthly_income_rs,
        p.education_years,
        lr.risk_tolerance_preference,
        h.holds_fd_rd,
        h.holds_mf_etf,
        h.holds_equity_shares,
        h.holds_derivatives_fo
    FROM respondents r
    JOIN respondent_profile p ON r.respondent_id = p.respondent_id
    JOIN respondent_literacy_risk lr ON r.respondent_id = lr.respondent_id
    JOIN respondent_holdings h ON r.respondent_id = h.respondent_id
    WHERE r.is_investor = True
    """
    df_cluster = pd.read_sql(query_cluster, engine)
    df_cluster = df_cluster.dropna()
    
    features = ['risk_tolerance_preference', 'holds_fd_rd', 'holds_mf_etf', 'holds_equity_shares', 'holds_derivatives_fo']
    X = df_cluster[features].astype(float)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df_cluster['cluster'] = kmeans.fit_predict(X_scaled)
    
    # Profile clusters
    cluster_profile = df_cluster.groupby('cluster')[features].mean().reset_index()
    # Also add income and education just for context (not scaled)
    context_profile = df_cluster.groupby('cluster')[['monthly_income_rs', 'education_years']].median().reset_index()
    full_profile = pd.merge(cluster_profile, context_profile, on='cluster')
    
    # Assign names based on simple heuristics
    def name_cluster(row):
        if row['holds_fd_rd'] > 0.8 and row['holds_equity_shares'] < 0.2:
            return "Conservative Saver"
        elif row['holds_derivatives_fo'] > 0.1 or row['risk_tolerance_preference'] > 2.5:
            return "Risk-Seeking Trader"
        else:
            return "Pragmatic Wealth Builder"
            
    full_profile['Archetype'] = full_profile.apply(name_cluster, axis=1)
    full_profile.to_csv("report/data/advanced_archetypes.csv", index=False)
    print("Saved Archetype insights.")

    print("Advanced Behavioral Analysis complete.")

if __name__ == "__main__":
    main()
