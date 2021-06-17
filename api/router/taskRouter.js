const express = require('express');
const taskController = require('../controller/taskController');
const checkListController = require('../controller/checkListController');
const performerController = require('../controller/performerController');
const tagController = require('../controller/tagController');
const ratingController = require('../controller/ratingController');
const commentController = require('../controller/commentController');

const checkToken = require('../middleware/authMiddleware');
const taskRouter = express.Router();

taskRouter.post('/', checkToken, taskController.taskCreation);
taskRouter.get('/', checkToken, taskController.getTasks);
taskRouter.delete('/', checkToken, taskController.deleteTask);
taskRouter.put('/', checkToken, taskController.updateStatus);

taskRouter.post('/comment', checkToken, commentController.createComment);
taskRouter.put('/comment', checkToken, commentController.updateComment);
taskRouter.delete('/comment', checkToken, commentController.deleteComment);

taskRouter.post('/rating', checkToken, ratingController.createRating);

taskRouter.post('/tag', checkToken, tagController.createTag);
taskRouter.get('/tag', checkToken, tagController.getTags);

taskRouter.post('/performers', checkToken, performerController.createPerformer);

taskRouter.post('/checklist', checkToken, checkListController.createCheckList);
taskRouter.post('/checklist/unit', checkToken, checkListController.createUnit);

module.exports = taskRouter;
