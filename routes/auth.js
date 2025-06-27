const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

router.post('/login', userController.login);
router.post('/dashboard', userController.dashboard);
router.post('/register', userController.register);
router.get('/logout', userController.logout);
router.get('/user', userController.getUserPage);
router.get('/login-page', (req, res) => res.render('login', { layout: 'main' }));
router.get('/approve', userController.approveUser);
router.get('/reject', userController.rejectUser);

module.exports = router;
