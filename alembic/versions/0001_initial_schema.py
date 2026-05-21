"""Initial schema - tickets and ticket_messages

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-04-24 00:00:00.000000

Substitui as 3 migrations anteriores que causavam conflito de índice duplicado
(ix_ticket_messages_author_id era criado em 0001 e novamente em 4e5b2f3c2a48 e 803f41d85304).
"""

from alembic import op
import sqlalchemy as sa

revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tabela de tickets
    op.create_table(
        'tickets',
        sa.Column('id', sa.CHAR(length=36), primary_key=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'in_process', 'done', 'canceled', name='ticketstatus'), nullable=False, server_default='pending'),
        sa.Column('priority', sa.Enum('low', 'normal', 'high', 'urgent', name='ticketpriority'), nullable=False, server_default='normal'),
        sa.Column('user_id', sa.CHAR(length=36), nullable=True),
        sa.Column('client_id', sa.CHAR(length=36), nullable=True),
        sa.Column('assigned_to', sa.CHAR(length=36), nullable=True),
        sa.Column('updated_by', sa.CHAR(length=36), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
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
        sa.Column('is_internal', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='CASCADE', name='fk_tm_ticket'),
        sa.PrimaryKeyConstraint('id')
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
    sa.Enum(name='ticketstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='ticketpriority').drop(op.get_bind(), checkfirst=True)
