//WOULD STILL NEED TO REQUIRE EVERYTHING THAT WE'RE USING EG db
const { app } = require("../index");
const { hash, compare } = require("./bc");
const cookieSession = require("cookie-session");
const {
    mustHaveSigned,
    requireNoSignature,
    requireLoggedOutUser,
} = require("../middleware");

//////-----------------------------------/register Page----------------------------------------------------------------------//

app.get("/register", (req, res) => {
    console.log("Cookies into /register: ", req.session);
    res.render("register");
});

app.post("/register", (req, res) => {
    console.log("req.body into POST /register: ", req.body);
    const bod = req.body;

    //if bod.password is undefined, then 'hashedP' should be undefined
    const hashP = new Promise(function (resolve) {
        if (bod.password) {
            hash(bod.password).then((actualHashedP) => {
                resolve(actualHashedP);
            });
        } else {
            resolve(bod.password);
        }
    });

    hashP.then((hashedP) => {
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
    res.redirect("/register");
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
                        return;
                    } else {
                        throw Error;
                    }
                })
                .then(() => {
                    //Set Cookies for hasSigned and submittedProfile
                    const loginPromise1 = db
                        .sigCheck(req.session.userID)
                        .then(({ rows }) => {
                            if (rows[0].exists) {
                                req.session.hasSigned = true;
                                return;
                            } else {
                                return;
                            }
                        })
                        .catch((err) => {
                            console.log("ERROR in sigCheck /login: ", err);
                        });

                    const loginPromise2 = db
                        .userProfileCheck(req.session.userID)
                        .then(({ rows }) => {
                            if (rows[0].exists) {
                                req.session.submittedProfile = true;
                                return;
                            } else {
                                return;
                            }
                        })
                        .catch((err) => {
                            console.log(
                                "ERROR in userProfileCheck /login: ",
                                err
                            );
                        });

                    return Promise.all([loginPromise1, loginPromise2]);
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
