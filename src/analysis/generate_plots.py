import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as plt_sns
import numpy as np

# Configure academic style
plt_sns.set_theme(style="whitegrid", context="paper", font_scale=1.5)
plt.rcParams.update({
    'font.family': 'serif',
    'figure.figsize': (10, 6),
    'axes.titlesize': 18,
    'axes.labelsize': 16,
    'xtick.labelsize': 14,
    'ytick.labelsize': 14,
    'legend.fontsize': 14,
    'figure.dpi': 300
})

os.makedirs("figures", exist_ok=True)

def plot_odds_ratios():
    print("Generating Odds Ratios plot...")
    df = pd.read_csv("report/data/who_participates_logistic_regression.csv")
    df = df.dropna()
    name_map = {'education_years': 'Years of Education', 'log_income': 'Log(Monthly Income)', 'is_urban': 'Urban Resident', 'gender_male': 'Male Gender', 'risk_tolerance_preference': 'Risk Tolerance'}
    df['Feature'] = df['Feature'].map(name_map).fillna(df['Feature'])
    df = df.sort_values('Odds Ratio', ascending=True)

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.barh(df['Feature'], df['Odds Ratio'] - 1, left=1, color='steelblue', edgecolor='black')
    ax.axvline(x=1, color='red', linestyle='--', linewidth=2)
    ax.set_xlabel('Odds Ratio (Baseline = 1.0)')
    ax.set_title('Determinants of Market Participation (Odds Ratios)')
    for i, v in enumerate(df['Odds Ratio']):
        ax.text(v + 0.02, i, f"{v:.2f}", va='center', fontweight='bold')
    plt.tight_layout()
    plt.savefig("figures/fig1_odds_ratios.pdf")
    plt.close()

def plot_barriers():
    print("Generating Barriers plot...")
    df = pd.read_csv("report/data/who_participates_barriers.csv")
    df = df.head(10).sort_values('Percentage_of_NonInvestors', ascending=True)
    df['Barrier'] = df['Barrier'].str.replace('barrier_', '').str.replace('_', ' ').str.title()
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(df['Barrier'], df['Percentage_of_NonInvestors'], color='indianred', edgecolor='black')
    ax.set_xlabel('Percentage of Non-Investors (%)')
    ax.set_title('Top Barriers to Market Participation')
    for i, v in enumerate(df['Percentage_of_NonInvestors']):
        ax.text(v + 0.5, i, f"{v:.1f}%", va='center')
    plt.tight_layout()
    plt.savefig("figures/fig2_barriers.pdf")
    plt.close()

def plot_securities_by_income():
    print("Generating Securities by Income plot...")
    df = pd.read_csv("report/data/which_securities_by_income.csv")
    cols = ['income_quartile', 'holds_fd_rd', 'holds_equity_shares', 'holds_mf_etf', 'holds_ulip']
    df = df[cols]
    df_melt = df.melt(id_vars='income_quartile', var_name='Instrument', value_name='Penetration (%)')
    name_map = {'holds_fd_rd': 'Fixed Deposits', 'holds_equity_shares': 'Direct Equity', 'holds_mf_etf': 'Mutual Funds/ETFs', 'holds_ulip': 'ULIPs'}
    df_melt['Instrument'] = df_melt['Instrument'].map(name_map)
    df_melt['income_quartile'] = df_melt['income_quartile'].apply(lambda x: x.replace('(', '').replace(']', '').replace(', ', ' - '))
    fig, ax = plt.subplots(figsize=(12, 6))
    plt_sns.barplot(data=df_melt, x='income_quartile', y='Penetration (%)', hue='Instrument', palette='viridis', edgecolor='black')
    ax.set_xlabel('Income Quartile (INR)')
    ax.set_ylabel('Penetration among Investors (%)')
    ax.set_title('Securities Penetration by Income Level')
    plt.xticks(rotation=15)
    plt.legend(title='Instrument')
    plt.tight_layout()
    plt.savefig("figures/fig3_securities_income.pdf")
    plt.close()

