const mongodb = require('mongodb');
const logger = require('../util/logger');
const ObjectId = mongodb.ObjectId;

let videos;

class VideosDAO {
    static async injectDB(conn) {
        if(videos) {
            return;
        }
        try {
            videos = await conn.db(process.env.NGAZI_NS).collection('videos');
        } catch(e) {
            logger.error(`Unable to establish a connection to the videos collection in VideosDAO: ${e}`);
        }
    }

    static async addVideos(
        advertId,
        playlistId,
        title,
        description,
        image_url,
        url,
        duration,
        width,
        height,
        viewport,
        addedBy,
        addedOn
    ) {
        try {
            const videoDoc = {
                advert_id: advertId,
                playlist_id: playlistId,
                title: title,
                description: description,
                image_url: image_url,
                url: url,
                duration: duration,
                width: width,
                height: height,
                viewport: viewport,
                added_by: ObjectId(addedBy),
                added_on: addedOn
            }
            return await videos.insertOne(videoDoc);
        } catch(e) {
            logger.error(`Unable to create new video: ${e}`);
            return {error: e};
        }
    }

    static async getVideos({
        filters = null,
        page = 0,
        videosPerPage = 20,
    } = {}) {
        let query = {};
        if(filters) {
            if('advertId' in filters) {
                query = {'advert_id': {$eq: filters['advertId']}};
            } else if('url' in filters) {
                query = {$text: {$search: `"${filters['url']}"`}};
            } else if('addedBy' in filters) {
                query = {'added_by': {$eq: ObjectId(filters['addedBy'])}};
            } else if('title' in filters) {
                query = {$text: {$search: filters['title']}};
            } else if('playlistId' in filters) {
                query = {'playlist_id': {$eq: filters['playlistId']}};
            }
        }

        let cursor;
        try {
            cursor = await videos.find(query);
        } catch(e) {
            logger.error(`Unable to find videos in db: ${e}`);
            return { videosList: [], totalNumVideos: 0 };
        }

        const displayCursor = cursor.limit(videosPerPage).skip(videosPerPage * page);

        try {
            const videosList = await displayCursor.toArray();
            const totalNumVideos = await videos.countDocuments(query);
            return { videosList, totalNumVideos };
        } catch(e) {
            logger.error(`Unable to convert cursor to array or problem counting video documents: ${e}`);
            return { videosList:[], totalNumVideos: 0 };
        }
    }

    static async getVideosById(videoId) {
        try {
            let readResponse = await videos.findOne({ _id: ObjectId(videoId) });
            return readResponse;
        } catch(e) {
            logger.error(`Unable to find video document by id: ${e}`);
            return { error: e };
        }
    }

    static async updateVideos(updatedVideo) {
        try {
            const updateResponse = await videos.updateOne(
                {_id: ObjectId(updatedVideo._id)},
                {
                    $set: {
                       advert_id: updatedVideo.advert_id,
                       playlist_id: updatedVideo.playlist_id,
                       title: updatedVideo.title,
                       description: updatedVideo.description,
                       image_url: updatedVideo.image_url,
                       url: updatedVideo.url,
                       duration: updatedVideo.duration,
                       width: updatedVideo.width,
                       height: updatedVideo.height,
                       viewport: updatedVideo.viewport,
                       added_by: updatedVideo.added_by,
                       added_on: updatedVideo.added_on, 
                    }
                }
            );
            logger.debug(`updateResponse: ${JSON.stringify(updateResponse, null, 2)}`);
            return updateResponse;
        } catch(e) {
            logger.error(`Unable to update video: ${e}`);
            return { error: e };
        }
    }

    static async deleteVideo(videoId) {
        try {
            const deleteResponse = await videos.deleteOne({_id: ObjectId(videoId)});
            return deleteResponse;
        } catch(e) {
            logger.error(`Unable to delete video: ${e}`);
            return { error: e };
        }
    }

    static async deleteVideosByAdvertId(advertId) {
        try {
            const deleteResponse = await videos.deleteMany({advert_id: ObjectId(advertId)});
            return deleteResponse;
        } catch(e) {
            logger.error(`Unable to delete videos for advert: ${e}`);
            return { error: e };
        }
    }

    static async deleteVideosByPlaylistId(playlistId) {
        try {
            const deleteResponse = await videos.deleteMany({playlist_id: playlistId});
            return deleteResponse;
        } catch(e) {
            logger.error(`Unable to delete video for playlist: ${e}`);
            return { error: e };
        }
    }
}

module.exports = VideosDAO;