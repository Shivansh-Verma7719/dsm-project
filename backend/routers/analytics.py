import os
import numpy as np
import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel
import config

router = APIRouter()

class PredictionInput(BaseModel):
    monthly_income_rs: float
    education_years: float
    is_urban: float
    gender: float
    risk_tolerance_preference: float
    n_products_aware: float = 10.0
    stock_market_familiarity: float = 0.0
    actual_knowledge_score: float = 0.0
    info_social_media: float = 0.0
    info_professionals: float = 0.0

@router.post("/predict")
def predict(data: PredictionInput):
    log_income = np.log1p(data.monthly_income_rs)
    features_m1 = pd.DataFrame([{
        'gender': data.gender,
        'education_years': data.education_years,
        'is_urban': data.is_urban,
        'risk_tolerance_preference': data.risk_tolerance_preference,
        'log_income': log_income,
        'n_products_aware': data.n_products_aware
    }])
    features_m23 = pd.DataFrame([{
        'gender': data.gender,
        'education_years': data.education_years,
        'is_urban': data.is_urban,
        'risk_tolerance_preference': data.risk_tolerance_preference,
        'log_income': log_income,
        'n_products_aware': data.n_products_aware,
        'stock_market_familiarity': data.stock_market_familiarity,
        'actual_knowledge_score': data.actual_knowledge_score,
        'info_social_media': data.info_social_media,
        'info_professionals': data.info_professionals
    }])
    
    prob_participation = config.clf_participation.predict_proba(features_m1)[0, 1]
    prob_securities = config.clf_securities.predict_proba(features_m23)[0, 1]
    prob_duration = config.clf_duration.predict_proba(features_m23)[0, 1]
    
    return {
        "participation_probability": round(float(prob_participation), 4),
        "securities_probability": round(float(prob_securities), 4),
        "long_term_duration_probability": round(float(prob_duration), 4)
    }

@router.get("/state-metrics")
def get_state_metrics():
    csv_path = os.path.join(config.DATA_DIR, 'state_layer.csv')
    if not os.path.exists(csv_path):
        return {"error": "state_layer.csv not found"}
    df = pd.read_csv(csv_path)
    df = df.replace({np.nan: None})
    return df.to_dict(orient="records")

@router.get("/participation-grid")
def get_participation_grid():
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
                'log_income': float(np.log1p(inc)),
                'n_products_aware': 10.0
            }])
            prob = float(config.clf_participation.predict_proba(features)[0, 1])
            row.append(round(prob, 4))
        grid.append(row)

    return {
        "grid": grid,
        "incomes": [round(float(i)) for i in incomes],
        "educations": [round(float(e), 1) for e in educations]
    }
