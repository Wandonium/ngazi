const express = require('express');
const NotificationsCtrl = require('../controllers/notifications.controller.js');

const router = express.Router();

router.route('/').post(NotificationsCtrl.apiPostNotification);
router.route('/id/:id').get(NotificationsCtrl.apiGetNotificationByUid);

module.exports = router;