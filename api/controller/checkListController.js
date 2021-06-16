const db = require('../mysql_connection/createConnection');
const checkUser = require('./checkUser');
const addPosition = arr => {
	return arr.length + 1;
};

// добавление чеклистов
const createCheckList = async (req, res) => {
	try {
		const { name, taskId, status } = req.body;
		if (!name || !taskId) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		await checkUser(req.userId, taskId, res);
		const checkPosition = await db.promise().query('SELECT * FROM checklists WHERE task_id = (?)', taskId);
		const newChecklist = await db
			.promise()
			.query('INSERT INTO checklists(name, status, position, task_id) VALUES (?,?,?,?)', [
				name,
				status || false,
				addPosition(checkPosition[0]),
				taskId,
			]);
		const result = await db.promise().query('SELECT * FROM checklists WHERE id = (?)', newChecklist[0].insertId);
		return res.status(200).json({ msg: 'Checklist добавлен', checklist: result[0][0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

// const createUnit = async (req, res) => {
// 	try {
// 	} catch (e) {
// 		console.log(e);
// 		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
// 	}
// };

module.exports = { createCheckList };
