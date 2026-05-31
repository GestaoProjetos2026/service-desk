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
    core_engine_url: str = "http://api.core-engine.40.82.176.176.nip.io"

    # Integração: Fiscal Finance (Squad 2)
    fiscal_finance_url: str
    fisc_api_key: str

    # Timeout para chamadas inter-squads (segundos)
    integration_timeout: float = 5.0

    # CORS — origens permitidas separadas por vírgula (ex.: "http://localhost:5173,http://localhost:3000")
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()