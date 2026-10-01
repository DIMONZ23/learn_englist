-- Chạy file này bằng tài khoản quản trị postgres.
-- Tạo role/database phát triển theo đúng DATABASE_URL trong .env.example.
\set ON_ERROR_STOP on

SELECT 'CREATE ROLE lingoflow LOGIN PASSWORD ''lingoflow_dev'''
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lingoflow') \gexec

ALTER ROLE lingoflow WITH LOGIN PASSWORD 'lingoflow_dev';

SELECT 'CREATE DATABASE lingoflow OWNER lingoflow'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'lingoflow') \gexec

GRANT ALL PRIVILEGES ON DATABASE lingoflow TO lingoflow;
