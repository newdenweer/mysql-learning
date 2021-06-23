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
taskRouter.get('/', checkToken, taskController.getDataTasks);
taskRouter.get('/:taskId', checkToken, taskController.getTask);
taskRouter.delete('/:taskId', checkToken, taskController.deleteTask);
taskRouter.put('/:taskId', checkToken, taskController.updateTask);

taskRouter.post('/:taskId/comment', checkToken, commentController.createComment);
taskRouter.put('/:taskId/comment', checkToken, commentController.updateComment);
taskRouter.delete('/:taskId/comment', checkToken, commentController.deleteComment);

taskRouter.post('/rating', checkToken, ratingController.createRating);

taskRouter.post('/:taskId/tag', checkToken, tagController.createTag);
taskRouter.get('/tag/all', checkToken, tagController.getTags);
taskRouter.delete('/:taskId/tag/:tag', checkToken, tagController.deleteTag);

taskRouter.post('/:taskId/performers', checkToken, performerController.createPerformer);
taskRouter.delete('/:taskId/performers/:performerId', checkToken, performerController.deletePerformer);

taskRouter.post('/:taskId/checklist', checkToken, checkListController.createCheckList);
taskRouter.post('/:taskId/checklist/:checklistId/unit', checkToken, checkListController.createUnit);
taskRouter.delete('/:taskId/checklist/:checklistId', checkToken, checkListController.deleteChecklist);
taskRouter.delete('/:taskId/checklist/:checklistId/unit/:unitId', checkToken, checkListController.deleteUnit);
taskRouter.put('/:taskId/checklist/:checklistId', checkToken, checkListController.updateChecklist);
taskRouter.put('/:taskId/checklist/:checklistId/unit/:unitId', checkToken, checkListController.updateUnit);

module.exports = taskRouter;
