const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");
const { hash, compare } = require("./bc");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//Split console.log with each request
app.use((req, res, next) => {
    console.log(
        "//----------------------------------NEW REQUEST-------------------------------//"
    );
    next();
});

//////-----------------------------------MIDDLEWARE----------------------------------------------------------------------//

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

app.use(express.static("./public"));

// // Redirect to register page if not logged in (problem: loggedIn cookie is still set after you close the window)
// app.use((req, res, next) => {
//     console.log("req.session.loggedIn: ", req.session.loggedIn);

//     if (
//         req.url != "/login" &&
//         req.url != "/register" &&
//         !req.session.loggedIn
//     ) {
//         res.redirect("/register");
//     } else {
//         next();
//     }
// });

//////-----------------------------------/register & /login Pages----------------------------------------------------------------------//

app.get("/register", (req, res) => {
    console.log("Cookies into /register: ", req.session);

    // const { csrfSecret } = req.session;
    // req.session = {};
    // req.session.csrfSecret = csrfSecret;
    res.render("register");
});

app.post("/register", (req, res) => {
    console.log("req.body into POST /register: ", req.body);
    const bod = req.body;

    hash(bod.password).then((hashedP) => {
        db.submitRegistration(bod.firstName, bod.lastName, bod.email, hashedP)
            .then(({ rows }) => {
                console.log("Register Success");
                // req.session.hasRegistered = true;
                // req.session.loggedIn = true;
                req.session.userID = rows[0].id;
            })
            .then(() => {
                console.log("Cookies leaving /register: ", req.session);
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
    // //for now I'll reset cookies upon 'logout' like this. change this later maybe:
    console.log("Cookies into /login: ", req.session);
    // const { csrfSecret } = req.session;
    // req.session = {};
    // req.session.csrfSecret = csrfSecret;
    ////Manually
    // req.session.userID = null;
    // req.session.sigUrl = null;
    // req.session.numberOfSigners = null;
    // req.session.sigId = null;

    res.render("login");
});

app.post("/login", (req, res) => {
    db.loginAttempt(req.body.email)
        .then(({ rows }) => {
            compare(req.body.password, rows[0].password)
                .then((matchValue) => {
                    console.log("matchValue: ", matchValue);

                    if (req.body.password == "") {
                        throw Error;
                    }

                    if (matchValue) {
                        req.session.userID = rows[0].id;
                        // req.session.loggedIn = true;
                    } else {
                        throw Error;
                    }
                })
                .then(() => {
                    console.log("Cookies leaving POST /login: ", req.session);
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("ERROR in POST /login if..else: ", err);
                    ////for when the password is wrong for an existing email
                    res.render("login", {
                        tryAgain: true,
                    });
                });
        })
        .catch((err) => {
            console.log("ERROR in POST /login compare: ", err);
            ////for when neither e-mail nor password exist
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
    console.log("Cookies into /petition: ", req.session);

    // console.log("req.session.userID in /petition: ", req.session.userID);
    db.sigCheck(req.session.userID)
        .then(({ rows }) => {
            if (rows[0].exists) {
                db.getSigId(req.session.userID)
                    .then(({ rows }) => {
                        req.session.sigId = rows[0].id;
                    })
                    .then(() => {
                        console.log("Cookies leaving /petition: ", req.session);
                        res.redirect("/thanks");
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
    console.log("Cookies into POST /petition: ", req.session);

    db.submitSig(req.body.sig, req.session.userID)
        .then(() => {
            if (req.body.sig.length == 0) {
                throw Error;
                // res.render("petition", {
                //     tryAgain: true,
                // });
            } else {
                req.session.sigUrl = req.body.sig;
                // console.log("Signature has been submitted.");
            }
        })
        .then(() => {
            console.log("LEAVING POST /petition: ");
            console.log(
                "We should have new sig: ",
                req.session.sigUrl == req.body.sig
            );
            console.log("Cookies leaving POST /petition: ", req.session);
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("ERROR in POST /petition: ", err);
            res.render("petition", {
                tryAgain: true,
            });
        });
});

//////-----------------------------------/thanks Page----------------------------------------------------------------------//
app.get("/thanks", (req, res) => {
    console.log("Cookies into /thanks: ", req.session);

    db.getData(`SELECT COUNT (*) FROM signatures`)
        .then(({ rows }) => {
            req.session.numberOfSigners = rows[0].count;
        })
        .then(() => {
            db.getData(
                `SELECT signature FROM signatures WHERE user_id = ${req.session.userID}`
            )
                .then(({ rows }) => {
                    console.log("Cookies inside /thanks: ", req.session);

                    res.render("thanks", {
                        sigUrl: rows[0].signature,
                        numbSigners: req.session.numberOfSigners,
                    });
                })
                .catch((err) => {
                    console.log("ERROR in /thanks SELECT signature...: ", err);
                });
        })
        .catch((err) => {
            console.log("ERROR in /thanks SELECT COUNT...: ", err);
        });
});

//////-----------------------------------Signers Page----------------------------------------------------------------------//
app.get("/signers", (req, res) => {
    console.log("Cookies into /signers: ", req.session);

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
