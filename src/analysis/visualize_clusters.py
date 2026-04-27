import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from dotenv import load_dotenv
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

load_dotenv()

def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url: 
        print("DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)
    os.makedirs("figures", exist_ok=True)
    
    query = """
    SELECT 
        r.respondent_id, b.*
    FROM respondents r
    JOIN respondent_barriers b ON r.respondent_id = b.respondent_id
    WHERE r.is_investor = false
    """
    df = pd.read_sql(query, engine).fillna(0)
    barrier_cols = [c for c in df.columns if c.startswith('barrier_')]
    
    df['total_barriers'] = df[barrier_cols].astype(int).sum(axis=1)
    df_engaged = df[df['total_barriers'] > 0].copy()
    X = df_engaged[barrier_cols].astype(int)
    
    # 3 clusters (consistent with main analysis)
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=20)
    clusters = kmeans.fit_predict(X)
    df_engaged['archetype_id'] = clusters
    
    # PCA for dimensionality reduction
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X)
    df_engaged['pca1'] = X_pca[:, 0]
    df_engaged['pca2'] = X_pca[:, 1]
    
    # Archetype naming (consistent with main script)
    centroids = pd.DataFrame(kmeans.cluster_centers_, columns=barrier_cols)
    fear_idx = centroids['barrier_fear_of_loss'].idxmax()
    know_idx = centroids['barrier_lack_knowledge'].idxmax()
    all_indices = {0, 1, 2}
    trust_idx = list(all_indices - {fear_idx, know_idx})[0]
    
    archetype_names = {
        fear_idx: "Fear-Driven",
        know_idx: "Knowledge-Gated",
        trust_idx: "Trust-Deficient"
    }
    df_engaged['Archetype'] = df_engaged['archetype_id'].map(archetype_names)
    
    # Plotting
    plt.figure(figsize=(10, 8))
    sns.set_style("whitegrid")
    
    # Custom palette matching presentation colors if possible, otherwise nice ones
    colors = {"Fear-Driven": "#10b981", "Knowledge-Gated": "#c9852a", "Trust-Deficient": "#2a3f6b"}
    
    sns.scatterplot(
        data=df_engaged, 
        x='pca1', y='pca2', 
        hue='Archetype', 
        palette=colors,
        alpha=0.4, 
        s=40,
        edgecolor='w',
        linewidth=0.2
    )
    
    # Plot centroids
    centers_pca = pca.transform(kmeans.cluster_centers_)
    plt.scatter(
        centers_pca[:, 0], centers_pca[:, 1],
        c='black', s=200, marker='X', label='Centroids',
        edgecolor='white', linewidth=1.5
    )
    
    plt.title('Barrier Archetypes: PCA Projection of 18-D Barrier Space', fontsize=15, pad=20)
    plt.xlabel(f'PCA Component 1 ({pca.explained_variance_ratio_[0]:.1%} variance)', fontsize=12)
    plt.ylabel(f'PCA Component 2 ({pca.explained_variance_ratio_[1]:.1%} variance)', fontsize=12)
    plt.legend(title='Archetype', bbox_to_anchor=(1.05, 1), loc='upper left')
    
    plt.tight_layout()
    plt.savefig('figures/fig13_cluster_pca.pdf', bbox_inches='tight')
    plt.savefig('figures/fig13_cluster_pca.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    print("PCA visualization created: figures/fig13_cluster_pca.pdf")

if __name__ == "__main__":
    main()
