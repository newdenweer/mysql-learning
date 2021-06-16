const db = require('../mysql_connection/createConnection');

//проверка пользователя (создатель или исполнитель?)
const checkUser = async (id, taskId, res) => {
	const taskData = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', taskId);
	const task = taskData[0][0];
	if (!task) {
		return res.status(400).json({ msg: 'Задача не найдена' });
	}
	if (task.creator !== id) {
		const performerData = await db
			.promise()
			.query('SELECT * FROM performers WHERE task_id = (?) AND performer_id = (?)', [taskId, id]);
		const performer = performerData[0][0];
		if (!performer) {
			return res
				.status(400)
				.json({ msg: `Отказано! Вы не являетесь создателем или исполнителем задачи id = ${taskId}` });
		}
	}
};

module.exports = checkUser;
