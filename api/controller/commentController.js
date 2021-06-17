const db = require('../mysql_connection/createConnection');
const checkUser = require('./checkUser');

//добавление коментариев к задаче
const createComment = async (req, res) => {
	try {
		const { taskId, text } = req.body;
		if (!taskId || !text) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		const result = await db
			.promise()
			.query('INSERT INTO comments(text, task_id, user_id) VALUES (?,?,?)', [text, taskId, req.userId]);
		const commentData = await db.promise().query('SELECT * FROM comments WHERE id = (?)', result[0].insertId);
		return res.status(200).json({ msg: 'Комментарий добавлен', comment: commentData[0][0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { createComment };
