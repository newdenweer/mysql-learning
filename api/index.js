const authRouter = require('./router/authRouter');
const taskRouter = require('./router/taskRouter');
const usersRouter = require('./router/usersRouter');
const express = require('express');
const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/task', taskRouter);
app.use('/users', usersRouter);
app.get('/', (req, res) => {
	res.status(200).json('Server is working');
});

app.use((req, res, next) => {
	next(new Error('Not found'));
});

app.use((err, req, res, next) => {
	res.status(err.status || 404);
	res.json({ msg: err.message });
});

app.listen(3000, () => {
	console.log('Server started at 3000');
});

console.log('test');
