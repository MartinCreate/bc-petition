const supertest = require("supertest");
const { app } = require("./index");
const cookieSession = require("cookie-session");

/* 1. Users who are logged out are redirected to the registration page
when they attempt to go to the petition page */
