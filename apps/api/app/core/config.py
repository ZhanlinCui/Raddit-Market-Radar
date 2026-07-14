"""Application settings loaded from environment / .env."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "local"
    log_level: str = "INFO"

    database_url: str = "sqlite+aiosqlite:///./medo_radar.db"

    # Data source
    source_adapter: str = "mock"  # mock | reddit
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "medo-radar/0.1"
    reddit_username: str = ""
    reddit_password: str = ""

    # LLM
    llm_provider: str = "mock"  # mock | openai-compatible
    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model_l1: str = "gpt-4o-mini"
    llm_model_l2: str = "gpt-4o"
    llm_timeout_seconds: int = 30
    llm_max_retries: int = 2

    embedding_provider: str = "mock"
    embedding_model: str = "text-embedding-3-small"

    feishu_webhook_url: str = ""
    slack_webhook_url: str = ""

    scan_new_interval_minutes: int = 10
    search_interval_minutes: int = 60
    backfill_interval_hours: int = 6
    hot_lead_alert_threshold: int = 85
    scheduler_enabled: bool = False

    @property
    def source_is_mock(self) -> bool:
        return self.source_adapter.lower() == "mock" or not self.reddit_client_id

    @property
    def llm_is_mock(self) -> bool:
        return self.llm_provider.lower() == "mock" or not self.llm_api_key


@lru_cache
def get_settings() -> Settings:
    return Settings()
