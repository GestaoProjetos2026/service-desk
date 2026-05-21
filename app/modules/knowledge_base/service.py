from typing import Tuple

from sqlalchemy.orm import Session

from app.modules.knowledge_base.repository import KnowledgeBaseRepository


class KnowledgeBaseService:
    def __init__(self, session: Session) -> None:
        self._repo = KnowledgeBaseRepository(session)

    def list_all(self, skip: int = 0, limit: int = 50) -> Tuple[int, list[dict]]:
        return self._repo.get_all(skip=skip, limit=limit)
