const db = require('../mysql_connection/createConnection');
const checkUser = require('./checkUser');

//функция генерирует номер позиции чеклиста или юнита
const addPosition = arr => {
	if (arr.length === 0) {
		return 1;
	}
	let temp = arr[0].position;
	for (let i = 1; i < arr.length; i++) {
		if (temp < arr[i].position) {
			temp = arr[i].position;
		}
	}
	return temp + 1;
};

// добавление чеклистов
const createCheckList = async (req, res) => {
	try {
		const { taskId } = req.params;
		const { name, status, text } = req.body;
		if (!name || !taskId) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		const checkPosition = await db.promise().query('SELECT position FROM checklists WHERE task_id = (?)', taskId);
		const newChecklist = await db
			.promise()
			.query('INSERT INTO checklists(name, status, position, task_id, text) VALUES (?,?,?,?,?)', [
				name,
				status || false,
				addPosition(checkPosition[0]),
				taskId,
				text,
			]);
		const result = await db.promise().query('SELECT * FROM checklists WHERE id = (?)', newChecklist[0].insertId);
		return res.status(200).json({ msg: 'Checklist добавлен', checklist: result[0][0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//добавление пунктов в чеклисты
const createUnit = async (req, res) => {
	try {
		const { checklistId } = req.params;
		const { text, status } = req.body;
		if (!checklistId || !text) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		const taskData = await db.promise().query('SELECT task_id FROM checklists WHERE id = (?)', checklistId);
		const check = await checkUser(req.userId, taskData[0][0].task_id, res);
		if (check) {
			return check;
		}
		const checkPosition = await db.promise().query('SELECT position FROM units WHERE checklist_id = (?)', checklistId);
		const newUnit = await db
			.promise()
			.query('INSERT INTO units(text, checklist_id, position, status) VALUES (?,?,?,?)', [
				text,
				checklistId,
				addPosition(checkPosition[0]),
				status || false,
			]);
		const result = await db.promise().query('SELECT * FROM units WHERE id = (?)', newUnit[0].insertId);
		return res.status(200).json({ msg: 'Unit добавлен', unit: result[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

const deleteChecklist = async (req, res) => {
	try {
		const { taskId, checklistId } = req.params;
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		const checkChecklistData = await db.promise().query('SELECT * FROM checklists WHERE id = (?)', checklistId);
		if (!checkChecklistData[0][0]) {
			return res.status(400).json({ msg: 'Такого чек листа нет' });
		}
		await db.promise().query('DELETE FROM units WHERE checklist_id = (?)', checklistId);
		await db.promise().query('DELETE FROM checklists WHERE id = (?)', checklistId);
		const taskData = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', taskId);
		const checklistsData = await db.promise().query('SELECT * FROM checklists WHERE task_id = (?)', taskId);
		return res.status(200).json({ msg: 'Чеклист удален', task: taskData[0][0], checklists: checklistsData[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { createCheckList, createUnit, deleteChecklist };
