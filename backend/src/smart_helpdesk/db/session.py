from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from smart_helpdesk.core.config import get_settings

settings = get_settings()

# Centralized SQLAlchemy engine
# pool_pre_ping ensures stale connections are tested and recycled transparently
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

# Centralized session factory for creating transactional database sessions
SessionFactory = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session and ensures cleanup."""
    db = SessionFactory()
    try:
        yield db
    finally:
        db.close()
