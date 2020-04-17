const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

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

////// --------------------------------/profile page------------------------------------------------

module.exports.submitProfile = (user_id, age, city, user_website) => {
    if (
        user_website.startsWith("http://") ||
        user_website.startsWith("https://")
    ) {
        return db.query(
            `
    INSERT INTO user_profiles (user_id, age, city, url)
    VALUES ($1, $2, $3, $4)`,
            [user_id, age, city, user_website]
        );
    } else {
        // throw Error;
        return db.query(
            `
    INSERT INTO user_profiles (user_id, age, city)
    VALUES ($1, $2, $3)`,
            [user_id, age, city]
        );
    }
};

////// --------------------------------/profile/edit page------------------------------------------------
//GET
module.exports.getProfileEditInfo = (user_id) => {
    return db.query(
        `
    SELECT users.id AS user_id, first, last, email, age, city, url
    FROM users
    FULL OUTER JOIN user_profiles
    ON users.id = user_id
    WHERE user_id = $1`,
        [user_id]
    );
};

//POST
module.exports.updateUsers = (user_id, first, last, password) => {
    if (password) {
        return db.query(
            `
    UPDATE users SET first = $2, last = $3, password = $4
    WHERE id = $1`,
            [user_id, first, last, password]
        );
    } else {
        return db.query(
            `
    UPDATE users SET first = $2, last = $3
    WHERE id = $1`,
            [user_id, first, last]
        );
    }
};

// ////-------UPSERT NOT WORKING
module.exports.updateUserProfiles = (user_id, age, city, url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return db.query(
            `
            INSERT INTO user_profiles (user_id, age, city, url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) DO UPDATE SET age = $2, city = $3, url = $4`,
            [user_id, age, city, url]
        );
    } else {
        // throw Error;
        return db.query(
            `INSERT INTO user_profiles (user_id, age,city) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET age = $2, city = $3`,
            [user_id, age, city]
        );
    }
};

// ////-------UPSERT NOT WORKING. DO THIS INSTEAD UNTIL I GET IT FIXED
// ////----------------REPLACE CODE BELOW WITH UPSERT-----------------//

// module.exports.userProfRowCheck = (userID) => {
//     return db.query(
//         `
//     SELECT EXISTS(SELECT user_id FROM user_profiles WHERE user_id = $1)`,
//         [userID]
//     );
// };

// module.exports.updateUserProfs = (user_id, age, city, url) => {
//     if (url.startsWith("http://") || url.startsWith("https://")) {
//         return db.query(
//             `
//     UPDATE user_profiles SET age = $2, city = $3, url = $4
//     WHERE user_id = $1`,
//             [user_id, age, city, url]
//         );
//     } else {
//         return db.query(
//             `
//     UPDATE user_profiles SET age = $2, city = $3
//     WHERE user_id = $1`,
//             [user_id, age, city]
//         );
//     }
// };

// module.exports.insertUserProfs = (user_id, age, city, url) => {
//     if (url.startsWith("http://") || url.startsWith("https://")) {
//         return db.query(
//             `
//     INSERT INTO user_profiles (user_id, age, city, url)
//     VALUES ($1, $2, $3, $4)`,
//             [user_id, age, city, url]
//         );
//     } else {
//         // throw Error;
//         return db.query(
//             `
//     INSERT INTO user_profiles (user_id, age, city)
//     VALUES ($1, $2, $3)`,
//             [user_id, age, city]
//         );
//     }
// };
// ////----------------REPLACE CODE ABOVE WITH UPSERT-----------------//

////// --------------------------------/petition page------------------------------------------------
//GET
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

//POST
module.exports.submitSig = (signature, user_id) => {
    return db.query(
        `
    INSERT INTO signatures (signature, user_id)
    VALUES ($1, $2)`,
        [signature, user_id]
    );
};

module.exports.getData = (querySQL) => {
    return db.query(querySQL);
};

////// --------------------------------/signers page------------------------------------------------
module.exports.getFullSigners = () => {
    return db.query(`
    SELECT users.id AS user_id, first, last, age, city, url
    FROM signatures
    FULL OUTER JOIN users
    ON signatures.user_id = users.id
    FULL OUTER JOIN user_profiles
    ON users.id = user_profiles.user_id`);
};

module.exports.getSignerCity = (city) => {
    return db.query(
        `
    SELECT users.id AS user_id, first, last, age, city, url
    FROM signatures
    FULL OUTER JOIN users
    ON signatures.user_id = users.id
    FULL OUTER JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE LOWER(city)=LOWER($1)`,
        [city]
    );
};

//////-----------------------------------Checking Table Data (comment this out before pushing)----------------------------------------------------------------------//
// module.exports.tableData = () => {
//     return db.query(`SELECT * FROM signatures`);
// };
