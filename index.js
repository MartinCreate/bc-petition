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
        maxAge: 1000 * 60 * 60 * 24 * 14, //milliseconds until sessionCookies expire
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

app.use(express.static("./public"));

// Redirect to register page if not logged in
app.use((req, res, next) => {
    if (
        req.url != "/login" &&
        req.url != "/register" &&
        !req.session.loggedIn
    ) {
        res.redirect("/register");
    } else {
        next();
    }
});

// Redirect to petition page if logged in
app.get("/", (req, res) => {
    if (req.session.loggedIn) {
        res.redirect("/petition");
    }
});

//////-----------------------------------/register Page----------------------------------------------------------------------//

app.get("/register", (req, res) => {
    console.log("Cookies into /register: ", req.session);
    res.render("register");
});

app.post("/register", (req, res) => {
    console.log("req.body into POST /register: ", req.body);
    const bod = req.body;

    hash(bod.password).then((hashedP) => {
        db.submitRegistration(bod.firstName, bod.lastName, bod.email, hashedP)
            .then(({ rows }) => {
                console.log("Register Successful");
                //resetCookies
                const { csrfSecret } = req.session;
                req.session = {};
                req.session.csrfSecret = csrfSecret;
                //userId and login Cookie
                req.session.userID = rows[0].id;
                req.session.loggedIn = true;
            })
            .then(() => {
                console.log("Cookies leaving /register: ", req.session);
                res.redirect("/profile");
            })
            .catch((err) => {
                console.log("ERROR in POST /register, submitReg", err);
                res.render("register", {
                    tryAgain: true,
                });
            });
    });
});

//////-----------------------------------/logout----------------------------------------------------------------------//

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});

//////-----------------------------------/login Page----------------------------------------------------------------------//
app.get("/login", (req, res) => {
    console.log("Cookies into /login: ", req.session);

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
                        req.session.loggedIn = true;
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
            ////for when e-mail doesn't exist
            res.render("login", {
                tryAgain: true,
            });
        });
});

//////-----------------------------------/profile Page----------------------------------------------------------------------//
app.get("/profile", (req, res) => {
    console.log("Cookis into /profile: ", req.session);
    res.render("profile");
});

app.post("/profile", (req, res) => {
    const bod = req.body;

    db.submitProfile(req.session.userID, bod.age, bod.city, bod.user_website)
        .then(() => {
            console.log("Profile-Submission Success");
            console.log("Cookies POST /profile: ", req.session);
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("ERROR in POST /profile", err);
            res.redirect("/petition");
        });
});

//////-----------------------------------/profile/edit Page----------------------------------------------------------------------//
app.get("/profile/edit", (req, res) => {
    db.getProfileEditInfo(req.session.userID)
        .then(({ rows }) => {
            req.session.editProfile = {};
            let edit = req.session.editProfile;
            edit.first = rows[0].first;
            edit.last = rows[0].last;
            edit.email = rows[0].email;
            edit.age = rows[0].age;
            edit.city = rows[0].city;
            edit.url = rows[0].url;
            console.log("cookies: ", req.session);
            res.render("profile_edit", {
                uFirst: rows[0].first,
                uLast: rows[0].last,
                uEmail: rows[0].email,
                uAge: rows[0].age,
                uCity: rows[0].city,
                uUrl: rows[0].url,
            });
        })
        .catch((err) => {
            console.log("ERROR in getProfileEditInfo /profile/edit: ", err);
        });
});

// app.post("/profile/edit", (req, res) => {

//     let edit = req.session.editProfile;
//     res.render("profile_edit", {
//         uFirst: edit.first,
//         uLast: edit.last,
//         uEmail: edit.email,
//         uAge: edit.age,
//         uCity: edit.city,
//         uUrl: edit.url,
//         tryAgain: true,
//     });
// });

//////-----------------------------------/petition Page----------------------------------------------------------------------//
app.get("/petition", (req, res) => {
    console.log("Cookies into /petition: ", req.session);

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
            } else {
                // req.session.sigUrlID = urlID;    //Unnecessary?
                console.log("Signature has been submitted.");
            }
        })
        .then(() => {
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

//////-----------------------------------/signers Page----------------------------------------------------------------------//
app.get("/signers", (req, res) => {
    console.log("Cookies into /signers: ", req.session);

    db.getFullSigners()
        .then(({ rows }) => {
            res.render("signers", {
                allinfo: rows,
                allCities: true,
            });
        })
        .catch((err) => {
            console.log("ERROR in /signers: ", err);
        });
});

app.get("/signers/:name", (req, res) => {
    db.getSignerCity(req.params.name)
        .then(({ rows }) => {
            res.render("signers", {
                allinfo: rows,
                byCity: req.params.name,
            });
        })
        .catch((err) => {
            console.log("ERROR in /signers/city: ", err);
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

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server is listening...")
);
// app.listen(8080, () => console.log("petition server is listening..."));

//////-----------------------------------FYIs----------------------------------------------------------------------//
// //this
// db.getData(`SELECT COUNT (*) FROM signatures`).then((response) => {
//     numberOfSigners = response.rows[0].count;
// });

// // is the same as this
// db.getData(`SELECT COUNT (*) FROM signatures`).then(({ rows }) => {
//     numberOfSigners = rows[0].count;
// });
