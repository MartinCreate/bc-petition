const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.submitData = (first, last, signature) => {
    return db.query(
        `
    INSERT INTO signatures (first, last, signature)
    VALUES ($1, $2, $3) 
    RETURNING id`,
        [first, last, signature]
    );
};

module.exports.getData = (querySQL) => {
    return db.query(querySQL);
};

//////-----------------------------------Checking Table Data (comment this out before pushing)----------------------------------------------------------------------//
module.exports.tableData = () => {
    return db.query(`SELECT * FROM signatures`);
};
