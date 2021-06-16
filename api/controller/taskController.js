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

//получение списка задач или одной задачи со всеми данными
const getTasks = async (req, res) => {
	try {
		const { id, c, p, tag } = req.query;
		//получение одной задачи c назначенными исполнителями
		if (id) {
			const taskData = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', id);
			const performersData = await db.promise().query('SELECT id FROM performers WHERE task_id = (?)', id);
			const performers = performersData[0];
			const task = taskData[0][0];
			if (!task) {
				return res.status(400).json({ msg: 'Задача не найдена' });
			}
			if (task && performers[0]) {
				return res.json({ task: task, performers: performers });
			}
			return res.status(200).json(task);
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
		}

		// получение всех задач
		const tasks = await db.promise().query('SELECT * FROM tasks');
		return res.status(200).json({ tasks: tasks[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

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

//добавление оценки(рейтинга) исполнителю
const createRating = async (req, res) => {
	try {
		const { rating, performerId, text } = req.body;
		if (!rating || !performerId) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		const creatorData = await db
			.promise()
			.query(
				'SELECT tasks.creator FROM tasks JOIN performers ON tasks.id = performers.task_id WHERE performers.id = (?)',
				performerId
			);
		const creator = creatorData[0][0].creator;
		if (creator !== req.userId) {
			return res.status(400).json({ msg: 'Отказано (Оценку может ставить только создатель)' });
		}
		const ratingData = await db
			.promise()
			.query('INSERT INTO rating(rating, performer_id) VALUES (?,?)', [rating, performerId]);
		if (text) {
			await db
				.promise()
				.query('INSERT INTO comments(text, user_id, rating_id) VALUES (?,?,?)', [
					text,
					req.userId,
					ratingData[0].insertId,
				]);
			const result = await db
				.promise()
				.query(
					'SELECT rating.id AS rating_id, rating.rating, rating.performer_id, c.id AS comment_id, c.text, c.user_id FROM rating JOIN comments c on rating.id = c.rating_id WHERE rating.id = (?)',
					ratingData[0].insertId
				);
			console.log(result[0]);
			return res.status(200).json({ msg: 'Вы поставили оценку', rating: result[0] });
		} else {
			const result = await db.promise().query('SELECT * FROM rating WHERE id = (?)', ratingData[0].insertId);
			return res.status(200).json({ msg: 'Вы поставили оценку', rating: result[0] });
		}
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//добавление тегов
const createTag = async (req, res) => {
	try {
		const { taskId, text } = req.body;
		if (!taskId || !text) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		if (text.match(/\s/g) !== null) {
			return res.status(400).json({ msg: 'Tag не должен содержать пробелы' });
		}
		const resultTag = await db.promise().query('INSERT INTO tags(text) VALUES (?)', text.toLowerCase());
		await db.promise().query('INSERT INTO tag_in_task(tag_id, task_id) VALUES (?,?)', [resultTag[0].insertId, taskId]);
		const resultData = await db
			.promise()
			.query(
				'SELECT tags.id, tags.text, t.id AS task_id FROM tags JOIN tag_in_task tit on tags.id = tit.tag_id JOIN tasks t on tit.task_id = t.id WHERE tags.id = (?)',
				resultTag[0].insertId
			);
		const result = resultData[0][0];
		return res.status(200).json({ msg: 'Tag добавлен', tag: result });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { taskCreation, createPerformer, getTasks, createComment, createRating, createTag };
