const express = require('express');
const AdQueueCtrl = require('../controllers/adqueue.controller.js');

const router = express.Router();

router.route('/').get(AdQueueCtrl.apiGetAdQueue);
router.route('/id/:id').get(AdQueueCtrl.apiGetAdQueueAdvertById);
router.route('/').put(AdQueueCtrl.apiUpdateAdQueueAdvert);
router.route('/').delete(AdQueueCtrl.apiDeleteAdQueueAdvert);

module.exports = router;