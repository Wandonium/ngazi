const VideosDAO = require('../dao/video.dao.js');
const { getDate } = require('../util/util.js');
const logger = require('../util/logger');

class MusicVideosController {
    static async apiPostVideo(req, res, next) {
        try {
            const postResponse = await VideosDAO.addVideos(
                null,
                req.body.playlist_id,
                req.body.title,
                req.body.description,
                req.body.image_url,
                req.body.url,
                req.body.duration,
                req.body.width,
                req.body.height,
                'TV',
                req.body.added_by,
                getDate()
            );
            res.status(200).json({
                status: 'success',
                postResponse
            });
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }

    static async apiGetVideos(req, res, next) {
        const perPage = req.query.videosPerPage;
        const mPage = req.query.page;
        const videosPerPage = perPage ? parseInt(perPage, 10) : 20;
        const page = mPage ? parseInt(mPage, 10) : 0;

        let filters = {};
        if(req.query.url) {
            filters.url = req.query.url;
        } else if(req.query.playlistId) {
            filters.playlistId = req.query.playlistId;
        } else if(req.query.added_by) {
            filters.addedBy = req.query.added_by;
        } else if(req.query.title) {
            filters.title = req.query.title;
        } else {
            filters.advertId = null;
        }

        try {
            const {videosList, totalNumVideos} = await VideosDAO.getVideos({
                filters,
                page,
                videosPerPage
            });

            let response = {
                videos: videosList,
                page,
                filters,
                entries_per_page: videosPerPage,
                total_results: totalNumVideos
            };

            res.json(response);
        } catch(e) {
            logger.error(`Fatal error getting music videos: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiGetVideoById(req, res, next) {
        try {
            let id = req.params.id || {};
            logger.debug(`music video id: ${id}`);
            let video = await VideosDAO.getVideosById(id);
            if(!video) {
                res.status(404).json({error: 'Video not found'});
                return;
            }
            res.json(video);
        } catch(e) {
            logger.error(`Fatal error getting music video by id: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiUpdateVideo(req, res, next) {
        try {
            const updatedVideo = {
                _id: req.body._id,
                advert_id: req.body.advert_id,
                playlist_id: req.body.playlist_id,
                title: req.body.title,
                description: req.body.description,
                image_url: req.body.image_url,
                url: req.body.url,
                duration: req.body.duration,
                width: req.body.width,
                height: req.body.height,
                viewport: req.body.viewport,
                added_by: req.body.added_by,
                added_on: req.body.added_on, 
            };
            const updateResponse = await VideosDAO.updateVideos(updatedVideo);

            let { error } = updateResponse;
            if(error) {
                res.status(400).json({error});
                return;
            }

            if(updateResponse.modifiedCount === 0) {
                throw new Error(`Unable to update video: ${updatedVideo._id}`);
            }

            res.json({
                status: 'success',
                response: updateResponse
            });
        } catch(e) {
            logger.error(`Fatal error updating music video: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiDeleteVideo(req, res, next) {
        try {
            const videoId = req.params.id || {};
            logger.debug(`deleting music video: ${videoId}`);
            const deleteResponse = await VideosDAO.deleteVideo(videoId);
            res.json({
                status: 'success',
                response: deleteResponse
            });
        } catch(e) {
            logger.error(`Fatal error deleting music video: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = MusicVideosController;