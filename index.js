const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db");
const { hash, compare } = require("./bc");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// //TENTATIVE
exports.app = app;
// require("./routes/auth");
// const profileRouter = require("./routes/profile");
// const {
//     mustHaveSigned,
//     requireNoSignature,
//     requireLoggedOutUser,
// } = require("./middleware");

//Split console with each request
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

////-------------------- Redirects -----------------------------//
// Redirect to /register if no loggedIn Cookie
app.use((req, res, next) => {
    req.url != "/login" && req.url != "/register" && !req.session.loggedIn
        ? res.redirect("/register")
        : next();
});

// Redirect to /petition if loggedIn Cookie
app.get("/", (req, res) => {
    if (req.session.loggedIn) {
        res.redirect("/petition");
    }
});

// Redirect to /petition of no hasSigned Cookie
app.use((req, res, next) => {
    !req.session.hasSigned &&
    (req.url == "/thanks" ||
        req.url.startsWith("/signers") ||
        req.url == "/profile/edit")
        ? res.redirect("/petition")
        : next();
});

// Redirect to /petition if logged in and trying to access logout

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

//TENTATIVE - this would replace the profile get and post routes (we'd source from the external file)
// app.use("/profile", profileRouter);

//////-----------------------------------/profile Page----------------------------------------------------------------------//
//TENTATIVE - requireNoSignature
// app.get("/profile", requireNoSignature, (req, res) => {
app.get("/profile", (req, res) => {
    console.log("Cookies into /profile: ", req.session);

    //Redirect to /petition if submitted before
    db.userProfileCheck(req.session.userID)
        .then(({ rows }) => {
            if (rows[0].exists) {
                req.session.submitProfile = true;
                res.redirect("/petition");
            } else {
                res.render("profile");
            }
        })
        .catch((err) => {
            console.log("ERROR in userProfileCheck /profile: ", err);
        });
});

//// TENTATIVE
// app.post("/profile", requireNoSignature, (req, res) => {
app.post("/profile", (req, res) => {
    const bod = req.body;

    console.log("IN POST /portfolio req.session.userID: ", req.session.userID);
    db.submitProfile(req.session.userID, bod.age, bod.city, bod.user_website)
        .then(() => {
            req.session.submittedProfile = true;
        })
        .then(() => {
            console.log("Profile-Submission Success");
            console.log("Cookies POST /profile: ", req.session);
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("ERROR in POST /profile", err);
            res.render("profile", {
                tryAgain: true,
            });
        });
});

//////-----------------------------------/profile/edit Page----------------------------------------------------------------------//
app.get("/profile/edit", (req, res) => {
    db.getProfileEditInfo(req.session.userID)
        .then(({ rows }) => {
            //Set Cookies for conditional error message
            req.session.editProfile = {};
            let edit = req.session.editProfile;
            edit.first = rows[0].first;
            edit.last = rows[0].last;
            edit.email = rows[0].email;
            edit.age = rows[0].age;
            edit.city = rows[0].city;
            edit.url = rows[0].url;
            console.log("rows[0] before rendering /profile/edit: ", rows[0]);
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

app.post("/profile/edit", (req, res) => {
    let bod = req.body;

    console.log("bod.password: ", bod.password);

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

    hashP
        .then((hashedP) => {
            console.log("hashedP: ", hashedP);
            const promise1 = db.updateUsers(
                req.session.userID,
                bod.firstName,
                bod.lastName,
                bod.email,
                hashedP
            );
            const promise2 = db.updateUserProfiles(
                req.session.userID,
                bod.age,
                bod.city,
                bod.user_website
            );

            return Promise.all([promise1, promise2]);
        })
        .then(() => {
            // res.redirect("/profile/edit");

            return db
                .getProfileEditInfo(req.session.userID)
                .then(({ rows }) => {
                    //Set Cookies for conditional error message
                    req.session.editProfile = {};
                    let edit = req.session.editProfile;
                    edit.first = rows[0].first;
                    edit.last = rows[0].last;
                    edit.email = rows[0].email;
                    edit.age = rows[0].age;
                    edit.city = rows[0].city;
                    edit.url = rows[0].url;
                    console.log(
                        "rows[0] before rendering /profile/edit: ",
                        rows[0]
                    );
                    res.render("profile_edit", {
                        uFirst: rows[0].first,
                        uLast: rows[0].last,
                        uEmail: rows[0].email,
                        uAge: rows[0].age,
                        uCity: rows[0].city,
                        uUrl: rows[0].url,
                        justUpdated: true,
                    });
                });
        })
        .catch((err) => {
            console.log("ERROR in updateUser(s/Profiles) /profile/edit: ", err);
            let edit = req.session.editProfile;
            res.render("profile_edit", {
                //Retrieve cookies for conditional error message
                uFirst: edit.first,
                uLast: edit.last,
                uEmail: edit.email,
                uAge: edit.age,
                uCity: edit.city,
                uUrl: edit.url,
                tryAgain: true,
            });
        })

        .catch((err) => {
            console.log("ERROR in hash /profile/edit: ", err);
        });
});

//////-----------------------------------/petition Page----------------------------------------------------------------------//
app.get("/petition", (req, res) => {
    console.log("Cookies into /petition: ", req.session);

    // Redirect to /profile if not 'Continue'd
    if (!req.session.submittedProfile) {
        res.redirect("/profile");
        return;
    }

    // db.userProfileCheck(req.session.userID)
    //     .then(({ rows }) => {
    //         if (rows[0].exists) {
    //             req.session.submitProfile = true;
    //         } else {
    //             return res.redirect("/profile");
    //         }
    //     })

    //Redirect to /thanks if signed
    db.sigCheck(req.session.userID)
        .then(({ rows }) => {
            if (rows[0].exists) {
                console.log("Cookies leaving /petition: ", req.session);
                res.redirect("/thanks");
            } else {
                console.log("User did not sign. Rendering /petition");
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
                console.log("Signature has been submitted.");
                req.session.hasSigned = true;
                return;
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

//////-----------------------------------/sig-delete----------------------------------------------------------------------//
app.post("/sig-delete", (req, res) => {
    db.deleteSig(req.session.userID).then(() => {
        res.redirect("/petition");
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
    console.log("req.params: ", req.params);
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

//////-----------------------------------/delete Page----------------------------------------------------------------------//
app.get("/delete", (req, res) => {
    if (!req.session.submitProfile) {
        return res.redirect("/profile");
    }

    res.render("delete_account");
});

app.post("/delete", (req, res) => {
    db.deleteSignaturesRow(req.session.userID)
        .then(() => {
            return db.deleteUserProfilesRow(req.session.userID);
        })
        .then(() => {
            return db.deleteUsersRow(req.session.userID);
        })
        .then(() => {
            res.redirect("/logout");
        })
        .catch((err) => {
            console.log("ERROR in /delete POST: ", err);
        });
});

//////-----------------------------------Server Channel----------------------------------------------------------------------//

if (require.main === module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("petition server is up and running...")
    );
}
