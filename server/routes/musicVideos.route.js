const express = require('express');
const VideosCtrl = require('../controllers/musicVideos.controller.js');

const router = express.Router();

router.route('/').post(VideosCtrl.apiPostVideo);
router.route('/id/:id').get(VideosCtrl.apiGetVideoById);
router.route('/').get(VideosCtrl.apiGetVideos);
router.route('/').put(VideosCtrl.apiUpdateVideo);
router.route('/id/:id').delete(VideosCtrl.apiDeleteVideo);

module.exports = router;