const express = require('express');
const PlaylistCtrl = require('../controllers/playlist.controller.js');

const router = express.Router();

router.route('/').post(PlaylistCtrl.apiPostPlaylist);
router.route('/id/:id').get(PlaylistCtrl.apiGetPlaylistById);
router.route('/').get(PlaylistCtrl.apiGetPlaylists);
router.route('/').put(PlaylistCtrl.apiUpdatePlaylist);
router.route('/id/:id').delete(PlaylistCtrl.apiDeletePlaylist);

module.exports = router;