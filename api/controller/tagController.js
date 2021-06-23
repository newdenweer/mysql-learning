const db = require('../mysql_connection/createConnection');
const checkUser = require('../services/checkUser');

//добавление тегов
const createTag = async (req, res) => {
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
		if (text.match(/\s/g) !== null) {
			return res.status(400).json({ msg: 'Tag не должен содержать пробелы' });
		}
		const checkDuplicateTagInTask = await db
			.promise()
			.query(
				'SELECT tit.id AS tag_in_task_id, text, task_id FROM tags JOIN tag_in_task tit on tags.id = tit.tag_id WHERE text = (?) AND task_id = (?)',
				[text.toLowerCase(), taskId]
			);
		if (checkDuplicateTagInTask[0][0]) {
			return res.status(400).json({ msg: `tag [${text}] уже есть у этой задачи`, tag: checkDuplicateTagInTask[0][0] });
		}
		const checkDuplicateTag = await db.promise().query('SELECT * FROM tags WHERE text = (?)', text.toLowerCase());
		let tagId = checkDuplicateTag?.[0]?.[0]?.id;
		if (!tagId) {
			const newTag = await db.promise().query('INSERT INTO tags(text) VALUES (?)', text.toLowerCase());
			tagId = newTag[0].insertId;
		}
		await db.promise().query('INSERT INTO tag_in_task(tag_id, task_id) VALUES (?,?)', [tagId, taskId]);
		const result = await db
			.promise()
			.query(
				'SELECT tags.id, tags.text, t.id AS task_id FROM tags JOIN tag_in_task tit on tags.id = tit.tag_id JOIN tasks t on tit.task_id = t.id WHERE tags.id = (?)',
				tagId
			);
		return res.status(200).json({ msg: 'Tag добавлен', tag: result[0][0] });
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

const deleteTag = async (req, res) => {
	try {
		const { taskId, tag } = req.params;
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		const tagsData = await db
			.promise()
			.query(
				'SELECT tit.id, text FROM tags JOIN tag_in_task tit on tags.id = tit.tag_id WHERE task_id = (?) AND text = (?)',
				[taskId, tag.toLowerCase()]
			);
		if (!tagsData[0][0]) {
			res.status(400).json({ msg: 'Некорректные данные' });
		}
		const result = await db.promise().query('DELETE FROM tag_in_task  WHERE id = (?)', tagsData[0][0].id);
		return res
			.status(200)
			.json({
				msg: `Tag: ${tag.toLowerCase()} удален из задачи id:${taskId}`,
				tagsData: tagsData[0][0],
				result: result[0],
			});
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { createTag, getTags, deleteTag };
