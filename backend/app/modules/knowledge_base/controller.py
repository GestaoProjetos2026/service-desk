from app.modules.knowledge_base.service import KnowledgeBaseService


class KnowledgeBaseController:
    def __init__(self, session) -> None:
        self.service = KnowledgeBaseService(session)

    def list_all(self, skip: int = 0, limit: int = 50):
        total, items = self.service.list_all(skip=skip, limit=limit)
        return {"total": total, "items": items}
