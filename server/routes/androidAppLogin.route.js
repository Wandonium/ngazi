const express = require('express');
const AndroidAppLoginsCtrl = require('../controllers/androidAppLogin.controller.js');
const router = express.Router();

router.route('/').get(AndroidAppLoginsCtrl.apiGetAllLogins);
router.route('/id/:id').get(AndroidAppLoginsCtrl.apiGetLoginById);
router.route('/').post(AndroidAppLoginsCtrl.apiPostLogin);
router.route('/').put(AndroidAppLoginsCtrl.apiUpdateLogin);
router.route('/id/:id').delete(AndroidAppLoginsCtrl.apiDeleteLogin);
router.route('/deviceId/:deviceId').delete(AndroidAppLoginsCtrl.apiDeleteLoginsByDevice);

module.exports = router;
