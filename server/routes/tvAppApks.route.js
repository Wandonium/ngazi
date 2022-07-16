const express = require('express');
const TvAppApkCtrl = require('../controllers/tvAppApks.controller.js');
const multer = require('multer');
const Str = require('@supercharge/strings');
const logger = require('../util/logger');
const { getDate } = require('../util/util.js');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'tv_app_apks/');
    },
    filename: (req, file, cb) => {
        logger.debug(`file: ${JSON.stringify(file, null, 2)}`);
        let index = file.originalname.indexOf('.');
        let ext = file.originalname.slice(index);
        cb(null, Str.random(10) + '_' + new Date(getDate()).toISOString() + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'application/vnd.android.package-archive') {
        cb(null, true);
    } else {
        cb(new Error('File upload failed! Wrong mimetype! Please upload an apk file'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        filesize: 1024 * 1024 * 50
    },
    fileFilter
});

const router = express.Router();

router.route('/').post(upload.single('tvAppApkFile'), TvAppApkCtrl.apiPostTvAppApk);
router.route('/id/:id').get(TvAppApkCtrl.apiGetTvAppApkById);
router.route('/date/:date').get(TvAppApkCtrl.apiGetLatestTvAppApk);
router.route('/').get(TvAppApkCtrl.apiGetTvAppApk);
router.route('/').put(upload.single('tvAppApkFile'), TvAppApkCtrl.apiUpdateTvAppApk);
router.route('/id/:id').delete(TvAppApkCtrl.apiDeleteTvAppApk);

module.exports = router;