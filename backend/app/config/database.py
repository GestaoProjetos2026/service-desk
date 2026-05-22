from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config.config import settings


class Base(DeclarativeBase):
    pass

engine = create_engine(
    settings.database_url,
    echo=settings.app_debug,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a SQLAlchemy session per request."""
    with SessionLocal() as session:
        yield session
