let tempSession,
    session = {};

module.exports = () => (req, res, next) => {
    //---tempSession is a cookie that is only good for one test
    //---session is a cookie we can reuse across multiple tests
    req.session = tempSession || session;
    tempSession = null;
    next();
};

module.exports.mockSession = (sess) => (session = sess);

module.exports.mockSessionOnce = (sess) => (tempSession = sess);
