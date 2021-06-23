const db = require('../mysql_connection/createConnection');
const checkUser = require('../services/checkUser');

//добавление коментариев к задаче
const createComment = async (req, res) => {
	try {
		const { taskId } = req.params;
		const { text } = req.body;
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

//изменение комментария
const updateComment = async (req, res) => {
	try {
		const { commentId, newText } = req.body;

		const commentData = await db.promise().query('SELECT * FROM comments WHERE id = (?)', commentId);

		if (commentData[0][0].user_id !== req.userId) {
			return res.status(400).json({ msg: 'Изменять можно только свои комментарии' });
		}

		console.log(newText);

		await db.promise().query('UPDATE comments SET text = (?) WHERE id = (?)', [newText, commentId]);

		const result = await db.promise().query('SELECT * FROM comments WHERE id = (?)', commentId);

		return res.status(200).json({ msg: 'Комментарий изменен', comment: result[0][0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//удаление комментария
const deleteComment = async (req, res) => {
	try {
		const { commentId } = req.body;
		const commentData = await db.promise().query('SELECT * FROM comments WHERE id = (?)', commentId);
		if (commentData[0][0].user_id !== req.userId) {
			return res.status(400).json({ msg: 'Удалять можно только свои комментарии' });
		}
		const result = await db.promise().query('DELETE FROM comments WHERE id = (?)', commentId);
		return res.status(200).json({ msg: 'Комментарий удален', result: result[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { createComment, updateComment, deleteComment };
