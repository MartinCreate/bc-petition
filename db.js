const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

////// --------------------------------/registration & /login page------------------------------------------------

module.exports.submitRegistration = (first, last, email, password) => {
    return db.query(
        `
    INSERT INTO users (first, last, email, password)
    VALUES ($1, $2, $3, $4) 
    RETURNING id`,
        [first, last, email, password]
    );
};

module.exports.loginAttempt = (loginEmail) => {
    return db.query(
        `
    SELECT password, id FROM users WHERE email = $1`,
        [loginEmail]
    );
};

////// --------------------------------/petition page------------------------------------------------
// module.exports.sigCheck = (loggedInUserId) => {
//     return db.query(
//         `
//     SELECT id, signature FROM signatures WHERE user_id = $1`,
//         [loggedInUserId]
//     );
// };

module.exports.sigCheck = (userID) => {
    return db.query(
        `
    SELECT EXISTS(SELECT id FROM signatures WHERE user_id = $1)`,
        [userID]
    );
};

module.exports.getSigId = (userID) => {
    return db.query(
        `
    SELECT id FROM signatures WHERE user_id = $1`,
        [userID]
    );
};

module.exports.submitSig = (signature, user_id) => {
    return db.query(
        `
    INSERT INTO signatures (signature, user_id)
    VALUES ($1, $2)`,
        [signature, user_id]
    );
};

// module.exports.submitData = (first, last, signature) => {
//     return db.query(
//         `
//     INSERT INTO signatures (first, last, signature)
//     VALUES ($1, $2, $3)
//     RETURNING id`,
//         [first, last, signature]
//     );
// };

module.exports.getData = (querySQL) => {
    return db.query(querySQL);
};

//////-----------------------------------Checking Table Data (comment this out before pushing)----------------------------------------------------------------------//
module.exports.tableData = () => {
    return db.query(`SELECT * FROM signatures`);
};
