const express = require('express');
const controller = require('../controller/usersController');
const checkToken = require('../middleware/authMiddleware');
const usersRouter = express.Router();

usersRouter.get('/', checkToken, controller.getUsers);
usersRouter.get('/:id', checkToken, controller.getOneUser);

module.exports = usersRouter;
