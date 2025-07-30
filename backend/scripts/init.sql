-- AI Finance Manager Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Create the application user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ai_finance_user') THEN
        CREATE USER ai_finance_user WITH PASSWORD 'ai_finance_password';
    END IF;
END
$$;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE ai_finance_db TO ai_finance_user;
ALTER USER ai_finance_user CREATEDB;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create a schema for the application (optional, but good practice)
-- CREATE SCHEMA IF NOT EXISTS ai_finance;
-- SET search_path TO ai_finance, public;

-- Database is ready for SQLAlchemy migrations
-- Tables will be created via Alembic migrations