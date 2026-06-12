from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DB_PATH: str = "./data/app.db"
    CORS_ORIGINS: str = "http://localhost:5173"
    ENV: str = "dev"
    # The Blue Alliance read key (free: thebluealliance.com/account).
    # Only scripts/seed_demo_data.py needs it; the app runs fine without.
    TBA_API_KEY: str = ""

    @property
    def db_path(self) -> Path:
        p = Path(self.DB_PATH)
        return p if p.is_absolute() else (BACKEND_DIR / p).resolve()

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
