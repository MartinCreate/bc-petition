const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//////-----------------------------------MIDDLEWARE----------------------------------------------------------------------//
app.use(express.static("./public"));

//lets us read req.body properly//
app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(
    cookieSession({
        maxAge: 1000 * 60 * 60 * 24 * 14, //makes cookie expire after 2 weeks of 'inactivity' (i.e. the time since the last interaction with the server)
        secret: `I'm always angry.`,
    })
);

//Protect against CSRF and iframe Sabotage//
app.use(csurf());
app.use((req, res, next) => {
    res.set("X-Frame-Options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
});

//Redirect to Petition form, if no cookie
app.use((req, res, next) => {
    if (req.url != "/petition" && !req.session.hasSubmittedData) {
        res.redirect("/petition");
    } else {
        next();
    }
});

//////-----------------------------------Petition Form----------------------------------------------------------------------//
app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    if (req.session.hasSubmittedData) {
        res.redirect("/petition/thanks");
    } else {
        res.render("petition");
    }
});

app.post("/petition", (req, res) => {
    db.submitData(req.body.firstName, req.body.lastName, req.body.sig)
        .then((response) => {
            console.log("Data has been submitted.");
            req.session.hasSubmittedData = true;
            req.session.signerID = response.rows[0].id;
            res.redirect("/petition/thanks");
        })
        .catch(() => {
            console.log("ERROR in POST /petition");
            res.render("petition", {
                tryAgain: true,
            });
        });
});

//////-----------------------------------Thanks Page----------------------------------------------------------------------//
app.get("/petition/thanks", (req, res) => {
    let numberOfSigners;

    db.getData(`SELECT COUNT (*) FROM signatures`).then((response) => {
        const rows = response.rows;
        numberOfSigners = rows[0].count;
    });

    db.getData(
        `SELECT signature FROM signatures WHERE id = ${req.session.signerID}`
    ).then(({ rows }) => {
        res.render("thanks", {
            sigUrl: rows[0].signature,
            numbSigners: numberOfSigners,
        });
    });
});

//////-----------------------------------Signers Page----------------------------------------------------------------------//
app.get("/petition/signers", (req, res) => {
    db.getData(`SELECT first, last FROM signatures`).then(({ rows }) => {
        let namesArr = [];
        for (let i = 0; i < rows.length; i++) {
            let fullName = rows[i].first + " " + rows[i].last;
            namesArr.push(fullName);
        }

        res.render("signers", {
            signerNames: namesArr,
        });
    });
});

// //////-----------------------------------Checking Signatures Table Data (comment this out / delete this before final submission)----------------------------------------------------------------------//

// app.get("/table-data", (req, res) => {
//     db.tableData()
//         .then(({ rows }) => {
//             let idArr = [];
//             let firstArr = [];
//             let lastArr = [];
//             let signatureArr = [];
//             let timeStampArr = [];

//             for (let i = 0; i < rows.length; i++) {
//                 idArr.push(rows[i].id);
//                 firstArr.push(rows[i].first);
//                 lastArr.push(rows[i].last);
//                 signatureArr.push(rows[i].signature);
//                 timeStampArr.push(rows[i].ts);
//             }

//             res.render("tabledata", {
//                 id: idArr,
//                 first: firstArr,
//                 last: lastArr,
//                 signature: signatureArr,
//                 ts: timeStampArr,
//             });
//         })
//         .catch((err) => {
//             console.log("ERROR in tableNoSig: ", err);
//         });
// });

//////-----------------------------------Server Channel----------------------------------------------------------------------//

app.listen(8080, () => console.log("petition server is listening..."));

//////-----------------------------------FYIs----------------------------------------------------------------------//
// //this
// db.getData(`SELECT COUNT (*) FROM signatures`).then((response) => {
//     numberOfSigners = response.rows[0].count;
// });

// // is the same as this
// db.getData(`SELECT COUNT (*) FROM signatures`).then(({ whatever }) => {
//     numberOfSigners = whatever[0].count;
// });
