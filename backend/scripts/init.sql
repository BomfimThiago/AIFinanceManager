-- Konta Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Create the application user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'konta_user') THEN
        CREATE USER konta_user WITH PASSWORD 'konta_password';
    END IF;
END
$$;

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE konta TO konta_user;
ALTER USER konta_user CREATEDB;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create a schema for the application (optional, but good practice)
-- CREATE SCHEMA IF NOT EXISTS konta;
-- SET search_path TO konta, public;

-- Database is ready for SQLAlchemy migrations
-- Tables will be created via Alembic migrations