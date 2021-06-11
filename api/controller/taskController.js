const db = require('../mysql_connection/createConnection');

const taskCreation = async (req, res) => {
	try {
		const { name, text, status } = req.body;
		if (!name || !text) {
			return res.status(400).json({ msg: 'Введите название и условие задачи' });
		}
		const result = await db
			.promise()
			.query('INSERT INTO tasks(name, text, status, creator) VALUES (?,?,?,?)', [
				name,
				text,
				status || false,
				req.userId,
			]);
		const task = await db
			.promise()
			.query('SELECT id, name, text, status, creator FROM tasks WHERE id = (?)', result[0].insertId);
		return res.status(200).json({ msg: 'Вы добавили задачу', task: task[0][0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { taskCreation };
