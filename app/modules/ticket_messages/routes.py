from fastapi import APIRouter, Depends, status, Query
from uuid import UUID

from app.config.database import get_session
from app.modules.ticket_messages.controller import TicketMessageController
from app.modules.ticket_messages.schema import (
    TicketMessageCreate,
    TicketMessageListResponse,
    TicketMessageResponse,
)


router = APIRouter(prefix="/messages", tags=["Ticket Messages"])


def get_controller(session=Depends(get_session)) -> TicketMessageController:
    return TicketMessageController(session)


@router.get("", response_model=TicketMessageListResponse)
def list_by_ticket(
    ticket_id: UUID = Query(...),
    skip: int = 0,
    limit: int = 50,
    controller: TicketMessageController = Depends(get_controller),
):
    return controller.list_by_ticket(ticket_id, skip=skip, limit=limit)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TicketMessageResponse)
def create_message(data: TicketMessageCreate, controller: TicketMessageController = Depends(get_controller)):
    return controller.create_message(data)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(message_id: UUID, controller: TicketMessageController = Depends(get_controller)):
    controller.delete_message(message_id)
