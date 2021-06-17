const db = require('../mysql_connection/createConnection');
const checkUser = require('./checkUser');

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

//Получение всех тегов
const getTags = async (req, res) => {
	try {
		const data = await db.promise().query('SELECT DISTINCT text FROM tags');
		return res.status(200).json({ msg: 'Все теги', tags: data[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { createTag, getTags };
