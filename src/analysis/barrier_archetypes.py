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
    
    # Optimization: Multi-Metric Cluster Validation
    from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
    metrics = {'inertia': [], 'silhouette': [], 'davies_bouldin': [], 'calinski_harabasz': []}
    K = range(2, 11)
    
    for k in K:
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X)
        metrics['inertia'].append(km.inertia_)
        metrics['silhouette'].append(silhouette_score(X, labels, sample_size=5000, random_state=42))
        metrics['davies_bouldin'].append(davies_bouldin_score(X, labels))
        metrics['calinski_harabasz'].append(calinski_harabasz_score(X, labels))
    
    # Create a 2x2 diagnostic plot
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # 1. Inertia (Elbow)
    axes[0, 0].plot(K, metrics['inertia'], 'bx-')
    axes[0, 0].set_title('Inertia (Elbow Method)')
    axes[0, 0].axvline(x=3, color='r', linestyle='--')
    
    # 2. Silhouette (Higher is better)
    axes[0, 1].plot(K, metrics['silhouette'], 'ro-')
    axes[0, 1].set_title('Silhouette Score')
    axes[0, 1].axvline(x=3, color='g', linestyle='--')
    
    # 3. Davies-Bouldin (Lower is better)
    axes[1, 0].plot(K, metrics['davies_bouldin'], 'go-')
    axes[1, 0].set_title('Davies-Bouldin Index (Lower is Better)')
    axes[1, 0].axvline(x=3, color='r', linestyle='--')
    
    # 4. Calinski-Harabasz (Higher is better)
    axes[1, 1].plot(K, metrics['calinski_harabasz'], 'mo-')
    axes[1, 1].set_title('Calinski-Harabasz Index')
    axes[1, 1].axvline(x=3, color='g', linestyle='--')
    
    for ax in axes.flat:
        ax.set_xlabel('k')
        ax.grid(True, alpha=0.3)
        
    plt.suptitle('Multi-Metric Cluster Optimization: Validation of k=3', fontsize=16)
    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    plt.savefig('figures/fig14_elbow_plot.pdf')
    plt.close()

    # 3 clusters for latent profiles
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=20)
    df_engaged['archetype_id'] = kmeans.fit_predict(X)
    centroids = pd.DataFrame(kmeans.cluster_centers_, columns=barrier_cols)
    
    # Strategic naming based on absolute peaks
    # We identify Fear and Trust clusters by their perfect 1.0 centroids
    fear_idx = centroids['barrier_fear_of_loss'].idxmax()
    trust_idx = centroids['barrier_lack_trust'].idxmax()
    
    # The remaining one is Knowledge-Gated
    all_indices = set([0, 1, 2])
    remaining = list(all_indices - {fear_idx, trust_idx})
    know_idx = remaining[0]
    
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
    
    # 6. Archetype Peaks (Defining Barriers)
    plt.figure(figsize=(15, 5))
    for i, name in enumerate([archetype_names[0], archetype_names[1], archetype_names[2]]):
        plt.subplot(1, 3, i+1)
        top_barriers = plot_centroids.loc[name].sort_values(ascending=False).head(5)
        top_barriers.plot(kind='barh', color=colors[i])
        plt.title(f'Top Barriers: {name}')
        plt.xlabel('Probability')
        plt.gca().invert_yaxis()
    
    plt.tight_layout()
    plt.savefig('figures/fig15_archetype_peaks.pdf')
    plt.close()

    # Save stats
    summary = df_engaged['archetype'].value_counts(normalize=True) * 100
    summary.to_csv('report/data/barrier_archetype_summary.csv')
    print("Clustering complete.")
    print(summary)

if __name__ == "__main__":
    main()
