const db = require('../mysql_connection/createConnection');

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

module.exports = { createRating };
