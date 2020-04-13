const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");
app.use(require("cookie-parser")());
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// ////------MIDDLEWARE
//lets us read req.body properly//
app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(express.static("./public"));

//Redirect to Petition form, if no cookie
app.use((req, res, next) => {
    if (req.url != "/petition" && !req.cookies.submittedData) {
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
    if (req.cookies.submittedData) {
        res.redirect("/petition/thanks");
    } else {
        res.render("petition");
    }
});

app.post("/petition", (req, res) => {
    db.submitData(req.body.firstName, req.body.lastName, req.body.sig)
        .then(() => {
            console.log("Data has been submitted.");
            res.cookie("submittedData", true);
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
    db.getData(`SELECT COUNT (*) FROM signatures`).then(({ rows }) => {
        res.render("thanks", {
            numbSigners: rows[0].count,
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

// //////-----------------------------------Checking Table Data (comment this out / delete this before final submission)----------------------------------------------------------------------//

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
