const db = require('../mysql_connection/createConnection');
const checkUser = require('./checkUser');

//создание задачи:
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

//получение списка задач, данных по задаче, или одной задачи со всеми данными
const getTasks = async (req, res) => {
	try {
		const { id, c, p, tag } = req.query;
		//получение одной задачи cо всеми данными
		if (id) {
			const taskData = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', id);
			const performersData = await db.promise().query('SELECT * FROM performers WHERE task_id = (?)', id);
			const commentsData = await db.promise().query('SELECT * FROM comments WHERE task_id = (?)', id);
			const checklistData = await db.promise().query('SELECT * FROM checklists WHERE task_id = (?)', id);
			const unitsData = await db
				.promise()
				.query(
					'SELECT units.id, units.text, units.checklist_id, units.position, units.status FROM units JOIN checklists c on c.id = units.checklist_id WHERE task_id = (?)',
					id
				);
			return res.status(200).json({
				task: taskData[0][0],
				performers: performersData[0],
				comments: commentsData[0],
				checklists: checklistData[0],
				units: unitsData[0],
			});
		}
		//фильтрация задач по создателю
		if (c) {
			const creatorData = await db.promise().query('SELECT * FROM tasks WHERE creator = (?)', c);
			const creator = creatorData[0];
			if (!creator[0]) {
				return res.status(400).json({ msg: 'Этот пользователь не имеет созданных задач' });
			}
			return res.status(200).json(creator);
		}

		//фильтрация задач по исполнителю
		if (p) {
			const performerData = await db
				.promise()
				.query('SELECT * FROM tasks JOIN performers p on tasks.id = p.task_id WHERE p.id = (?)', p);
			const performer = performerData[0][0];
			if (!performer) {
				return res.status(400).json({ msg: 'Этот пользователь пока не назачен исполнителем' });
			}
			return res.status(200).json(performer);
		}

		//фильтрация задач по тегам
		if (tag) {
			const data = await db
				.promise()
				.query(
					'SELECT task_id FROM tag_in_task JOIN tags t on t.id = tag_in_task.tag_id WHERE text = (?)',
					tag.toLowerCase()
				);
			if (!data[0][0]) {
				return res.status(400).json({ msg: 'Такого тега нет =(' });
			}
			return res.status(200).json({ msg: `Результат поиска по тегу ${[tag.toLowerCase()]}`, tasks: data[0] });
		}

		// получение всех задач
		const tasks = await db.promise().query('SELECT * FROM tasks');
		return res.status(200).json({ tasks: tasks[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

const deleteTask = async (req, res) => {
	try {
		const { taskId } = req.body;
		if (!taskId) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		const checkCreator = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', taskId);
		if (checkCreator[0][0].creator !== req.userId) {
			return res.status(400).json({ msg: 'Отказано! Удалить задачу может только создатель' });
		}
		await db.promise().query('UPDATE tasks SET deleted = NOW() WHERE id = (?)', taskId);
		const result = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', taskId);
		return res.status(200).json({ msg: 'Задача удалена', task: result[0][0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};
const updateStatus = async (req, res) => {
	try {
		const { taskId, newStatus } = req.body;
		if (!taskId || !newStatus || (newStatus !== '1' && newStatus !== '0')) {
			return res.status(400).json({ msg: 'Некорректные данные' });
		}
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		await db.promise().query('UPDATE tasks SET status = (?) WHERE id = (?)', [newStatus, taskId]);
		const result = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', taskId);
		return res.status(200).json({ msg: 'Статус задачи изменен', task: result[0][0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { taskCreation, getTasks, deleteTask, updateStatus };
