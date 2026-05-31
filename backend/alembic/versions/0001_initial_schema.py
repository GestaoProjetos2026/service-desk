"""Initial schema - tickets and ticket_messages (PostgreSQL)

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-04-24 00:00:00.000000

Migration corrigida para criar o schema service_desk e todas as tabelas
dentro dele, incluindo ENUMs com schema explícito.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

SCHEMA = "service_desk"


def upgrade() -> None:
    # Garante que o schema existe
    op.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA}")
    op.execute(f"SET search_path TO {SCHEMA}, public")

    # ENUMs com schema explícito para não conflitar com public
    ticket_status = postgresql.ENUM(
        'pending', 'in_process', 'done', 'canceled',
        name='ticketstatus',
        schema=SCHEMA,
    )
    ticket_priority = postgresql.ENUM(
        'low', 'normal', 'high', 'urgent',
        name='ticketpriority',
        schema=SCHEMA,
    )
    ticket_status.create(op.get_bind(), checkfirst=True)
    ticket_priority.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'tickets',
        sa.Column('id', sa.CHAR(length=36), primary_key=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column(
            'status',
            postgresql.ENUM(name='ticketstatus', schema=SCHEMA, create_type=False),
            nullable=False,
            server_default='pending',
        ),
        sa.Column(
            'priority',
            postgresql.ENUM(name='ticketpriority', schema=SCHEMA, create_type=False),
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
        schema=SCHEMA,
    )
    op.create_index('ix_tickets_user_id',     'tickets', ['user_id'],     unique=False, schema=SCHEMA)
    op.create_index('ix_tickets_client_id',   'tickets', ['client_id'],   unique=False, schema=SCHEMA)
    op.create_index('ix_tickets_assigned_to', 'tickets', ['assigned_to'], unique=False, schema=SCHEMA)
    op.create_index('ix_tickets_updated_by',  'tickets', ['updated_by'],  unique=False, schema=SCHEMA)

    op.create_table(
        'ticket_messages',
        sa.Column('id', sa.CHAR(length=36), primary_key=True, nullable=False),
        sa.Column('ticket_id', sa.CHAR(length=36), nullable=False),
        sa.Column('author_id', sa.CHAR(length=36), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_internal', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(
            ['ticket_id'], [f'{SCHEMA}.tickets.id'],
            ondelete='CASCADE', name='fk_tm_ticket',
        ),
        sa.PrimaryKeyConstraint('id'),
        schema=SCHEMA,
    )
    op.create_index('ix_ticket_messages_ticket_id', 'ticket_messages', ['ticket_id'], unique=False, schema=SCHEMA)
    op.create_index('ix_ticket_messages_author_id', 'ticket_messages', ['author_id'], unique=False, schema=SCHEMA)


def downgrade() -> None:
    op.execute(f"SET search_path TO {SCHEMA}, public")
    op.drop_index('ix_ticket_messages_author_id', table_name='ticket_messages', schema=SCHEMA)
    op.drop_index('ix_ticket_messages_ticket_id', table_name='ticket_messages', schema=SCHEMA)
    op.drop_table('ticket_messages', schema=SCHEMA)
    op.drop_index('ix_tickets_updated_by',  table_name='tickets', schema=SCHEMA)
    op.drop_index('ix_tickets_client_id',   table_name='tickets', schema=SCHEMA)
    op.drop_index('ix_tickets_assigned_to', table_name='tickets', schema=SCHEMA)
    op.drop_index('ix_tickets_user_id',     table_name='tickets', schema=SCHEMA)
    op.drop_table('tickets', schema=SCHEMA)
    postgresql.ENUM(name='ticketpriority', schema=SCHEMA).drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='ticketstatus',   schema=SCHEMA).drop(op.get_bind(), checkfirst=True)
