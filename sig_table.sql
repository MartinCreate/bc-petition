DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    first VARCHAR NOT NULL CHECK (first != ''),
    last VARCHAR NOT NULL CHECK (last != ''),
    signature TEXT NOT NULL CHECK (signature != ''),
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);