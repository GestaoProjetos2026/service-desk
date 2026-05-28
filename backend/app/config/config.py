from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    app_name: str = "service-desk"
    app_env: str = "development"
    app_debug: bool = False
    api_prefix: str = "/api/v1"

    # Database
    database_url: str

    # Integração: Fiscal Finance (Squad 2)
    fiscal_finance_url: str = "http://backend-svc.fiscal-finance.svc.cluster.local:5000"
    fisc_api_key: str = "FISC-PUBLIC-2026-SQUAD4"

    # Timeout para chamadas inter-squads (segundos)
    integration_timeout: float = 5.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()