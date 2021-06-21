const db = require('../mysql_connection/createConnection');

//назначение исполнителей задачи:
const createPerformer = async (req, res) => {
	try {
		const { taskId } = req.params;
		const { userId } = req.body;
		if (!userId) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		const tasksData = await db
			.promise()
			.query('SELECT * FROM tasks WHERE creator = (?) AND id = (?)', [req.userId, taskId]);
		if (!tasksData[0][0]) {
			return res.status(400).json({ msg: 'Задача не найдена' });
		}
		if (tasksData[0][0].creator === Number(userId)) {
			return res.status(400).json({ msg: 'Вы не можете назначить себя исполнителем' });
		}
		const checkPerformer = await db
			.promise()
			.query('SELECT * FROM performers WHERE user_id = (?) AND task_id = (?)', [userId, taskId]);
		if (checkPerformer[0][0]) {
			return res.status(400).json({ msg: 'Такой исполнитель уже есть' });
		}
		const newPerformer = await db
			.promise()
			.query('INSERT INTO performers(user_id, task_id) VALUES (?, ?)', [userId, taskId]);
		const performerData = await db.promise().query('SELECT * FROM performers WHERE id = (?)', newPerformer[0].insertId);
		return res.status(200).json({
			msg: 'Исполнитель назначен',
			performer: performerData[0][0],
		});
	} catch (e) {
		console.log(e);
		if (e.code === 'ER_NO_REFERENCED_ROW_2') {
			return res.status(400).json({ msg: `Такого пользователя не существует` });
		}
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//удаление исполнителей
const deletePerformer = async (req, res) => {
	try {
		const { taskId, performerId } = req.params;
		const tasksData = await db
			.promise()
			.query('SELECT * FROM tasks WHERE creator = (?) AND id = (?)', [req.userId, taskId]);
		if (!tasksData[0][0]) {
			return res.status(400).json({ msg: 'Задача не найдена' });
		}
		const checkPerformer = await db.promise().query('SELECT * FROM performers WHERE id = (?)', performerId);
		if (!checkPerformer[0][0]) {
			return res.status(400).json({ msg: 'Такого испольнителя не существует' });
		}
		await db.promise().query('DELETE FROM performers WHERE id = (?)', performerId);
		const taskData = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', taskId);
		const performersData = await db.promise().query('SELECT * FROM performers WHERE task_id = (?)', taskId);
		res
			.status(200)
			.json({ msg: `performer_id:${performerId} удален`, task: taskData[0][0], performers: performersData[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { createPerformer, deletePerformer };
