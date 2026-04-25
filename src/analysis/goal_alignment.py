import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from dotenv import load_dotenv
import matplotlib.pyplot as plt
import seaborn as sns

load_dotenv()

def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)
    os.makedirs("figures", exist_ok=True)
    os.makedirs("report/data", exist_ok=True)
    
    print("--- Goal-Portfolio Alignment Analysis ---")
    
    # 1. Fetch data
    query = """
    SELECT 
        r.respondent_id,
        gr.*,
        h.*
    FROM respondents r
    JOIN respondent_goal_ranks gr ON r.respondent_id = gr.respondent_id
    JOIN respondent_holdings h ON r.respondent_id = h.respondent_id
    WHERE r.is_investor = true
    """
    df = pd.read_sql(query, engine)
    
    # 2. Identify Top Goal (Rank 1)
    goal_cols = [c for c in df.columns if c.startswith('goal_rank_')]
    def get_top_goal(row):
        for col in goal_cols:
            if row[col] == 1:
                return col.replace('goal_rank_', '').replace('_', ' ').title()
        return "No Primary Goal"

    df['top_goal'] = df.apply(get_top_goal, axis=1)
    
    # 3. Categorize instruments
    # Long-term: MF, NPS, PPF, EPF, SGB
    # Speculative: F&O, Crypto
    # Traditional: FD/RD, Post Office
    
    df['long_term_score'] = df[['holds_mf_etf', 'holds_nps', 'holds_ppf_vpf', 'holds_epf', 'holds_sgb']].sum(axis=1)
    df['speculative_score'] = df[['holds_derivatives_fo', 'holds_crypto']].sum(axis=1)
    
    # 4. Filter for relevant goals mentioned by user
    target_goals = ['Retirement', 'Children Education', 'Financial Independence', 'Grow Wealth', 'Daily Trading']
    df_filtered = df[df['top_goal'].isin(target_goals)]
    
    # 5. Aggregate penetration by Goal
    alignment = df_filtered.groupby('top_goal').agg({
        'holds_mf_etf': 'mean',
        'holds_nps': 'mean',
        'holds_ppf_vpf': 'mean',
        'holds_epf': 'mean',
        'holds_derivatives_fo': 'mean',
        'holds_crypto': 'mean',
        'holds_fd_rd': 'mean'
    }).reset_index()
    
    # Plot 1: The Alignment Heatmap
    plt.figure(figsize=(12, 6))
    plot_data = alignment.set_index('top_goal')
    plot_data.columns = ['MF/ETF', 'NPS', 'PPF', 'EPF', 'F&O', 'Crypto', 'FD/RD']
    
    sns.heatmap(plot_data * 100, annot=True, fmt=".1f", cmap="YlGnBu", cbar_kws={'label': 'Penetration (%)'})
    plt.title('Asset Penetration by Primary Financial Goal', fontsize=14, pad=20)
    plt.xlabel('Investment Instrument', fontsize=12)
    plt.ylabel('Primary Goal', fontsize=12)
    plt.tight_layout()
    plt.savefig('figures/fig8_goal_alignment_heatmap.pdf')
    plt.close()
    
    # 6. Calculate Misalignment Index
    # For LT Goals: Alignment = High LT score, Low Speculative
    # For Speculative Goals: Alignment = High Speculative score
    
    def is_aligned(row):
        lt_goals = ['Retirement', 'Children Education', 'Financial Independence', 'Grow Wealth']
        if row['top_goal'] in lt_goals:
            return 1 if (row['long_term_score'] > 0 and row['speculative_score'] == 0) else 0
        if row['top_goal'] == 'Daily Trading':
            return 1 if row['speculative_score'] > 0 else 0
        return 0

    df_filtered['is_aligned'] = df_filtered.apply(is_aligned, axis=1)
    alignment_summary = df_filtered.groupby('top_goal')['is_aligned'].mean() * 100
    
    # Save stats for the paper
    alignment_summary.to_csv('report/data/goal_alignment_stats.csv')
    
    # Plot 2: Internal Consistency Bar Chart
    plt.figure(figsize=(10, 5))
    colors = ['#2a3f6b' if g != 'Daily Trading' else '#c9852a' for g in alignment_summary.index]
    alignment_summary.sort_values().plot(kind='barh', color=colors)
    plt.title('Portfolio Internal Consistency Score by Goal', fontsize=14)
    plt.xlabel('Percentage of Aligned Portfolios (%)', fontsize=12)
    plt.ylabel('Primary Goal', fontsize=12)
    plt.grid(axis='x', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig('figures/fig9_consistency_score.pdf')
    plt.close()

    print(f"Analysis complete. Figures saved to figures/")
    print(f"Alignment Summary:\n{alignment_summary}")

if __name__ == "__main__":
    main()
