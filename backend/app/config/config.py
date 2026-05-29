from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    app_name: str = "service-desk"
    app_env: str = "development"
    app_debug: bool = False
    api_prefix: str = "/api/v1"

    # Database
    database_url: str

    # Integração: Core Engine
    core_engine_url: str

    # Integração: Fiscal Finance
    fiscal_finance_url: str
    fisc_api_key: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
