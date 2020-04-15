------Create the Tables one at a time by commenting out all but one table at a time

---------------------------- SIGNATURES table -----------------------------------------------------------------

-- this is what signatures should look like for pt 3 and on..
CREATE TABLE signatures(
      id SERIAL PRIMARY KEY,
      signature TEXT NOT NULL (signature != ''),
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
      -- here we are adding the foreign key (user_id)
      -- foreign key lets us identify which user from the users table signed the petition
      -- and which signature is theirs (acts as an identifier btw the 2 tables!)


-- ---------------------------- USERS table -----------------------------------------------------------------

-- CREATE TABLE users(
--       id SERIAL PRIMARY KEY,
--       first VARCHAR(255) NOT NULL,
--       last VARCHAR(255) NOT NULL,
--       email VARCHAR(255) NOT NULL UNIQUE,
--       password VARCHAR(255) NOT NULL,
--       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
--  );



---------------------------- Reset tables (uncomment only the line below the number) -----------------------------------------------------------------
-- FIRST: uncomment the line below, copy it, and run it in the Terminal after every step below
-- psql -d petition -f tables.sql

-- 1) Delete/DROP signatures table (this one must go first so that 'users' (on which 'signatures' depends) can be deleted)
-- DROP TABLE IF EXISTS signatures;

-- 2) Delete/DROP users table
-- DROP TABLE IF EXISTS users;

-- 3) Create Both tables (uncomment the tables above)




--------------------- Old table (pre-part3)------------------------------
-- CREATE TABLE signatures (
--     id SERIAL PRIMARY KEY,
--     first VARCHAR NOT NULL CHECK (first != '' && first != ' '),
--     last VARCHAR NOT NULL CHECK (last != '' && last != ' '),
--     signature TEXT NOT NULL CHECK (signature != ''),
--     ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );