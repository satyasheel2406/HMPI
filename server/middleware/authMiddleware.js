// server/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from the request header
  const token = req.header('Authorization');

  // Check if no token is provided
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // The token is usually in the format "Bearer <token>". We'll split it.
    const justToken = token.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(justToken, process.env.JWT_SECRET);

    // Attach the user's info to the request object for other routes to use
    req.user = decoded.user;
    next(); // Move on to the next function (the actual route)
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};