def plot_duration():
    print("Generating Duration Preferences plot...")
    df = pd.read_csv("report/data/duration_preferences.csv")
    df = df[df['Duration_Label'] != "Don't Know"]
    name_map = {'equity': 'Direct Equity', 'fo': 'Futures & Options', 'reits': 'REITs', 'corp_bonds': 'Corporate Bonds'}
    df['Instrument'] = df['Instrument'].map(name_map)
    pivot_df = df.pivot(index='Instrument', columns='Duration_Label', values='Percentage').fillna(0)
    cols = ['Short term', 'Mid term', 'Long term']
    pivot_df = pivot_df[cols]
    fig, ax = plt.subplots(figsize=(10, 6))
    pivot_df.plot(kind='bar', stacked=True, ax=ax, colormap='crest', edgecolor='black')
    ax.set_xlabel('Instrument')
    ax.set_ylabel('Percentage of Respondents (%)')
    ax.set_title('Preferred Holding Duration by Instrument')
    plt.xticks(rotation=0)
    plt.legend(title='Duration', bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig("figures/fig4_duration.pdf")
    plt.close()

def plot_dunning_kruger():
    print("Generating Dunning-Kruger plot...")
    df = pd.read_csv("report/data/advanced_dunning_kruger.csv")
    df['Cohort'] = df['is_overconfident'].map({True: 'Overconfident (High Familiarity, Low Knowledge)', False: 'Calibrated'})
    df_melt = df.melt(id_vars='Cohort', value_vars=['holds_derivatives_fo', 'holds_crypto'], var_name='Asset', value_name='Penetration')
    df_melt['Asset'] = df_melt['Asset'].map({'holds_derivatives_fo': 'Futures & Options', 'holds_crypto': 'Crypto'})
    
    fig, ax = plt.subplots(figsize=(8, 6))
    plt_sns.barplot(data=df_melt, x='Asset', y='Penetration', hue='Cohort', palette='Set2', edgecolor='black')
    ax.set_title('Risky Asset Penetration: Overconfident vs Calibrated')
    ax.set_ylabel('Penetration (%)')
    plt.tight_layout()
    plt.savefig("figures/fig5_dunning_kruger.pdf")
    plt.close()

def plot_finfluencers():
    print("Generating Finfluencer Impact plot...")
    df = pd.read_csv("report/data/advanced_finfluencers.csv")
    df_melt = df.melt(id_vars='cohort', value_vars=['motive_quick_gains', 'motive_long_term_growth'], var_name='Motive', value_name='Percentage')
    df_melt['Motive'] = df_melt['Motive'].map({'motive_quick_gains': 'Quick Gains', 'motive_long_term_growth': 'Long Term Growth'})
    
    fig, ax = plt.subplots(figsize=(8, 6))
    plt_sns.barplot(data=df_melt, x='cohort', y='Percentage', hue='Motive', palette='Dark2', edgecolor='black')
    ax.set_title('Investment Motives: Finfluencers vs Professionals')
    ax.set_ylabel('Prevalence (%)')
    plt.tight_layout()
    plt.savefig("figures/fig6_finfluencers.pdf")
    plt.close()

def plot_predictive_importance():
    print("Generating Predictive Feature Importance plot...")
    df = pd.read_csv("report/data/predictive_feature_importance.csv")
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 6), sharey=True)
    models = ['Participation', 'Securities Choice', 'Duration (Long-Term)']
    
    for i, model in enumerate(models):
        subset = df[df['Model'] == model].sort_values('Importance', ascending=True)
        # Clean names
        subset['Feature'] = subset['Feature'].map({
            'education_years': 'Education', 'log_income': 'Income', 'is_urban': 'Urban',
            'gender': 'Gender', 'risk_tolerance_preference': 'Risk Tolerance'
        }).fillna(subset['Feature'])
        
        axes[i].barh(subset['Feature'], subset['Importance'], color='teal', edgecolor='black')
        axes[i].set_title(f'{model} Model')
        axes[i].set_xlabel('Feature Importance')
        
    plt.suptitle('Random Forest Feature Importances across Predictive Models', fontsize=20)
    plt.tight_layout()
    plt.savefig("figures/fig7_predictive_importance.pdf")
    plt.close()

if __name__ == "__main__":
    plot_odds_ratios()
    plot_barriers()
    plot_securities_by_income()
    plot_duration()
    plot_dunning_kruger()
    plot_finfluencers()
    plot_predictive_importance()
    print("All figures generated successfully.")
