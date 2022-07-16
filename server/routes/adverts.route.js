const express = require('express');
const AdvertsCtrl = require('../controllers/adverts.controller.js');

const router = express.Router();

router.route('/').post(AdvertsCtrl.apiPostAdvert);
router.route('/id/:id').get(AdvertsCtrl.apiGetAdvertsById);
router.route('/').get(AdvertsCtrl.apiGetAdverts);
router.route('/').put(AdvertsCtrl.apiUpdateAdvert);
router.route('/advertId/:advertId/index/:index').put(AdvertsCtrl.apiRemoveAdFromAdQueue);
router.route('/id/:id').delete(AdvertsCtrl.apiDeleteAdvert);

module.exports = router;