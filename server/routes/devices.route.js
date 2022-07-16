const express = require('express');
const DevicesCtrl = require('../controllers/devices.controller.js');

const router = express.Router();

router.route('/').get(DevicesCtrl.apiGetDevices);
router.route('/id/:id').get(DevicesCtrl.apiGetDeviceById);
router.route('/').post(DevicesCtrl.apiPostDevice);
router.route('/').put(DevicesCtrl.apiUpdateDevice);
router.route('/id/:id').delete(DevicesCtrl.apiDeleteDevice);

module.exports = router;