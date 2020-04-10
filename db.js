const spicedPg = require("spiced-pg");
//connect to one of our databases using spicedPg
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// create a database called 'petition' and replace geography in the line above with petition

module.exports.submitData = (first, last, signature) => {
    return db.query(
        `
    INSERT INTO signatures (first, last, signature)
    VALUES ($1, $2, $3)`,
        [first, last, signature]
    );
};

module.exports.getData = (querySQL) => {
    //.query performs a query
    return db.query(querySQL);
};

//////-----------------------------------Checking Table Data (comment this out before pushing)----------------------------------------------------------------------//
module.exports.tableData = () => {
    return db.query(`SELECT * FROM signatures`);
};
