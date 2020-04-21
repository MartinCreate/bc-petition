exports.mustHaveSigned = function mustHaveSigned(req, res, next) {
    if (!req.session.hasSigned) {
        res.redirect("/petition");
    } else {
        next();
    }
};

exports.requireNoSignature = function requireNoSignutre(req, res, next) {
    if (req.session.hasSigned) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

exports.requireLoggedOutUser = function requireLoggedOutUser(req, res, next) {
    if (req.session.userID) {
        res.redirect("/petition");
    } else {
        next();
    }
};
