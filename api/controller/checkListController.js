const db = require('../mysql_connection/createConnection');
const checkUser = require('./checkUser');

// добавление чеклистов
const createCheckList = async (req, res) => {
	try {
		const { taskId } = req.params;
		const { name, status, text, lexoRank } = req.body;
		if (!name || !taskId) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		if (status) {
			if (!(status === '1' || status === '0')) {
				return res.status(400).json({ msg: 'Некорректные данные. Status 1 or 0' });
			}
		}
		const newChecklist = await db
			.promise()
			.query('INSERT INTO checklists(name, status, lexorank, task_id, text) VALUES (?,?,?,?,?)', [
				name,
				status || false,
				lexoRank,
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

//добавление пунктов (unit) в чеклисты
const createUnit = async (req, res) => {
	try {
		const { checklistId } = req.params;
		const { text, status, lexoRank } = req.body;
		if (!checklistId || !text) {
			return res.status(400).json({ msg: 'Введите данные' });
		}
		const taskData = await db.promise().query('SELECT task_id FROM checklists WHERE id = (?)', checklistId);
		const check = await checkUser(req.userId, taskData[0][0].task_id, res);
		if (check) {
			return check;
		}
		if (status) {
			if (!(status === '1' || status === '0')) {
				return res.status(400).json({ msg: 'Некорректные данные. Status 1 or 0' });
			}
		}
		const newUnit = await db
			.promise()
			.query('INSERT INTO units(text, checklist_id, lexorank, status) VALUES (?,?,?,?)', [
				text,
				checklistId,
				lexoRank,
				status || false,
			]);
		const result = await db.promise().query('SELECT * FROM units WHERE id = (?)', newUnit[0].insertId);
		return res.status(200).json({ msg: 'Unit добавлен', unit: result[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//изменение данных чеклиста name, text, status, lexorank
const updateChecklist = async (req, res) => {
	try {
		const { taskId, checklistId } = req.params;
		const { name, text, status, lexoRank } = req.body;
		if (!name && !text && !status && !lexoRank) {
			return res.status(400).json({ msg: 'Данные отсутствуют' });
		}
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		const checklistData = await db
			.promise()
			.query('SELECT * FROM checklists WHERE id = (?) AND task_id = (?)', [checklistId, taskId]);
		if (!checklistData[0][0]) {
			return res.status(400).json({ msg: 'Некорректные данные. Такого checklist нет' });
		}
		if (lexoRank) {
			await db
				.promise()
				.query('UPDATE checklists SET lexorank = (?) WHERE id = (?) AND task_id = (?)', [
					lexoRank,
					checklistId,
					taskId,
				]);
		}
		if (status) {
			if (!(status === '1' || status === '0')) {
				return res.status(400).json({ msg: 'Некорректные данные' });
			}
			await db
				.promise()
				.query('UPDATE checklists SET status = (?) WHERE id = (?) AND task_id = (?)', [status, checklistId, taskId]);
		}
		if (name) {
			await db
				.promise()
				.query('UPDATE checklists SET name = (?) WHERE id = (?) AND task_id = (?)', [name, checklistId, taskId]);
		}
		if (text) {
			await db
				.promise()
				.query('UPDATE checklists SET text = (?) WHERE id = (?) AND task_id = (?)', [text, checklistId, taskId]);
		}
		const result = await db.promise().query('SELECT * FROM checklists WHERE id = (?)', checklistId);
		return res.status(200).json({ msg: 'checklist изменен', checklist: result[0][0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//изменение данных юнита text, status, lexorank
const updateUnit = async (req, res) => {
	try {
		const { taskId, checklistId, unitId } = req.params;
		const { text, status, lexoRank } = req.body;
		if (!text && !status && !lexoRank) {
			return res.status(400).json({ msg: 'Данные отсутствуют' });
		}
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		const unitData = await db
			.promise()
			.query(
				'SELECT units.id FROM units join checklists c on c.id = units.checklist_id WHERE units.id = (?) AND checklist_id = (?) AND task_id = (?)',
				[unitId, checklistId, taskId]
			);
		if (!unitData[0][0]) {
			return res.status(400).json({ msg: 'Некорректные данные. Такого unit нет' });
		}
		if (lexoRank) {
			await db
				.promise()
				.query('UPDATE units SET lexorank = (?) WHERE id = (?) AND checklist_id = (?)', [
					lexoRank,
					unitId,
					checklistId,
				]);
		}
		if (text) {
			await db
				.promise()
				.query('UPDATE units SET text = (?) WHERE id = (?) AND checklist_id = (?)', [text, unitId, checklistId]);
		}
		if (status) {
			if (!(status === '1' || status === '0')) {
				return res.status(400).json({ msg: 'Некорректные данные. Status 1 or 0' });
			}
			await db
				.promise()
				.query('UPDATE units SET status = (?) WHERE id = (?) AND checklist_id = (?)', [status, unitId, checklistId]);
		}
		const result = await db.promise().query('SELECT * FROM units WHERE id = (?)', unitId);
		return res.status(200).json({ msg: 'unit изменен', checklist: result[0][0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//удаление чеклиста со всеми юнитами
const deleteChecklist = async (req, res) => {
	try {
		const { taskId, checklistId } = req.params;
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		const checkChecklistData = await db
			.promise()
			.query('SELECT * FROM checklists WHERE id = (?) AND task_id = (?)', [checklistId, taskId]);
		if (!checkChecklistData[0][0]) {
			return res.status(400).json({ msg: 'Такого чек листа нет' });
		}
		await db.promise().query('DELETE FROM units WHERE checklist_id = (?)', checklistId);
		await db.promise().query('DELETE FROM checklists WHERE id = (?)', checklistId);
		const taskData = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', taskId);
		const checklistsData = await db.promise().query('SELECT * FROM checklists WHERE task_id = (?)', taskId);
		return res
			.status(200)
			.json({ msg: 'Чеклист и все его пункты удалены', task: taskData[0][0], checklists: checklistsData[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//удаление юнита
const deleteUnit = async (req, res) => {
	try {
		const { taskId, checklistId, unitId } = req.params;
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		const checkUnit = await db
			.promise()
			.query('SELECT * FROM units WHERE id = (?) AND checklist_id = (?)', [unitId, checklistId]);
		if (!checkUnit[0][0]) {
			return res.status(400).json({ msg: 'Такого юнита нет' });
		}
		await db.promise().query('DELETE FROM units WHERE id = (?)', unitId);
		const taskData = await db.promise().query('SELECT * FROM tasks WHERE id = (?)', taskId);
		const checklistsData = await db.promise().query('SELECT * FROM checklists WHERE id = (?)', checklistId);
		const unitsData = await db.promise().query('SELECT * FROM units WHERE checklist_id = (?)', checklistId);
		return res
			.status(200)
			.json({ msg: `Пункт удален`, task: taskData[0][0], checklists: checklistsData[0], units: unitsData[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = {
	createCheckList,
	createUnit,
	deleteChecklist,
	deleteUnit,
	updateChecklist,
	updateUnit,
};
