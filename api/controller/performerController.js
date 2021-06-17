const db = require('../mysql_connection/createConnection');

//назначение исполнителей задачи:
const createPerformer = async (req, res) => {
	try {
		const { taskId, userId } = req.body;
		if (!taskId || !userId) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		console.log(req.userId);
		const tasksData = await db
			.promise()
			.query('SELECT * FROM tasks WHERE creator = (?) AND id = (?)', [req.userId, taskId]);
		const task = tasksData[0][0];
		if (!task) {
			return res.status(400).json({ msg: 'Задача не найдена' });
		}
		const result = await db.promise().query('INSERT INTO performers(user_id, task_id) VALUES (?, ?)', [userId, taskId]);
		const performerData = await db.promise().query('SELECT * FROM performers WHERE id = (?)', result[0].insertId);
		const performer = performerData[0][0];
		return res.status(200).json({
			msg: 'Исполнитель назначен',
			performer: performer,
		});
	} catch (e) {
		console.log(e);
		if (e.code === 'ER_NO_REFERENCED_ROW_2') {
			return res.status(400).json({ msg: `Такого исполнителя не существует` });
		}
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { createPerformer };
