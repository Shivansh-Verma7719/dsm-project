import os
import pandas as pd
import numpy as np
import joblib
from dotenv import load_dotenv

load_dotenv()

def main():
    # 1. Load the model
    model_path = 'backend/models/model1_participation.joblib'
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}.")
        return
    
    clf = joblib.load(model_path)
    print("Model loaded successfully.")

    # 2. Load the state layer
    state_layer = pd.read_csv('backend/data/state_layer.csv')
    print(f"Loaded state_layer with {len(state_layer)} states.")

    # 3. Prepare features from state_layer metrics
    # Model 1 features: ['gender', 'education_years', 'is_urban', 'risk_tolerance_preference', 'log_income', 'n_products_aware']
    
    # Constants from survey means
    MEAN_GENDER = 1.35
    MEAN_RISK = 1.80
    MEAN_AWARENESS = 7.98

    val_df = pd.DataFrame()
    val_df['state_name'] = state_layer['state_name']
    
    # Map metrics to model features
    val_df['gender'] = MEAN_GENDER
    val_df['risk_tolerance_preference'] = MEAN_RISK
    val_df['n_products_aware'] = MEAN_AWARENESS
    
    # is_urban (percentage)
    val_df['is_urban'] = state_layer['urban_population'] / state_layer['total_population']
    
    # log_income (using per_capita_income_2011)
    val_df['log_income'] = np.log1p(state_layer['per_capita_income_2011'])
    
    # education_years (estimated from literacy and graduate rates)
    # Literate but not graduate ~ 9 years (Secondary)
    # Graduate ~ 16 years
    pop = state_layer['total_population']
    grad_rate = state_layer['graduate_above_2011'] / pop
    lit_rate = state_layer['literate_persons_2011'] / pop
    
    val_df['education_years'] = (grad_rate * 16) + ((lit_rate - grad_rate) * 9) + ((1 - lit_rate) * 0)
    
    feature_cols = ['gender', 'education_years', 'is_urban', 'risk_tolerance_preference', 'log_income', 'n_products_aware']
    
    # 4. Run Model Prediction
    # The model predicts the probability of a "typical" person in that state being an investor
    val_df['pred_prob'] = clf.predict_proba(val_df[feature_cols])[:, 1]
    
    # 5. Compare with actual investor rate in state_layer
    val_df['actual_market_rate'] = state_layer['investors_last_year'] / state_layer['total_population']
    
    # 6. Evaluation
    # Scale predictions to the same mean as actual for relative error calculation
    actual_mean = val_df['actual_market_rate'].mean()
    pred_mean = val_df['pred_prob'].mean()
    val_df['pred_scaled'] = val_df['pred_prob'] * (actual_mean / pred_mean)
    
    val_df['abs_error_scaled'] = abs(val_df['pred_scaled'] - val_df['actual_market_rate'])
    # Improved Accuracy score: 100 * exp(-relative_error)
    # This avoids 0% for large errors and gives a smoother "quality" score
    val_df['prediction_accuracy'] = np.exp(-(val_df['abs_error_scaled'] / val_df['actual_market_rate'])) * 100
    
    # 7. Generate qualitative insights
    def get_reason(row):
        ratio = row['pred_scaled'] / row['actual_market_rate']
        if ratio > 1.2:
            return "Demographics suggest higher participation potential than observed."
        elif ratio < 0.8:
            return "Market enthusiasm significantly exceeds demographic baseline."
        else:
            return "Participation aligns well with state demographic profile."
            
    val_df['model_insight'] = val_df.apply(get_reason, axis=1)
    
    # Sort by error for the printout
    val_df = val_df.sort_values('abs_error_scaled', ascending=True)
    
    print("\n--- Model Validation: State Aggregates Only (Sorted by Accuracy) ---")
    print(val_df[['state_name', 'pred_scaled', 'actual_market_rate', 'prediction_accuracy', 'model_insight']].head(10))
    
    mae = val_df['abs_error_scaled'].mean()
    correlation = val_df['pred_prob'].corr(val_df['actual_market_rate'])
    
    print(f"\nMean Absolute Error (Scaled Rate): {mae:.4f}")
    print(f"Correlation (Pred vs Actual): {correlation:.4f}")

    # 8. Merge back to state_layer and save
    # Drop existing validation columns if they exist to avoid duplicates (_x, _y)
    cols_to_drop = ['predicted_investor_rate', 'prediction_accuracy', 'model_insight']
    state_layer_clean = state_layer.drop(columns=[c for c in cols_to_drop if c in state_layer.columns])
    
    final_state_layer = pd.merge(state_layer_clean, val_df[['state_name', 'pred_scaled', 'prediction_accuracy', 'model_insight']], on='state_name')
    
    # Rename pred_scaled for clarity in frontend
    final_state_layer.rename(columns={'pred_scaled': 'predicted_investor_rate'}, inplace=True)
    
    final_state_layer.to_csv("backend/data/state_layer.csv", index=False)
    print("\nUpdated backend/data/state_layer.csv with validation metrics.")

    # 9. Visualization
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
        
        # Create a vertical subplot figure
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 20))
        
        # Plot 1: Regression (Cleaned up)
        sns.regplot(data=val_df, x='actual_market_rate', y='pred_scaled', 
                    scatter_kws={'alpha':0.5, 's':50}, line_kws={'color':'#d4943a', 'ls':'--'}, ax=ax1)
        
        # Avoid label overlapping with basic heuristic
        for i, row in val_df.iterrows():
            ax1.text(row['actual_market_rate'] + 0.0005, row['pred_scaled'], row['state_name'], 
                     fontsize=9, alpha=0.8)
            
        ax1.set_title("A. Demographic Potential vs. Actual Market Rate", fontsize=14, fontweight='bold')
        ax1.set_xlabel("Actual Participation Rate (Registry Data)", fontsize=12)
        ax1.set_ylabel("Predicted Participation Rate (Demographic Model)", fontsize=12)
        ax1.grid(True, alpha=0.2)

        # Plot 2: Participation Gap (Under-penetrated states)
        val_df['participation_gap'] = val_df['pred_scaled'] - val_df['actual_market_rate']
        gap_df = val_df.sort_values('participation_gap', ascending=False)
        
        # Color code: Red for under-penetrated (high positive gap), Blue for over-performing
        colors = ['#f43f5e' if x > 0 else '#60a5fa' for x in gap_df['participation_gap']]
        
        sns.barplot(data=gap_df, x='participation_gap', y='state_name', palette=colors, ax=ax2)
        ax2.set_title("B. Participation Gap (Demographic Potential - Actual)", fontsize=14, fontweight='bold')
        ax2.set_xlabel("Gap (Positive = Under-penetrated / Opportunity)", fontsize=12)
        ax2.set_ylabel("")
        ax2.axvline(0, color='black', lw=1, alpha=0.5)
        ax2.grid(True, axis='x', alpha=0.2)

        plt.tight_layout()
        os.makedirs("figures", exist_ok=True)
        plt.savefig("figures/model_validation_gap_analysis.pdf")
        plt.savefig("figures/model_validation_gap_analysis.png", dpi=300) # PNG for easy viewing if needed
        print("Improved plots saved to figures/model_validation_gap_analysis.pdf/png")
    except Exception as e:
        print(f"\nCould not generate plot: {e}")

    # Save validation results summary (with gap)
    val_df.to_csv("report/data/model_validation_state_only.csv", index=False)
    print("Validation summary saved to report/data/model_validation_state_only.csv")

if __name__ == "__main__":
    main()
