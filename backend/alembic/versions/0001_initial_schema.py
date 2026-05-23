"""Initial schema - tickets and ticket_messages (PostgreSQL)

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-04-24 00:00:00.000000

Migration inicial adaptada para PostgreSQL.
- ENUMs criados/dropados explicitamente (são tipos de primeira classe no Postgres).
- IDs mantidos como CHAR(36) por compatibilidade com a camada de repositório,
  que serializa UUIDs como string.
- Removido ON UPDATE CURRENT_TIMESTAMP (inexistente no Postgres).
  O comportamento é provido pelo ORM via `onupdate=utc_now`.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ENUMs devem existir antes de serem referenciados pelas colunas
    ticket_status = postgresql.ENUM(
        'pending', 'in_process', 'done', 'canceled',
        name='ticketstatus',
    )
    ticket_priority = postgresql.ENUM(
        'low', 'normal', 'high', 'urgent',
        name='ticketpriority',
    )
    ticket_status.create(op.get_bind(), checkfirst=True)
    ticket_priority.create(op.get_bind(), checkfirst=True)

    # Tabela de tickets
    op.create_table(
        'tickets',
        sa.Column('id', sa.CHAR(length=36), primary_key=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column(
            'status',
            postgresql.ENUM(name='ticketstatus', create_type=False),
            nullable=False,
            server_default='pending',
        ),
        sa.Column(
            'priority',
            postgresql.ENUM(name='ticketpriority', create_type=False),
            nullable=False,
            server_default='normal',
        ),
        sa.Column('user_id', sa.CHAR(length=36), nullable=True),
        sa.Column('client_id', sa.CHAR(length=36), nullable=True),
        sa.Column('assigned_to', sa.CHAR(length=36), nullable=True),
        sa.Column('updated_by', sa.CHAR(length=36), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('closed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tickets_user_id', 'tickets', ['user_id'], unique=False)
    op.create_index('ix_tickets_client_id', 'tickets', ['client_id'], unique=False)
    op.create_index('ix_tickets_assigned_to', 'tickets', ['assigned_to'], unique=False)
    op.create_index('ix_tickets_updated_by', 'tickets', ['updated_by'], unique=False)

    # Tabela de mensagens dos tickets
    op.create_table(
        'ticket_messages',
        sa.Column('id', sa.CHAR(length=36), primary_key=True, nullable=False),
        sa.Column('ticket_id', sa.CHAR(length=36), nullable=False),
        sa.Column('author_id', sa.CHAR(length=36), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_internal', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='CASCADE', name='fk_tm_ticket'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ticket_messages_ticket_id', 'ticket_messages', ['ticket_id'], unique=False)
    op.create_index('ix_ticket_messages_author_id', 'ticket_messages', ['author_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_ticket_messages_author_id', table_name='ticket_messages')
    op.drop_index('ix_ticket_messages_ticket_id', table_name='ticket_messages')
    op.drop_table('ticket_messages')
    op.drop_index('ix_tickets_updated_by', table_name='tickets')
    op.drop_index('ix_tickets_client_id', table_name='tickets')
    op.drop_index('ix_tickets_assigned_to', table_name='tickets')
    op.drop_index('ix_tickets_user_id', table_name='tickets')
    op.drop_table('tickets')
    postgresql.ENUM(name='ticketpriority').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='ticketstatus').drop(op.get_bind(), checkfirst=True)
