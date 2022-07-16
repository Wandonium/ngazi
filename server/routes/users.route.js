const express = require('express');
const UsersCtrl = require('../controllers/users.controller.js');

const router = express.Router();

router.route('/').get(UsersCtrl.apiGetUsers);
router.route('/id/:id').get(UsersCtrl.apiGetUsersById);
router.route('/').post(UsersCtrl.apiPostUser);
router.route('/').put(UsersCtrl.apiUpdateUser);
router.route('/id/:id').delete(UsersCtrl.apiDeleteUser);

module.exports = router;