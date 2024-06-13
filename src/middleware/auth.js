const jwt = require('jsonwebtoken');

function auth(allowedRoles) {
    return function(req, res, next) {
        const token = req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ error: 'Access forbidden for this role' });
            }

            req.user = decoded;
            console.log("user requesting data: " , req.user)
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(400).json({ error: 'Token is not valid' });
        }
    };
}

module.exports = auth;
