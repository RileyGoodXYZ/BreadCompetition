from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import (
    events,
    health,
    picklists,
    scouting,
    strategies,
    submissions,
    teams,
)

app = FastAPI(title="BreadCompetition API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(scouting.router)
app.include_router(submissions.router)
app.include_router(teams.router)
app.include_router(events.router)
app.include_router(picklists.router)
app.include_router(strategies.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "BreadCompetition API", "docs": "/docs"}
