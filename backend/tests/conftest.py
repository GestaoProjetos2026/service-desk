import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "3306")
os.environ.setdefault("DB_NAME", "service_desk_test")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")

from app.config.database import Base
from app.config.database import get_session
from app.main import create_app
from app.modules.tickets.model import Ticket
from app.modules.ticket_messages.model import TicketMessage


@pytest.fixture
def engine():
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT")
    db_name = os.getenv("DB_NAME")
    
    database_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    engine = create_engine(database_url)
    Base.metadata.create_all(engine, tables=[Ticket.__table__, TicketMessage.__table__])

    yield engine

    Base.metadata.drop_all(engine, tables=[TicketMessage.__table__, Ticket.__table__])


@pytest.fixture
def session(engine) -> Generator[Session, None, None]:
    TestingSessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

    with TestingSessionLocal() as db_session:
        yield db_session


@pytest.fixture
def client(engine) -> Generator[TestClient, None, None]:
    TestingSessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

    def override_get_session() -> Generator[Session, None, None]:
        with TestingSessionLocal() as db_session:
            yield db_session

    app = create_app()
    app.dependency_overrides[get_session] = override_get_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

