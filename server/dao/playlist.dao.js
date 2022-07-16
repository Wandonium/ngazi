const mongodb = require('mongodb');
const logger = require('../util/logger');
const ObjectId = mongodb.ObjectId;

let playlists;

class PlaylistDAO {
    static async injectDB(conn) {
        if(playlists) {
            return;
        }

        try {
            playlists = await conn.db(process.env.NGAZI_NS).collection('playlists');
        } catch(e) {
            logger.error(`Unable to establish a connection to the playlists collection in PlaylistDAO: ${e}`);
        }
    }

    static async addPlaylist(newPlaylist) {
        try {
            const playlistDoc = {
                title: newPlaylist.title,
                added_on: newPlaylist.added_on,
                description: newPlaylist.description,
                image_url: newPlaylist.image_url
            };
            return await playlists.insertOne(playlistDoc);
        } catch(e) {
            logger.error(`Unable to create new playlist: ${e}`);
            return { error: e };
        }
    }

    static async getPlaylists({
        filters = null,
        page = 0,
        playlistsPerPage = 20,
    } = {}) {
        let query = {};
        if(filters) {
            if('title' in filters) {
                query = {'$text': {$search: filters['title']}};
            } else if('image_url' in filters) {
                query = {'image_url': {$eq: filters['image_url']}};
            }
        }

        let cursor;
        try {
            cursor = await playlists.find(query);
        } catch(e) {
            logger.error(`Unable to find playlists in db: ${e}`);
            return { playlistList: [], totalNumPlaylists: 0 };
        }

        const displayCursor = cursor.limit(playlistsPerPage).skip(playlistsPerPage * page);

        try {
            const playlistList = await displayCursor.toArray();
            const totalNumPlaylists = await playlists.countDocuments(query);
            return { playlistList, totalNumPlaylists };
        } catch(e) {
            logger.error(`Unable to convert cursor to array or problem counting playlist documents: ${e}`);
            return { playlistList: [], totalNumPlaylists: 0 };
        }
    }

    static async getPlaylistById(playlistId) {
        try {
            const pipeline = [
                {
                    $match: {
                        _id: new ObjectId(playlistId),
                    },
                },
                {
                    $lookup: {
                        from: 'videos',
                        let: {
                            id: '$_id',
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$playlist_id', playlistId],
                                    },
                                },
                            },
                            {
                                $sort: {
                                    added_on: -1,
                                },
                            },
                        ],
                        as: 'music_videos',
                    }
                },
                {
                    $addFields: {
                        music_videos: '$music_videos',
                    },
                }
            ];
            return await playlists.aggregate(pipeline).next();
        } catch(e) {
            logger.error(`Something went wrong in getAdvertsById: ${e}`);
            throw e;
        }
    }

    static async updatePlaylist(updatedPlaylist) {
        try {
            const updateResponse = await playlists.updateOne(
                {_id: ObjectId(updatedPlaylist._id)},
                {
                    $set: {
                        title: updatedPlaylist.title,
                        added_on: updatedPlaylist.added_on,
                        description: updatedPlaylist.description,
                        image_url: updatedPlaylist.image_url
                    }
                }
            );
            return updateResponse;
        } catch(e) {
            logger.error(`Unable to update playlist: ${e}`);
            return { error: e };
        }
    }

    static async deletePlaylist(id) {
        try {
            return await playlists.deleteOne({_id: ObjectId(id)});
        } catch(e) {
            logger.error(`Unable to delete playlist: ${e}`);
            return { error: e };
        }
    }
}

module.exports = PlaylistDAO;