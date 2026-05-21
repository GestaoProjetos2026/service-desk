from fastapi import APIRouter, Depends

from app.config.database import get_session
from app.modules.knowledge_base.controller import KnowledgeBaseController
from app.modules.knowledge_base.schema import KnowledgeBaseListResponse


router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])


def get_controller(session=Depends(get_session)) -> KnowledgeBaseController:
	return KnowledgeBaseController(session)


@router.get("", response_model=KnowledgeBaseListResponse)
def list_knowledge_base(
	skip: int = 0, limit: int = 50, controller: KnowledgeBaseController = Depends(get_controller)
):
	return controller.list_all(skip=skip, limit=limit)
