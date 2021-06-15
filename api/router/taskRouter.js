const express = require('express');
const controller = require('../controller/taskController');
const checkToken = require('../middleware/authMiddleware');
const taskRouter = express.Router();

taskRouter.post('/', checkToken, controller.taskCreation);
taskRouter.post('/performers', checkToken, controller.createPerformer);
taskRouter.get('/', checkToken, controller.getTasks);
taskRouter.post('/comment', checkToken, controller.createComment);
taskRouter.post('/rating', checkToken, controller.createRating);
taskRouter.post('/tag', checkToken, controller.createTag);

module.exports = taskRouter;
