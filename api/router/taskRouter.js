const express = require('express');
const controller = require('../controller/taskController');
const checkToken = require('../middleware/authMiddleware');
const taskRouter = express.Router();

taskRouter.post('/', checkToken, controller.taskCreation);

module.exports = taskRouter;
