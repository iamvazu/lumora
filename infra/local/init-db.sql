-- Create extension and databases for local development
CREATE DATABASE lumora_pii;
GRANT ALL PRIVILEGES ON DATABASE lumora_pii TO lumora_user;

\c lumora_app
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c lumora_pii
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
