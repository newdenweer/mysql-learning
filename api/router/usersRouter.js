const express = require('express');
const controller = require('../controller/usersController');
const checkToken = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', checkToken, controller.getUsers);

module.exports = router;
