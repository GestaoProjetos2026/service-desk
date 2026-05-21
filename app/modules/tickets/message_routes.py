from fastapi import APIRouter, Depends, Response, status
from uuid import UUID

from app.config.database import get_session
from app.modules.tickets.message_controller import MessageController
from app.modules.tickets.schema import (
    TicketMessageCreate,
    TicketMessageListResponse,
    TicketMessageResponse,
)


router = APIRouter(prefix="/tickets/{ticket_id}/messages", tags=["Ticket Messages"])


def get_controller(session=Depends(get_session)) -> MessageController:
    return MessageController(session)


@router.get("", response_model=TicketMessageListResponse)
def list_messages(
    ticket_id: UUID,
    skip: int = 0,
    limit: int = 50,
    controller: MessageController = Depends(get_controller),
):
    return controller.list_messages(ticket_id, skip=skip, limit=limit)


@router.get("/{message_id}", response_model=TicketMessageResponse)
def get_message(
    ticket_id: UUID,
    message_id: UUID,
    controller: MessageController = Depends(get_controller),
):
    return controller.get_message(ticket_id, message_id)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TicketMessageResponse)
def create_message(
    ticket_id: UUID,
    data: TicketMessageCreate,
    controller: MessageController = Depends(get_controller),
):
    return controller.create_message(ticket_id, data)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    ticket_id: UUID,
    message_id: UUID,
    controller: MessageController = Depends(get_controller),
):
    controller.delete_message(ticket_id, message_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
