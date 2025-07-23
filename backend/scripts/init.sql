-- AI Finance Manager Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

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