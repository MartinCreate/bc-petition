------RUN THIS TO RESET TABLES

DROP TABLE IF EXISTS signatures, users;
CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      first VARCHAR(255) NOT NULL CHECK (first != '' AND first != ' '),
      last VARCHAR(255) NOT NULL CHECK (last != '' AND last != ' '),
      email VARCHAR(255) NOT NULL CHECK (email != '' AND email != ' ') UNIQUE,
      password VARCHAR(255) NOT NULL CHECK (password != '' AND password != ' '),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 );
CREATE TABLE signatures(
      id SERIAL PRIMARY KEY,
      signature TEXT NOT NULL CHECK (signature != ''),
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

-- run this line in terminal
-- psql -d petition -f tables.sql



---------------------------- SIGNATURES table -----------------------------------------------------------------

-- this is what signatures should look like for pt 3 and on..

-- DROP TABLE IF EXISTS signatures CASCADE;
-- CREATE TABLE signatures(
--       id SERIAL PRIMARY KEY,
--       signature TEXT NOT NULL CHECK (signature != ''),
--       user_id INTEGER NOT NULL REFERENCES users(id),
--       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
--   );

      -- here we are adding the foreign key (user_id)
      -- foreign key lets us identify which user from the users table signed the petition
      -- and which signature is theirs (acts as an identifier btw the 2 tables!)


-- ---------------------------- USERS table -----------------------------------------------------------------

-- DROP TABLE IF EXISTS users CASCADE;
-- CREATE TABLE users(
--       id SERIAL PRIMARY KEY,
--       first VARCHAR(255) NOT NULL,
--       last VARCHAR(255) NOT NULL,
--       email VARCHAR(255) NOT NULL UNIQUE,
--       password VARCHAR(255) NOT NULL,
--       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
--  );



---------------------------- Reset tables (uncomment only the line below the number) -----------------------------------------------------------------
-- FIRST: uncomment the line below, copy it, then comment it out again. Paste and run it in the Terminal after every step below (don't forget to save this file every time before running it)
-- psql -d petition -f tables.sql

-- 1) uncomment, save, paste line in terminal -> enter, comment-out -- Deletes/DROPs signatures table (this one must go first so that 'users' (on which 'signatures' depends) can be deleted)
-- DROP TABLE IF EXISTS signatures;

-- 2) uncomment, save, paste line in terminal -- Deletes/DROPs users table
-- DROP TABLE IF EXISTS users;

-- 3) uncomment the CREATE TABLEs above, save, paste line in terminal, comment out -- Creates Both tables 




--------------------- Old table (pre-part3)------------------------------
-- CREATE TABLE signatures (
--     id SERIAL PRIMARY KEY,
--     first VARCHAR NOT NULL CHECK (first != '' && first != ' '),
--     last VARCHAR NOT NULL CHECK (last != '' && last != ' '),
--     signature TEXT NOT NULL CHECK (signature != ''),
--     ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );