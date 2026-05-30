from collections.abc import Generator

from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config.config import settings


metadata = MetaData(schema="service_desk")


class Base(DeclarativeBase):
    metadata = metadata


def _get_sqlalchemy_url(url: str) -> str:
    """Garante o driver psycopg2 na URL do SQLAlchemy."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


engine = create_engine(
    _get_sqlalchemy_url(settings.database_url),
    echo=settings.app_debug,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a SQLAlchemy session per request."""
    with SessionLocal() as session:
        yield session
