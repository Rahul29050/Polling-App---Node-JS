const jwt = require("jsonwebtoken");
const User = require("../models/user");
const ACCESS_TOKEN_SECRET = 'abcd1234';

exports.verifyAccessToken = async (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(400).json({ status: false, msg: "Token not found" });
    let user;
    try {
        user = jwt.verify(token, ACCESS_TOKEN_SECRET);
        console.log(user)
    }
    catch (err) {
        return res.status(401).json({ status: false, msg: "Invalid token" });
    }
    try {
        user = await User.findById(user.userId);
       
        if (!user) {
            return res.status(401).json({ status: false, msg: "User not found" });
        }
        req.user = user;
        next();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, msg: "Internal Server Error" });
    }
}