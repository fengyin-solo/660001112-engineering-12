from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.channel_config import get_channel_config
from .core.config import CORS_ORIGINS
from .api.eeg import router as eeg_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 在服务开始接收请求前阻断非法共享通道配置。
    get_channel_config()
    yield


app = FastAPI(title="EEG Visualizer API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])
app.include_router(eeg_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "EEG Visualizer"}
