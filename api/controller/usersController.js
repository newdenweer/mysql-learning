const db = require('../mysql_connection/createConnection');

const getUsers = async (req, res) => {
	try {
		const id = req.query.id;
		if (id) {
			const usersData = await db.promise().query('SELECT id, userName FROM users WHERE id = (?)', id);
			const user = usersData[0][0];
			if (!user) {
				return res.status(400).json({ msg: 'Потенциальный исполнитель не найден' });
			}
			return res.status(200).json({ msg: 'Потенциальный исполнитель', user: user });
		} else {
			const usersData = await db.promise().query('SELECT id, userName FROM users');
			const users = usersData[0];
			return res.status(200).json({ msg: 'Список пользователей', users: users });
		}
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

const getOneUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userData = await db.promise().query('SELECT id, userName FROM users WHERE id = (?)', id);
		if (!userData[0][0]) {
			return res.status(400).json({ msg: 'Неверный ID' });
		}
		const performerData = await db
			.promise()
			.query('SELECT id AS performer_id, task_id FROM performers WHERE user_id = (?)', id);
		const creatorData = await db.promise().query('SELECT * FROM tasks WHERE creator = (?)', id);
		return res.status(200).json({
			msg: 'Информация о пользователе',
			user: userData[0][0],
			performer: performerData[0],
			task: creatorData[0],
		});
	} catch (e) {
		console.log(e);
		return res.status(500).json({ msg: `Что-то случилось ${e.message}` });
	}
};

module.exports = { getUsers, getOneUser };
