DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    first VARCHAR NOT NULL CHECK (first != '' && first != ' '),
    last VARCHAR NOT NULL CHECK (last != '' && last != ' '),
    signature TEXT NOT NULL CHECK (signature != ''),
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);