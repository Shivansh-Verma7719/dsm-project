import os
import pandas as pd
import numpy as np
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import Tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from dotenv import load_dotenv
import config

# Load environment variables from backend/.env or .env
load_dotenv(os.path.join(config.BASE_DIR, ".env"))
load_dotenv(os.path.join(os.path.dirname(config.BASE_DIR), ".env"))

db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("DATABASE_URL not found in environment variables")
db = SQLDatabase.from_uri(db_url)

# Tool 1: Lead Scorer
def lead_scorer_func(input_str: str) -> str:
    """
    Scores a lead profile. Input should be a comma-separated string: 
    income, education_years, is_urban, gender, risk_tolerance, awareness
    Example: 50000, 15, 1, 1, 3, 10
    """
    try:
        import re
        def clean_val(s):
            s = s.strip().lower()
            # Handle key=value like 'income=80000'
            if "=" in s:
                s = s.split("=")[-1].strip()
            if s == "true": return 1.0
            if s == "false": return 0.0
            # Extract just the numbers
            match = re.search(r"[-+]?\d*\.?\d+", s)
            if match:
                return float(match.group())
            return 0.0

        parts = [clean_val(x) for x in input_str.split(",")]
        # Pad with 0s if fewer than 6 parts provided
        while len(parts) < 6:
            parts.append(0.0)
            
        income, edu, urban, gender, risk, aware = parts[:6]
        
        log_income = np.log1p(income)
        features_m1 = pd.DataFrame([{
            'gender': gender,
            'education_years': edu,
            'is_urban': urban,
            'risk_tolerance_preference': risk,
            'log_income': log_income,
            'n_products_aware': aware
        }])
        
        prob = config.clf_participation.predict_proba(features_m1)[0, 1]
        return f"Participation Probability: {prob:.4f}. A score above 0.5 indicates a high-potential lead."
    except Exception as e:
        return f"Error scoring lead: {str(e)}"

# Tool 2: Geographic Analyst
def geo_analyst_func(state_query: str) -> str:
    """
    Analyzes state-level metrics. Input is the state name.
    """
    try:
        csv_path = os.path.join(config.DATA_DIR, 'state_layer.csv')
        df = pd.read_csv(csv_path)
        state_data = df[df['state_name'].str.lower() == state_query.lower()]
        if state_data.empty:
            return f"No data found for state: {state_query}"
        
        row = state_data.iloc[0]
        return (f"State: {row['state_name']}\n"
                f"Actual Penetration: {row['investors_per_lakh']} per lakh\n"
                f"Predicted Potential: {row['predicted_investor_rate']:.4f}\n"
                f"Model Accuracy: {row['prediction_accuracy']:.1f}%\n"
                f"Insight: {row['model_insight']}")
    except Exception as e:
        return f"Error analyzing state: {str(e)}"

# Tool 3: Pitch Optimizer
def pitch_optimizer_func(input_str: str) -> str:
    """
    Optimizes a sales pitch by testing 'What-If' scenarios. 
    Input: 'income, education_years, is_urban, gender, risk_tolerance, awareness'
    """
    try:
        import re
        def clean_val(s):
            s = s.strip().lower()
            if "=" in s:
                s = s.split("=")[-1].strip()
            if s == "true": return 1.0
            if s == "false": return 0.0
            match = re.search(r"[-+]?\d*\.?\d+", s)
            if match:
                return float(match.group())
            return 0.0

        parts = [clean_val(x) for x in input_str.split(",")]
        while len(parts) < 6:
            parts.append(0.0)
            
        income, edu, urban, gender, risk, aware = parts[:6]
        
        # Baseline
        log_income = np.log1p(income)
        base_feat = pd.DataFrame([{'gender': gender, 'education_years': edu, 'is_urban': urban, 'risk_tolerance_preference': risk, 'log_income': log_income, 'n_products_aware': aware}])
        base_prob = config.clf_participation.predict_proba(base_feat)[0, 1]
        
        # Scenario: Increase Awareness by 5
        plus_aware = min(18, aware + 5)
        aware_feat = pd.DataFrame([{'gender': gender, 'education_years': edu, 'is_urban': urban, 'risk_tolerance_preference': risk, 'log_income': log_income, 'n_products_aware': plus_aware}])
        aware_prob = config.clf_participation.predict_proba(aware_feat)[0, 1]
        
        # Scenario: Risk Calibration (increase risk tolerance)
        plus_risk = min(3, risk + 1)
        risk_feat = pd.DataFrame([{'gender': gender, 'education_years': edu, 'is_urban': urban, 'risk_tolerance_preference': plus_risk, 'log_income': log_income, 'n_products_aware': aware}])
        risk_prob = config.clf_participation.predict_proba(risk_feat)[0, 1]
        
        res = (f"Baseline Probability: {base_prob:.4f}\n"
               f"Strategy A (Awareness +5): {aware_prob:.4f} (Delta: {aware_prob - base_prob:+.4f})\n"
               f"Strategy B (Risk Profile +1): {risk_prob:.4f} (Delta: {risk_prob - base_prob:+.4f})\n")
        
        if aware_prob > risk_prob:
            res += "Recommendation: Focus on Product Education (Awareness)."
        else:
            res += "Recommendation: Focus on Risk Calibration/Tolerance building."
        return res
    except Exception as e:
        return f"Error optimizing pitch: {str(e)}"

# Define Tools
def get_tools(llm):
    sql_toolkit = SQLDatabaseToolkit(db=db, llm=llm)
    sql_tools = sql_toolkit.get_tools()
    
    custom_tools = [
        Tool(
            name="LeadScorer",
            func=lead_scorer_func,
            description="Calculate the market participation probability for a specific lead profile. Input: 'income, education_years, is_urban, gender, risk_tolerance, awareness'"
        ),
        Tool(
            name="GeographicAnalyst",
            func=geo_analyst_func,
            description="Query demographic and market penetration data for a specific Indian state. Input: 'State Name'"
        ),
        Tool(
            name="PitchOptimizer",
            func=pitch_optimizer_func,
            description="Simulate 'What-If' scenarios to see how changing awareness or risk tolerance affects participation probability. Input: 'income, education_years, is_urban, gender, risk_tolerance, awareness'"
        )
    ]
    return custom_tools + sql_tools

# Agent Initialization
def get_agent_executor():
    model_name = os.getenv("GEMINI_CHAT_MODEL", "gemini-1.5-flash")
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("CRITICAL: GOOGLE_API_KEY is missing in environment.")
        raise ValueError("GOOGLE_API_KEY is required. Please check your .env file in the backend directory.")
    
    llm = ChatGoogleGenerativeAI(model=model_name, temperature=0, google_api_key=api_key)
    all_tools = get_tools(llm)
    
    system_prompt = (
        "You are the 'DSM Stockbroker Sales Helper', a high-end research assistant for financial institutions. "
        "Your goal is to help brokers prioritize leads and refine sales pitches using data-driven insights. "
        "You have access to the respondent microdata via SQL. Always query the database to find real-world examples or aggregates. "
        "When scoring leads, use PitchOptimizer to suggest specific ways to improve their probability. "
        "If asked about state-level strategy, use GeographicAnalyst. "
        "Be professional, precise, and research-oriented. Use tables to present data when possible."
    )
    
    # LangGraph create_react_agent handles tool calling and state management
    return create_react_agent(llm, tools=all_tools, prompt=system_prompt)
