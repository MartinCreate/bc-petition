//WOULD STILL NEED TO REQUIRE EVERYTHING THAT WE'RE USING IN HERE, eg. db and whatnot

const express = require("express");
const router = express.Router();

//////-----------------------------------/profile Page----------------------------------------------------------------------//
router.get("/profile", requireNoSignature, (req, res) => {
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

router.post("/profile", requireNoSignature, (req, res) => {
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
router.get("/profile/edit", (req, res) => {
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

router.post("/profile/edit", (req, res) => {
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

module.exports = router;
