const jwt = require('jsonwebtoken');

const checkJwt = (req, res, next) => {
	try {
		let token = req.headers.authorization.split(' ')[1];
		if (!token) {
			return res.status(403).json({ msg: 'You are not logged' });
		}
		let decodedToken = jwt.verify(token, process.env.JWT_SECRET);
		req.userId = decodedToken.id;
		next();
	} catch (e) {
		console.log(e);
		return res.status(403).json({ msg: 'You are not logged' });
	}
};

module.exports = checkJwt;
