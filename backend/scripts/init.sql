-- Initial database setup
-- This script runs automatically when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE finance_manager TO postgres;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully!';
END $$;
