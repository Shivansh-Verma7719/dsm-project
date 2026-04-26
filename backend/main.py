import os
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import config
from routers.analytics import router as analytics_router
from routers.ai.router import router as ai_router
from routers.data.router import router as data_router

app = FastAPI(title="DSM Dashboard API", description="Serves predictive models and state analytics")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def load_models():
    config.clf_participation = joblib.load(os.path.join(config.MODELS_DIR, 'model1_participation.joblib'))
    config.clf_securities = joblib.load(os.path.join(config.MODELS_DIR, 'model2_securities.joblib'))
    config.clf_duration = joblib.load(os.path.join(config.MODELS_DIR, 'model3_duration.joblib'))
    print("Models loaded successfully.")

app.include_router(analytics_router, tags=["analytics"])
app.include_router(ai_router, prefix="/ai", tags=["ai"])
app.include_router(data_router, tags=["data"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
