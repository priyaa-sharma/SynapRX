from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_pool, close_pool
from app.routers import drugs, classes, metabolism, history, ask


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="SynapRX API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drugs.router)
app.include_router(classes.router)
app.include_router(metabolism.router)
app.include_router(history.router)
app.include_router(ask.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
