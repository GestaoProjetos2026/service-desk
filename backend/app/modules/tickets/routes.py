from fastapi import APIRouter, Depends, status
from uuid import UUID

from app.config.database import get_session
from app.modules.tickets.controller import TicketController
from app.modules.tickets.schema import (
	TicketCreate,
	TicketListResponse,
	TicketResponse,
	TicketUpdate,
)


router = APIRouter(prefix="/tickets", tags=["Tickets"])


def get_controller(session=Depends(get_session)) -> TicketController:
	return TicketController(session)


@router.get("", response_model=TicketListResponse)
def list_tickets(
	skip: int = 0, limit: int = 50, controller: TicketController = Depends(get_controller)
):
	return controller.list_tickets(skip=skip, limit=limit)


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: UUID, controller: TicketController = Depends(get_controller)):
	return controller.get_ticket(ticket_id)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TicketResponse)
def create_ticket(data: TicketCreate, controller: TicketController = Depends(get_controller)):
	return controller.create_ticket(data)


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
	ticket_id: UUID, data: TicketUpdate, controller: TicketController = Depends(get_controller)
):
	return controller.update_ticket(ticket_id, data)
