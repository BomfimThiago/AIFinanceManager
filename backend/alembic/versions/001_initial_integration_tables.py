"""initial integration tables

Revision ID: 001_initial_integration_tables
Revises: 
Create Date: 2025-07-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_integration_tables'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create integration tables."""
    
    # Create integrations table
    op.create_table('integrations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.Enum('BELVO', 'PLAID', name='integrationprovider'), nullable=False),
        sa.Column('provider_item_id', sa.String(length=255), nullable=True),
        sa.Column('provider_access_token', sa.Text(), nullable=True),
        sa.Column('provider_refresh_token', sa.Text(), nullable=True),
        sa.Column('institution_id', sa.String(length=255), nullable=False),
        sa.Column('institution_name', sa.String(length=100), nullable=False),
        sa.Column('institution_logo_url', sa.String(length=500), nullable=True),
        sa.Column('institution_website', sa.String(length=255), nullable=True),
        sa.Column('institution_country', sa.String(length=2), nullable=True),
        sa.Column('connection_name', sa.String(length=100), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'CONNECTING', 'CONNECTED', 'ERROR', 'DISCONNECTED', 'EXPIRED', 'MAINTENANCE', name='integrationstatus'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_code', sa.String(length=50), nullable=True),
        sa.Column('sync_frequency', sa.String(length=20), nullable=False),
        sa.Column('auto_sync_enabled', sa.Boolean(), nullable=False),
        sa.Column('sync_data_types', sa.JSON(), nullable=True),
        sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_successful_sync_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sync_status', sa.String(length=20), nullable=True),
        sa.Column('sync_error_message', sa.Text(), nullable=True),
        sa.Column('accounts_count', sa.Integer(), nullable=False),
        sa.Column('transactions_count', sa.Integer(), nullable=False),
        sa.Column('last_transaction_date', sa.Date(), nullable=True),
        sa.Column('consent_expiry_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('permissions', sa.JSON(), nullable=True),
        sa.Column('webhook_url', sa.String(length=500), nullable=True),
        sa.Column('webhook_secret', sa.String(length=255), nullable=True),
        sa.Column('webhook_enabled', sa.Boolean(), nullable=False),
        sa.Column('primary_currency', sa.Enum('USD', 'EUR', 'BRL', name='currency'), nullable=False),
        sa.Column('timezone', sa.String(length=50), nullable=True),
        sa.Column('provider_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('connected_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('disconnected_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    
    # Create indexes
    op.create_index('integrations_user_id_idx', 'integrations', ['user_id'])
    op.create_index('integrations_provider_idx', 'integrations', ['provider'])
    op.create_index('integrations_status_idx', 'integrations', ['status'])
    op.create_index('integrations_institution_id_idx', 'integrations', ['institution_id'])
    
    # Create connected_accounts table
    op.create_table('connected_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('integration_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider_account_id', sa.String(length=255), nullable=False),
        sa.Column('account_type', sa.String(length=50), nullable=False),
        sa.Column('account_subtype', sa.String(length=50), nullable=True),
        sa.Column('account_name', sa.String(length=100), nullable=False),
        sa.Column('account_number', sa.String(length=50), nullable=True),
        sa.Column('account_mask', sa.String(length=20), nullable=True),
        sa.Column('routing_number', sa.String(length=20), nullable=True),
        sa.Column('current_balance', sa.Float(), nullable=True),
        sa.Column('available_balance', sa.Float(), nullable=True),
        sa.Column('currency', sa.Enum('USD', 'EUR', 'BRL', name='currency'), nullable=False),
        sa.Column('balance_updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_closed', sa.Boolean(), nullable=False),
        sa.Column('verification_status', sa.String(length=20), nullable=True),
        sa.Column('sync_transactions', sa.Boolean(), nullable=False),
        sa.Column('sync_balances', sa.Boolean(), nullable=False),
        sa.Column('last_transaction_sync', sa.DateTime(timezone=True), nullable=True),
        sa.Column('transactions_count', sa.Integer(), nullable=False),
        sa.Column('oldest_transaction_date', sa.Date(), nullable=True),
        sa.Column('newest_transaction_date', sa.Date(), nullable=True),
        sa.Column('provider_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    
    # Create indexes for connected_accounts
    op.create_index('connected_accounts_integration_id_idx', 'connected_accounts', ['integration_id'])
    op.create_index('connected_accounts_user_id_idx', 'connected_accounts', ['user_id'])
    op.create_index('connected_accounts_provider_account_id_idx', 'connected_accounts', ['provider_account_id'])
    op.create_index('connected_accounts_account_type_idx', 'connected_accounts', ['account_type'])
    
    # Create sync_logs table
    op.create_table('sync_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('integration_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=True),
        sa.Column('sync_type', sa.String(length=50), nullable=False),
        sa.Column('data_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('records_processed', sa.Integer(), nullable=False),
        sa.Column('records_created', sa.Integer(), nullable=False),
        sa.Column('records_updated', sa.Integer(), nullable=False),
        sa.Column('records_failed', sa.Integer(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_code', sa.String(length=50), nullable=True),
        sa.Column('provider_error', sa.JSON(), nullable=True),
        sa.Column('request_id', sa.String(length=100), nullable=True),
        sa.Column('cursor', sa.String(length=255), nullable=True),
        sa.Column('date_range_start', sa.Date(), nullable=True),
        sa.Column('date_range_end', sa.Date(), nullable=True),
        sa.Column('api_calls_made', sa.Integer(), nullable=False),
        sa.Column('data_size_kb', sa.Float(), nullable=True),
        sa.Column('rate_limited', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    
    # Create indexes for sync_logs
    op.create_index('sync_logs_integration_id_idx', 'sync_logs', ['integration_id'])
    op.create_index('sync_logs_user_id_idx', 'sync_logs', ['user_id'])
    op.create_index('sync_logs_account_id_idx', 'sync_logs', ['account_id'])
    op.create_index('sync_logs_sync_type_idx', 'sync_logs', ['sync_type'])
    op.create_index('sync_logs_data_type_idx', 'sync_logs', ['data_type'])
    op.create_index('sync_logs_status_idx', 'sync_logs', ['status'])


def downgrade() -> None:
    """Drop integration tables."""
    op.drop_table('sync_logs')
    op.drop_table('connected_accounts')
    op.drop_table('integrations')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS integrationprovider")
    op.execute("DROP TYPE IF EXISTS integrationstatus")
    op.execute("DROP TYPE IF EXISTS currency")