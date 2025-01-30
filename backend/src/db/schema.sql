-- File: /Users/patrick/Projects/Teralynk/backend/src/db/schema.sql

-- Table to log AI interactions for individual users
CREATE TABLE ai_interactions (
    id SERIAL PRIMARY KEY, -- Unique identifier for each interaction
    user_id VARCHAR(255) NOT NULL, -- Identifier for the user making the request
    platform VARCHAR(255) NOT NULL, -- Name of the AI platform queried
    request_payload JSONB NOT NULL, -- The request data sent to the AI platform
    response_payload JSONB NOT NULL, -- The response data received from the AI platform
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the interaction occurred
    INDEX (user_id) -- Index for faster lookups by user
);

-- Table to store user-specific AI models and learning data
CREATE TABLE user_models (
    user_id VARCHAR(255) PRIMARY KEY, -- User's unique identifier
    model_data JSONB NOT NULL, -- Data representing the user's learning model
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Last update timestamp
);

-- Table to store the platform-wide AI model and aggregated learning data
CREATE TABLE platform_model (
    id SERIAL PRIMARY KEY, -- Unique identifier for the platform model
    model_data JSONB NOT NULL, -- Data representing the platform-wide learning model
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Last update timestamp
);
