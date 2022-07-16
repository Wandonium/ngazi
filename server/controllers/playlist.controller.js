const PlaylistDAO = require('../dao/playlist.dao.js');
const VideosDAO = require('../dao/video.dao.js');
const { getDate } = require('../util/util.js');
const logger = require('../util/logger');

class PlaylistController {
    static async apiPostPlaylist(req, res) {
        const title = req.body.title;
        const description = req.body.description;
        const image_url = req.body.image_url;
        const videosArr = req.body.videos;

        try {
            if(title && description && image_url && videosArr.length !== 0) {
                let proceed = true;
                videosArr.forEach(vid => {
                    if(vid.playlist_id) {
                        proceed = false;
                        res.status(500).json({
                            status: 'failure',
                            error: 'Fatal Error! One of the videos' +
                        ' provided already has a playlist!'
                        });
                    }
                });
                if(proceed) {
                    PlaylistDAO.addPlaylist({
                        title, description, image_url, added_on: getDate()
                    }).then(data => {
                        logger.info(`created new playlist successfully: ${JSON.stringify(data, null, 2)}`);
                        if(data.insertedId) {
                            let playlistId = data.insertedId.toString();
                            let updateVideo = (video, idx) => {
                                let updatedVideo = {...video, playlist_id: playlistId};
                                logger.debug(`updatedVideo: ${JSON.stringify(updatedVideo, null, 2)}`);
                                VideosDAO.updateVideos(updatedVideo)
                                .then(data => {
                                    if(data.modifiedCount >= 1) {
                                        logger.info(`updated the video successfully: ${JSON.stringify(data, null, 2)}`)
                                        idx++;
                                        if(idx < videosArr.length) {
                                            updateVideo(videosArr[idx], idx);
                                        } else {
                                            res.json({
                                                status: 'success',
                                                playlistId,
                                                response: 'Successfully created playlist and added videos to it!👍'
                                            });
                                        }
                                    } else {
                                        let msg = 'Failed to change playlistId on video';
                                        logger.error(msg);
                                        throw new Error(msg);
                                    }
                                }).catch(err => {
                                    let msg = `Failed to update video for playlist: ${err.message}`
                                    logger.error(msg);
                                    res.status(500).json({
                                        status: 'failure',
                                        error: msg
                                    });
                                })
                            }
                            updateVideo(videosArr[0], 0);
                        } else {
                            throw new Error(`Failed to insert playlist into DB!`);
                        }
                    }).catch(err => {
                        let msg = `create new playlist error: ${err.message}`
                        res.status(500).json({
                            status: 'failure',
                            error: msg
                        });
                    })
                }
            } else {
                let  msg = 'Fatal Error! Missing post parameter!';
                logger.error(msg);
                throw new Error(msg);
            }
        } catch(e) {
            res.status(500).json({
                status: 'failure',
                error: e.message
            });
        }
    }

    static async apiGetPlaylists(req, res) {
        const perPage = req.query.playlistsPerPage;
        const mPage = req.query.page;
        const playlistsPerPage = perPage ? parseInt(perPage, 10) : 20;
        const page = mPage ? parseInt(mPage, 10) : 0;

        let filters = {};
        if(req.query.title) {
            filters.title = req.query.title;
        } else if(req.query.image_url) {
            filters.image_url = req.query.image_url;
        }

        try {
            const { playlistList, totalNumPlaylists } = await PlaylistDAO.getPlaylists({ filters, page, playlistsPerPage });

            let response = {
                playlists: playlistList,
                page,
                filters,
                entries_per_page: playlistsPerPage,
                total_results: totalNumPlaylists
            };

            res.json(response);
        } catch(e) {
            logger.error(`Fatal error getting playlists: ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiGetPlaylistById(req, res) {
        try {
            let id = req.params.id || {};
            logger.debug(`playlist id: ${id}`);
            let playlist = await PlaylistDAO.getPlaylistById(id);
            if(!playlist) {
                res.status(404).json({ error: 'Playlist not found!' });
                return;
            }
            res.json(playlist);
        } catch(e) {
            logger.error(`Fatal error getting playlists by id: ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiUpdatePlaylist(req, res) {
        try {
            const updatedPlaylist = {
                _id: req.body._id,
                title: req.body.title,
                added_on: req.body.added_on,
                description: req.body.description,
                image_url: req.body.image_url
            };

            const updateResponse = await PlaylistDAO.updatePlaylist(updatedPlaylist);

            let { error } = updateResponse;
            if(error) {
                res.status(400).json({error});
                return;
            }

            if(updateResponse.modifiedCount === 0) {
                throw new Error(`Unable to update playlist: ${updatedPlaylist._id}`);
            }

            res.json({
                status: 'success',
                response: updateResponse
            });
        } catch(e) {
            logger.error(`Fatal error updating playlist: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiDeletePlaylist(req, res) {
        try {
            const playlistId = req.params.id || {};
            logger.debug(`delete playlist: ${playlistId}`);
            VideosDAO.deleteVideosByPlaylistId(playlistId)
            .then(data => {
                logger.info(`deleting playlist videos response: ${JSON.stringify(data, null, 2)}`);
                if(data.deletedCount < 1) {
                    logger.info('Playlist videos not found in DB!');
                }
                PlaylistDAO.deletePlaylist(playlistId).then(data => {
                    if(data.deletedCount < 1) {
                        res.status(404).json({
                            status: 'failure',
                            error: 'No playlist found for deletion'
                        });
                    } else {
                        logger.info("Deleted playlist after deleting it's videos!");
                        res.json({
                            status: 'success',
                            response: data
                        });
                    }
                }).catch(err => {
                    let msg = `Error deleting playlist: ${err.message}`;
                    logger.error(msg);
                    throw new Error(msg);
                })
            }).catch(err => {
                let msg = `Error deleting playlist videos: ${err.message}`;
                logger.error(msg);
                throw new Error(msg);
            })
        } catch(e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = PlaylistController;