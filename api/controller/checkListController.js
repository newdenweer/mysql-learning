const db = require('../mysql_connection/createConnection');
const checkUser = require('./checkUser');

// Функция генерирует номер позиции чеклиста или юнита. Я совсем забыл , что можно запросить максимальное значение
// position из базы данных и просто делать +1, но так тоже работает.
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

//изменение данных чеклиста name, text, status
const updateChecklist = async (req, res) => {
	try {
		const { taskId, checklistId } = req.params;
		const { name, text, status } = req.body;
		if (!name && !text && !status) {
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

//изменение данных юнита text, status
const updateUnit = async (req, res) => {
	try {
		const { taskId, checklistId, unitId } = req.params;
		const { text, status } = req.body;
		if (!text && !status) {
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
		if (status) {
			if (!(status === '1' || status === '0')) {
				return res.status(400).json({ msg: 'Некорректные данные' });
			}
			await db
				.promise()
				.query('UPDATE units SET status = (?) WHERE id = (?) AND checklist_id= (?)', [status, unitId, checklistId]);
		}
		if (text) {
			await db
				.promise()
				.query('UPDATE units SET text = (?) WHERE id = (?) AND checklist_id= (?)', [text, unitId, checklistId]);
		}
		const result = await db.promise().query('SELECT * FROM units WHERE id = (?)', unitId);
		return res.status(200).json({ msg: 'unit изменен', checklist: result[0][0] });
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

//изменение порядка чеклистов
const changePositionChecklist = async (req, res) => {
	try {
		const { taskId, checklistId } = req.params;
		const { newPositionId } = req.body;
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		if (checklistId === newPositionId) {
			return res
				.status(400)
				.json({ msg: `Неверные дынные. checklistId:${checklistId} === newPositionId:${newPositionId}` });
		}
		const checklistWithOldPosition = await db
			.promise()
			.query('SELECT * FROM checklists WHERE task_id = (?) AND id = (?)', [taskId, checklistId]);
		const checklistWithNewPosition = await db
			.promise()
			.query('SELECT * FROM checklists WHERE task_id = (?) AND id = (?)', [taskId, newPositionId]);
		if (!checklistWithOldPosition[0][0] || !checklistWithNewPosition[0][0]) {
			return res.status(400).json({ msg: 'Неверные данные' });
		}
		await db
			.promise()
			.query('UPDATE checklists SET position = (?) WHERE id = (?)', [
				checklistWithNewPosition[0][0].position,
				checklistWithOldPosition[0][0].id,
			]);
		await db
			.promise()
			.query('UPDATE checklists SET position = (?) WHERE id = (?)', [
				checklistWithOldPosition[0][0].position,
				checklistWithNewPosition[0][0].id,
			]);
		const updateChecklistsData = await db.promise().query('SELECT * FROM checklists WHERE task_id = (?)', taskId);
		return res.status(200).json({ msg: 'Порядок чеклистов обновлен', checklists: updateChecklistsData[0] });
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

//изменение порядка юнитов
const changePositionUnit = async (req, res) => {
	try {
		const { taskId, checklistId, unitId } = req.params;
		const { newPositionUnitId } = req.body;
		const check = await checkUser(req.userId, taskId, res);
		if (check) {
			return check;
		}
		if (unitId === newPositionUnitId) {
			return res
				.status(400)
				.json({ msg: `Неверные дынные. unitId:${unitId} === newPositionUnitId:${newPositionUnitId}` });
		}
		const unitOldPosition = await db
			.promise()
			.query(
				'SELECT units.id, units.position FROM units join checklists c on c.id = units.checklist_id WHERE units.id = (?) AND checklist_id = (?) AND task_id = (?)',
				[unitId, checklistId, taskId]
			);
		const unitNewPosition = await db
			.promise()
			.query(
				'SELECT units.id, units.position FROM units join checklists c on c.id = units.checklist_id WHERE units.id = (?) AND checklist_id = (?) AND task_id = (?)',
				[newPositionUnitId, checklistId, taskId]
			);
		if (!unitOldPosition[0][0] || !unitNewPosition[0][0]) {
			return res.status(400).json({ msg: 'Неверные данные' });
		}
		await db
			.promise()
			.query('UPDATE units SET position = (?) WHERE id = (?)', [
				unitNewPosition[0][0].position,
				unitOldPosition[0][0].id,
			]);
		await db
			.promise()
			.query('UPDATE units SET position = (?) WHERE id = (?)', [
				unitOldPosition[0][0].position,
				unitNewPosition[0][0].id,
			]);
		const unitsData = await db
			.promise()
			.query('SELECT units.id, units.position, checklist_id FROM units WHERE checklist_id = (?)', checklistId);
		return res.json({ msg: 'Порядок пунктов обновлен', units: unitsData[0] });
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
	changePositionChecklist,
	changePositionUnit,
	updateChecklist,
	updateUnit,
};
