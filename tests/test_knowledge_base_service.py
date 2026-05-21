import pytest
from unittest.mock import MagicMock
from app.modules.knowledge_base.service import KnowledgeBaseService

def test_knowledge_base_service_list_all():
    mock_session = MagicMock()
    service = KnowledgeBaseService(mock_session)
    
    # Mock repository
    service._repo = MagicMock()
    service._repo.get_all.return_value = (1, [{"ticket_id": "123"}])
    
    total, result = service.list_all(skip=5, limit=10)
    
    service._repo.get_all.assert_called_once_with(skip=5, limit=10)
    assert total == 1
    assert result == [{"ticket_id": "123"}]
