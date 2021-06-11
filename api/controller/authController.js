const db = require('../mysql_connection/createConnection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const emailValidator = require('email-validator');

const generateToken = id => {
	let secret = process.env.JWT_SECRET;
	let data = {
		id,
	};
	return jwt.sign(data, secret, { expiresIn: 60 * 60 * 4 });
};

const registration = async (req, res) => {
	try {
		const { userName, email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ msg: 'Введите email и пароль' });
		}
		if (!emailValidator.validate(email)) {
			return res.status(400).json({ msg: 'Некорректный email' });
		}
		const hashPassword = bcrypt.hashSync(password, 5);
		const result = await db
			.promise()
			.query('INSERT INTO users(userName, email, password) VALUES (?,?,?)', [
				userName || 'anonymous',
				email,
				hashPassword,
			]);
		if (result) {
			const user = await db.promise().query('SELECT id, userName, email FROM users WHERE id = (?)', result[0].insertId);
			return res.status(200).json({ user: user[0][0], msg: 'Вы зарегестрировались!' });
		}
	} catch (e) {
		console.log(e);
		if (e.code === 'ER_DUP_ENTRY') {
			return res.status(400).json({ msg: 'Email duplicate' });
		}
		return res.status(400).json({ msg: 'Registration error' });
	}
};

const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ msg: 'No login or password' });
		}
		const userData = await db.promise().query('SELECT * FROM users WHERE email = (?)', email);
		const user = userData[0][0];
		if (!user) {
			return res.status(400).json({ msg: 'User is not found' });
		}
		const comparisonPasswords = bcrypt.compareSync(password, user.password);
		if (!comparisonPasswords) {
			return res.status(400).json({ msg: 'Invalid password' });
		}
		const token = generateToken(user.id);
		if (user.userName === 'anonymous') {
			return res.status(400).json({ msg: `Добро пожаловать`, token: token });
		}
		return res.status(400).json({ msg: `Добро пожаловать, ${user.userName}`, token: token });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: 'Login error' });
	}
};

module.exports = { login, registration };
