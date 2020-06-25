const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

////--GET
module.exports.sigCheck = (userID) => {
    return db.query(
        `
    SELECT EXISTS(SELECT id FROM signatures WHERE user_id = $1)`,
        [userID]
    );
};

module.exports.getData = (querySQL) => {
    return db.query(querySQL);
};

////// --------------------------------/register & /login page------------------------------------------------//
////--POST
module.exports.submitRegistration = (first, last, email, password) => {
    return db.query(
        `
    INSERT INTO users (first, last, email, password)
    VALUES ($1, $2, $3, $4) 
    RETURNING id`,
        [first, last, email, password]
    );
};

////--GET
module.exports.loginAttempt = (loginEmail) => {
    return db.query(
        `
    SELECT password, id FROM users WHERE email = $1`,
        [loginEmail]
    );
};

////// --------------------------------/profile page------------------------------------------------//
////--GET
module.exports.userProfileCheck = (userID) => {
    return db.query(
        `
    SELECT EXISTS(SELECT id FROM user_profiles WHERE user_id = $1)`,
        [userID]
    );
};

////--POST
module.exports.submitProfile = (user_id, age, city, user_website) => {
    const checkUrl = (url) => {
        return url.startsWith("http://") || url.startsWith("https://")
            ? url
            : null;
    };

    return db.query(
        `
    INSERT INTO user_profiles (user_id, age, city, url)
    VALUES ($1, $2, $3, $4)`,
        [user_id, age || null, city, checkUrl(user_website)]
    );
};

////// --------------------------------/profile/edit page------------------------------------------------//
////--GET
module.exports.getProfileEditInfo = (user_id) => {
    return db.query(
        `
    SELECT users.id AS user_id, first, last, email, age, city, url
    FROM users
    LEFT JOIN user_profiles
    ON users.id = user_id
    WHERE user_id = $1`,
        [user_id]
    );
};

////--POST
module.exports.updateUsers = (user_id, first, last, email, password) => {
    if (password) {
        return db.query(
            `
    UPDATE users SET first = $2, last = $3, email = $4, password = $5
    WHERE id = $1`,
            [user_id, first, last, email, password]
        );
    } else {
        return db.query(
            `
    UPDATE users SET first = $2, last = $3, email = $4
    WHERE id = $1`,
            [user_id, first, last, email]
        );
    }
};

////--UPSERT
module.exports.updateUserProfiles = (user_id, age, city, url) => {
    const checkUrl = (url) => {
        return url.startsWith("http://") || url.startsWith("https://")
            ? url
            : null;
    };

    return db.query(
        `
            INSERT INTO user_profiles (user_id, age, city, url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) DO UPDATE SET age = $2, city = $3, url = $4`,
        [user_id, age || null, city, checkUrl(url)]
    );
};

////// --------------------------------/petition page------------------------------------------------//
////--POST
module.exports.submitSig = (signature, user_id) => {
    return db.query(
        `
    INSERT INTO signatures (signature, user_id)
    VALUES ($1, $2)`,
        [signature, user_id]
    );
};

////// --------------------------------/sig-delete ------------------------------------------------//
////--POST
module.exports.deleteSig = (user_id) => {
    return db.query(`DELETE FROM signatures WHERE user_id = $1`, [user_id]);
};

////// --------------------------------/signers page------------------------------------------------//
////--GET
module.exports.getFullSigners = () => {
    return db.query(`
    SELECT users.id AS user_id, first, last, age, city, url
    FROM signatures
    JOIN users
    ON signatures.user_id = users.id
    LEFT OUTER JOIN user_profiles
    ON users.id = user_profiles.user_id`);
};

module.exports.getSignerCity = (city) => {
    return db.query(
        `
    SELECT users.id AS user_id, first, last, age, city, url
    FROM signatures
    JOIN users
    ON signatures.user_id = users.id
    LEFT OUTER JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE LOWER(city)=LOWER($1)`,
        [city]
    );
};

////// --------------------------------/delete page------------------------------------------------//
////--POST
module.exports.deleteSignaturesRow = (user_id) => {
    return db.query(`DELETE FROM signatures WHERE user_id = $1`, [user_id]);
};

module.exports.deleteUserProfilesRow = (user_id) => {
    return db.query(`DELETE FROM user_profiles WHERE user_id = $1`, [user_id]);
};

module.exports.deleteUsersRow = (user_id) => {
    return db.query(`DELETE FROM users WHERE id = $1`, [user_id]);
};
