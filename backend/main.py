import os
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DSM Dashboard API", description="Serves predictive models and state analytics")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
MODELS_DIR = os.path.join(BASE_DIR, 'models')
REPORT_DIR = os.path.join(ROOT_DIR, 'report', 'data')
DATA_DIR = os.path.join(ROOT_DIR, 'data')

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
    monthly_income_rs: float
    education_years: float
    is_urban: float
    gender: float
    risk_tolerance_preference: float
    stock_market_familiarity: float = 0.0
    actual_knowledge_score: float = 0.0
    info_social_media: float = 0.0
    info_professionals: float = 0.0

@app.post("/predict")
def predict(data: PredictionInput):
    log_income = np.log1p(data.monthly_income_rs)
    features_m1 = pd.DataFrame([{
        'gender': data.gender,
        'education_years': data.education_years,
        'is_urban': data.is_urban,
        'risk_tolerance_preference': data.risk_tolerance_preference,
        'log_income': log_income
    }])
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
    csv_path = os.path.join(DATA_DIR, 'state_layer.csv')
    if not os.path.exists(csv_path):
        return {"error": "state_layer.csv not found"}
    df = pd.read_csv(csv_path)
    df = df.replace({np.nan: None})
    return df.to_dict(orient="records")

@app.get("/participation-grid")
def get_participation_grid():
    """
    Returns a 10x10 grid of participation probabilities varying
    monthly_income_rs (log-spaced 5k→200k) and education_years (0→20).
    All other features held at sample medians.
    """
    incomes = np.logspace(np.log10(5000), np.log10(200000), 10)
    educations = np.linspace(0, 20, 10)

    grid = []
    for edu in educations:
        row = []
        for inc in incomes:
            features = pd.DataFrame([{
                'gender': 1.0,
                'education_years': float(edu),
                'is_urban': 1.0,
                'risk_tolerance_preference': 2.0,
                'log_income': float(np.log1p(inc))
            }])
            prob = float(clf_participation.predict_proba(features)[0, 1])
            row.append(round(prob, 4))
        grid.append(row)

    return {
        "grid": grid,
        "incomes": [round(float(i)) for i in incomes],
        "educations": [round(float(e), 1) for e in educations]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
