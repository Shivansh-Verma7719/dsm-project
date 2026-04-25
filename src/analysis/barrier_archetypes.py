import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from dotenv import load_dotenv
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans

load_dotenv()

def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url: return

    engine = create_engine(db_url)
    os.makedirs("figures", exist_ok=True)
    os.makedirs("report/data", exist_ok=True)
    
    query = """
    SELECT 
        r.respondent_id, b.*, p.gender, p.education_years, p.monthly_income_rs, g.is_urban
    FROM respondents r
    JOIN respondent_barriers b ON r.respondent_id = b.respondent_id
    JOIN respondent_profile p ON r.respondent_id = p.respondent_id
    JOIN respondent_geography g ON r.respondent_id = g.respondent_id
    WHERE r.is_investor = false
    """
    df = pd.read_sql(query, engine).fillna(0)
    barrier_cols = [c for c in df.columns if c.startswith('barrier_')]
    
    # Engaged non-investors only
    df['total_barriers'] = df[barrier_cols].astype(int).sum(axis=1)
    df_engaged = df[df['total_barriers'] > 0].copy()
    X = df_engaged[barrier_cols].astype(int)
    
    # 3 clusters for latent profiles
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=20)
    df_engaged['archetype_id'] = kmeans.fit_predict(X)
    centroids = pd.DataFrame(kmeans.cluster_centers_, columns=barrier_cols)
    
    # Strategic naming based on clear separations
    # 1. Fear-Driven (High Fear of Loss)
    # 2. Knowledge-Gated (High Lack Knowledge / Don't Know How)
    # 3. Trust-Deficient (High Lack Trust)
    
    fear_idx = centroids['barrier_fear_of_loss'].idxmax()
    know_idx = centroids['barrier_lack_knowledge'].idxmax()
    
    # The remaining one
    all_indices = set([0, 1, 2])
    remaining = list(all_indices - {fear_idx, know_idx})
    
    # If fear and know are the same (unlikely but check)
    if fear_idx == know_idx:
        # Re-sort
        fear_idx = centroids['barrier_fear_of_loss'].argsort()[2]
        know_idx = centroids['barrier_lack_knowledge'].argsort()[2]
        if fear_idx == know_idx: know_idx = centroids['barrier_lack_knowledge'].argsort()[1]
        remaining = list(all_indices - {fear_idx, know_idx})

    trust_idx = remaining[0]
    
    archetype_names = {
        fear_idx: "Fear-Driven",
        know_idx: "Knowledge-Gated",
        trust_idx: "Trust-Deficient"
    }
    
    df_engaged['archetype'] = df_engaged['archetype_id'].map(archetype_names)
    
    # Heatmap
    plt.figure(figsize=(16, 6))
    plot_centroids = centroids.copy()
    plot_centroids.index = [archetype_names[i] for i in range(3)]
    plot_centroids.columns = [c.replace('barrier_', '').replace('_', ' ').title() for c in barrier_cols]
    sns.heatmap(plot_centroids, annot=True, fmt=".2f", cmap="YlGnBu")
    plt.title('Latent Barrier Archetypes: Latent Profile Matrix', fontsize=14)
    plt.tight_layout()
    plt.savefig('figures/fig10_barrier_archetypes_heatmap.pdf')
    plt.close()
    
    # 5. Demographics Cross-tab
    df_engaged['income_quartile'] = pd.qcut(df_engaged['monthly_income_rs'], 4, labels=['Q1', 'Q2', 'Q3', 'Q4'])
    df_engaged['residency'] = df_engaged['is_urban'].map({True: 'Urban', False: 'Rural'})
    
    # Combined plot for Cross-tab (Only Income and Residency)
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    colors = ['#2a3f6b', '#c9852a', '#10b981']
    
    for ax, col, title in zip(axes, 
                             ['income_quartile', 'residency'],
                             ['By Income Quartile', 'By Residency']):
        ct = pd.crosstab(df_engaged[col], df_engaged['archetype'], normalize='index') * 100
        ct.plot(kind='bar', stacked=True, ax=ax, color=colors)
        ax.set_title(title, fontsize=14)
        ax.set_ylabel('Percentage (%)')
        ax.legend(title='Archetype', bbox_to_anchor=(1.05, 1), loc='upper left')

    plt.tight_layout()
    plt.savefig('figures/fig11_archetype_demographics.pdf')
    plt.close()
    
    # Save stats
    summary = df_engaged['archetype'].value_counts(normalize=True) * 100
    summary.to_csv('report/data/barrier_archetype_summary.csv')
    print("Clustering complete.")
    print(summary)

if __name__ == "__main__":
    main()
