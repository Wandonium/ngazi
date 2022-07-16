const express = require('express');
const AdViewsCtrl = require('../controllers/adviews.controller.js');

const router = express.Router();

router.route('/').get(AdViewsCtrl.apiGetAdViews);
router.route('/id/:id').get(AdViewsCtrl.apiGetAdViewsById);
router.route('/').post(AdViewsCtrl.apiPostAdViews);
router.route('/').put(AdViewsCtrl.apiUpdateAdViews);
router.route('/id/:id').delete(AdViewsCtrl.apiDeleteAdView);
router.route('/userId/:userId').delete(AdViewsCtrl.apiDeleteAdViews);

module.exports = router;
