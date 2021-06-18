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

//получение одной задачи со всеми данными или всех задач
const getTask = async (req, res) => {
	try {
		const { taskId } = req.params;
		if (taskId === 'all') {
			const tasksAll = await db.promise().query('SELECT * FROM tasks');
			return res.status(200).json({ tasks: tasksAll[0] });
		}
		const taskData = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', taskId);
		const performersData = await db.promise().query('SELECT * FROM performers WHERE task_id = (?)', taskId);
		const commentsData = await db.promise().query('SELECT * FROM comments WHERE task_id = (?)', taskId);
		const checklistData = await db.promise().query('SELECT * FROM checklists WHERE task_id = (?)', taskId);
		const unitsData = await db
			.promise()
			.query(
				'SELECT units.id, units.text, units.checklist_id, units.position, units.status FROM units JOIN checklists c on c.id = units.checklist_id WHERE task_id = (?)',
				taskId
			);
		const tagsData = await db
			.promise()
			.query(
				'SELECT tit.id AS tag_in_task_id, text FROM tags JOIN tag_in_task tit on tags.id = tit.tag_id WHERE task_id = (?)',
				taskId
			);
		return res.status(200).json({
			task: taskData[0][0],
			performers: performersData[0],
			comments: commentsData[0],
			checklists: checklistData[0],
			units: unitsData[0],
			tags: tagsData[0],
		});
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//Фильтрация задач по заданным параметрам
const getDataTasks = async (req, res) => {
	try {
		const { cId, pId, tag } = req.query;
		let arrQuery = [];
		let arrValues = [];
		//фильтрация задач по создателю
		if (cId) {
			arrValues.push(Number(cId));
			arrQuery.push('tasks.creator = (?)');
		}
		//фильтрация задач по исполнителю
		if (pId) {
			arrValues.push(Number(pId));
			arrQuery.push('p.user_id = (?)');
		}
		//фильтрация задач по тегам
		if (tag) {
			arrValues.push(tag.toLowerCase());
			arrQuery.push('t.text = (?)');
		}

		arrQuery = arrQuery.join(' AND ');
		console.log(arrQuery);
		console.log(arrValues);
		const result = await db.promise().query(
			`SELECT DISTINCT *
                 FROM tasks
                          LEFT JOIN performers p on tasks.id = p.task_id
                          LEFT JOIN tag_in_task tit on tasks.id = tit.task_id
                          LEFT JOIN tags t on tit.tag_id = t.id
                 WHERE ${arrQuery}`,
			arrValues
		);

		return res.status(200).json({ msg: 'Фильтрация выполнена', tasks: result[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//удаление задачи
const deleteTask = async (req, res) => {
	try {
		const { taskId } = req.params;
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
// изменение статуса задачи
const updateStatus = async (req, res) => {
	try {
		const { taskId } = req.params;
		const { newStatus } = req.body;
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

module.exports = { taskCreation, getDataTasks, deleteTask, updateStatus, getTask };
