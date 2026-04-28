-- 1. Profiles Table (From Stage 2, updated for Stage 3)
DROP TABLE IF EXISTS profiles;
CREATE TABLE profiles (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    gender VARCHAR(50),
    gender_probability FLOAT,
    age INT,
    age_group VARCHAR(20),
    country_id VARCHAR(2),
    country_name VARCHAR(255),
    country_probability FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (New for Stage 3 Insighta Labs+)
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY, -- UUID v7
    github_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url VARCHAR(255),
    role VARCHAR(20) DEFAULT 'analyst', -- 'admin' or 'analyst'
    is_active BOOLEAN DEFAULT TRUE, -- If false, 403 Forbidden on all requests
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance on high-traffic auth fields
CREATE INDEX idx_github_id ON users(github_id);