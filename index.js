const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");
const { hash, compare } = require("./bc");
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

// //Redirect to Petition form, if no cookie
// app.use((req, res, next) => {
//     if (req.url != "/petition" && !req.session.hasSubmittedData) {
//         res.redirect("/petition");
//     } else {
//         next();
//     }
// });
//////-----------------------------------/register & /login Pages----------------------------------------------------------------------//

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const bod = req.body;

    hash(bod.password).then((hashedP) => {
        db.submitRegistration(bod.firstName, bod.lastName, bod.email, hashedP)
            .then(({ rows }) => {
                console.log("Registration-data has been submitted.");
                // req.session.hasRegistered = true;
                req.session.userID = rows[0].id;
                console.log("rows[0].id in submitRegistratrion: ", rows[0].id);

                // req.session.loggedInUserId = rows[0].id;
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("ERROR in POST /register, submitReg", err);
                res.render("register", {
                    tryAgain: true,
                });
            });
    });

    // .catch((err) => console.log("ERROR in POST register hash: ", err));
    // res.sendStatus(200);
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    db.loginAttempt(req.body.email)
        .then(({ rows }) => {
            compare(req.body.password, rows[0].password).then((matchValue) => {
                if (matchValue) {
                    req.session.userID = rows[0].id;
                    console.log(
                        "req.session.userID in loginAttempt: ",
                        req.session.userID
                    );
                    res.redirect("/petition");
                } else {
                    res.render("login", {
                        tryAgain: true,
                    });
                }
            });
            // .catch((err) => {
            //     console.log("ERROR in POST login compare: ", err);
            //     res.render("login", {
            //         tryAgain: true,
            //     });
            // });
        })
        .catch((err) => {
            console.log("ERROR in POST login compare: ", err);
            res.render("login", {
                tryAgain: true,
            });
        });
});

//////-----------------------------------/petition Page----------------------------------------------------------------------//
// app.get("/", (req, res) => {
//     res.redirect("/petition");
// });

app.get("/petition", (req, res) => {
    console.log("req.session.userID in /petition: ", req.session.userID);
    db.sigCheck(req.session.userID)
        .then(({ rows }) => {
            if (rows[0].exists) {
                db.getSigId(req.session.userID).then(({ rows }) => {
                    req.session.sigId = rows[0].id;
                    res.redirect("petition/thanks");
                });
            } else {
                console.log("User did not sign. Rendering 'petition'");
                res.render("petition");
            }
        })
        .catch((err) => {
            console.log("ERROR in sigCheck /petition: ", err);
        });
});

app.post("/petition", (req, res) => {
    console.log("sigLength in POST /petition: ", req.body.sig.length);
    console.log("req.session.userID in /petition POST: ", req.session.userID);
    db.submitSig(req.body.sig, req.session.userID)
        .then(() => {
            // req.session.hasSigned = true;
            if (req.body.sig.length == 0) {
                res.render("petition", {
                    tryAgain: true,
                });
            } else {
                req.session.sigUrl = req.body.sig;
                res.redirect("/petition/thanks");

                console.log("Signature has been submitted.");
            }
        })
        .catch((err) => {
            console.log("ERROR in POST /petition: ", err);
            res.render("petition", {
                tryAgain: true,
            });
        });
});

//////-----------------------------------/thanks Page----------------------------------------------------------------------//
app.get("/petition/thanks", (req, res) => {
    db.getData(`SELECT COUNT (*) FROM signatures`)
        .then(({ rows }) => {
            req.session.numberOfSigners = rows[0].count;
        })
        .catch((err) => {
            console.log("ERROR in /thanks SELECT COUNT...: ", err);
        });

    console.log("req.session.userID in GET /thanks: ", req.session.userID);

    db.getData(
        `SELECT signature FROM signatures WHERE user_id = ${req.session.userID}`
    )
        .then(({ rows }) => {
            res.render("thanks", {
                sigUrl: rows[0].signature,
                numbSigners: req.session.numberOfSigners,
            });
        })
        .catch((err) => {
            console.log("ERROR in /thanks SELECT signature...: ", err);
        });
});

//////-----------------------------------Signers Page----------------------------------------------------------------------//
app.get("/petition/signers", (req, res) => {
    db.getData(`SELECT first, last FROM users`)
        .then(({ rows }) => {
            let namesArr = [];
            for (let i = 0; i < rows.length; i++) {
                let fullName = rows[i].first + " " + rows[i].last;
                namesArr.push(fullName);
            }

            res.render("signers", {
                signerNames: namesArr,
            });
        })
        .catch((err) => {
            console.log("ERROR in /signers: ", err);
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
