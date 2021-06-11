const express = require('express');
const controller = require('../controller/authController');
//const checkToken = require('../middleware/authMiddleware');
const authRouter = express.Router();

authRouter.post('/registration', controller.registration);
authRouter.post('/login', controller.login);
//authRouter.get('/users', checkToken, controller.getUsers);

module.exports = authRouter;
