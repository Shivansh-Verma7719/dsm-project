import os
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DSM Dashboard API", description="Serves predictive models and state analytics")

# Add CORS middleware to allow Next.js frontend to interact
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this to the Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models on startup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Global variables for models
clf_participation = None
clf_securities = None
clf_duration = None

@app.on_event("startup")
def load_models():
    global clf_participation, clf_securities, clf_duration
    clf_participation = joblib.load(os.path.join(MODELS_DIR, 'model1_participation.joblib'))
    clf_securities = joblib.load(os.path.join(MODELS_DIR, 'model2_securities.joblib'))
    clf_duration = joblib.load(os.path.join(MODELS_DIR, 'model3_duration.joblib'))
    print("Models loaded successfully.")

class PredictionInput(BaseModel):
    # Demographics
    monthly_income_rs: float
    education_years: float
    is_urban: float
    gender: float
    risk_tolerance_preference: float
    
    # Behavioral
    stock_market_familiarity: float = 0.0
    actual_knowledge_score: float = 0.0
    info_social_media: float = 0.0
    info_professionals: float = 0.0

@app.post("/predict")
def predict(data: PredictionInput):
    # Calculate log_income
    log_income = np.log1p(data.monthly_income_rs)
    
    # Model 1 Features
    features_m1 = pd.DataFrame([{
        'gender': data.gender,
        'education_years': data.education_years,
        'is_urban': data.is_urban,
        'risk_tolerance_preference': data.risk_tolerance_preference,
        'log_income': log_income
    }])
    
    # Model 2/3 Features
    features_m23 = pd.DataFrame([{
        'gender': data.gender,
        'education_years': data.education_years,
        'is_urban': data.is_urban,
        'risk_tolerance_preference': data.risk_tolerance_preference,
        'log_income': log_income,
        'stock_market_familiarity': data.stock_market_familiarity,
        'actual_knowledge_score': data.actual_knowledge_score,
        'info_social_media': data.info_social_media,
        'info_professionals': data.info_professionals
    }])
    
    # Get Probability of positive class (index 1)
    prob_participation = clf_participation.predict_proba(features_m1)[0, 1]
    prob_securities = clf_securities.predict_proba(features_m23)[0, 1]
    prob_duration = clf_duration.predict_proba(features_m23)[0, 1]
    
    return {
        "participation_probability": round(float(prob_participation), 4),
        "securities_probability": round(float(prob_securities), 4),
        "long_term_duration_probability": round(float(prob_duration), 4)
    }

@app.get("/state-metrics")
def get_state_metrics():
    # Load state_layer.csv
    csv_path = os.path.join(os.path.dirname(BASE_DIR), 'data', 'state_layer.csv')
    if not os.path.exists(csv_path):
        return {"error": "state_layer.csv not found"}
        
    df = pd.read_csv(csv_path)
    # Replace NaN with None so it serializes to JSON null
    df = df.replace({np.nan: None})
    return df.to_dict(orient="records")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
