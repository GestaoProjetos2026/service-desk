from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


# ── Response Schemas ───────────────────────────────────────────────────────────

class KnowledgeBaseItem(BaseModel):
    ticket_id: UUID
    title: str
    description: str
    last_message: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeBaseListResponse(BaseModel):
    total: int
    items: list[KnowledgeBaseItem]
