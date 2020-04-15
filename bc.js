const bcrypt = require("bcryptjs");
const { promisify } = require("util");
let { genSalt, hash, compare } = bcrypt;

genSalt = promisify(genSalt); //generates our salt -> a random string
hash = promisify(hash);
compare = promisify(compare); //compare takes two arguments, plain text and a hash compare value (boolean: match/no-match)

module.exports.compare = compare;
module.exports.hash = (plainTxtPw) =>
    genSalt().then((salt) => hash(plainTxtPw, salt));

//////--------------------------EXAMPLE OF FUNCTIONALITIES FROM IN CLASS------------------------------//
genSalt()
    .then((salt) => {
        // console.log(salt);
        return hash("superSafePassword", salt);
    })
    .then((hashedPassword) => {
        // console.log("hased and salted PW: ", hashedPassword);
        //returns properly hashed PW
        return compare("superSafePassword", hashedPassword);
    })
    .then((matchValueOfCompare) => {
        // console.log("matchValueOfCompare: ", matchValueOfCompare);
    });
