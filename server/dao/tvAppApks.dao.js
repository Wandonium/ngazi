const mongodb = require('mongodb');
const logger = require('../util/logger');
const ObjectId = mongodb.ObjectId;

let tvAppApks;

class TvAppApksDAO {
    static async injectDB(conn) {
        if(tvAppApks) {
            return;
        }

        try {
            tvAppApks = await conn.db(process.env.NGAZI_NS).collection('tvAppApks');
        } catch(e) {
            logger.error(`Unable to establish a connection to the TvAppApks collection in TvAppApksDAO: ${e}`);
        }
    }

    static async addTvAppApk(newTvAppApk) {
        try {
            const tvAppApkDoc = {
                version_code: newTvAppApk.version_code,
                filename: newTvAppApk.filename,
                system_filename: newTvAppApk.system_filename,
                apk_url: newTvAppApk.apk_url,
                added_on: newTvAppApk.added_on,
                added_by: newTvAppApk.added_by
            };
            return await tvAppApks.insertOne(tvAppApkDoc);
        } catch(e) {
            logger.error(`Unable to create a new tvAppApk doc: ${e}`);
            return { error: e };
        }
    }

    static async getTvAppApks({
        filters = null,
        page = 0,
        tvAppApksPerPage = 20,
    } = {}) {
        let query = {};
        logger.debug(`filters: ${JSON.stringify(filters, null, 2)}`);
        if(filters) {
            if('version_code' in filters) {
                query = {'version_code': {$eq: filters['version_code']}};
            } else if('filename' in filters) {
                query = {'filename': {$eq: filters['filename']}};
            } else if('system_filename' in filters) {
                query = {'system_filename': {$eq: filters['system_filename']}};
            } else if('apk_url' in filters) {
                query = {'apk_url': {$eq: filters['apk_url']}};
            } else if('added_on' in filters) {
                query = {'added_on': {$gte: filters['added_on']}};
            } else if('added_by' in filters) {
                query = {'added_by': {$eq: filters['added_by']}};
            }
        }

        let cursor;
        try {
            cursor = await tvAppApks.find(query);
        } catch(e) {
            logger.error(`Unable to find tvAppApk docs in db: ${e}`);
            return { tvAppApkList: [], totalNumTvAppApks: 0 };
        }

        const displayCursor = cursor.limit(tvAppApksPerPage).skip(tvAppApksPerPage * page);

        try {
            const tvAppApkList = await displayCursor.toArray();
            const totalNumTvAppApks = await tvAppApks.countDocuments(query);
            return { tvAppApkList, totalNumTvAppApks };
        } catch(e) {
            logger.error(`Unable to convert cursor to array or error counting tvAppApk documents: ${e}`);
            return { tvAppApkList: [], totalNumTvAppApks: 0 };
        }
    }

    static async getTvAppApkById(tvAppApkId) {
        try {
            return await tvAppApks.findOne({_id: ObjectId(tvAppApkId)});
        } catch(e) {
            logger.error(`Unable to find tvAppApk document by id: ${e}`);
            return { error: e };
        }
    }

    static async getLatestTvAppApk() {
        try {
            return await tvAppApks.find({}).sort({"added_on": -1}).toArray();
        } catch(e) {
            logger.error(`Unable to get all tvAppApks sorted by latest: ${e}`);
            return { error: e };
        }
    }

    static async updateTvAppApk(updatedTvAppApk) {
        try {
            const updateResponse = await tvAppApks.updateOne(
                { _id: ObjectId(updatedTvAppApk._id) },
                {
                    $set: {
                        version_code: updatedTvAppApk.version_code,
                        filename: updatedTvAppApk.filename,
                        system_filename: updatedTvAppApk.system_filename,
                        apk_url: updatedTvAppApk.apk_url,
                        // added_on: updatedTvAppApk.added_on,
                        added_by: updatedTvAppApk.added_by
                    }
                }
            );
            return updateResponse;
        } catch (e) {
            logger.error(`Unable to update tvAppApk doc: ${e}`);
            return { error: e };
        }
    }

    static async deleteTvAppApk(tvAppApkId) {
        try {
            return await tvAppApks.deleteOne({ _id: ObjectId(tvAppApkId) });
        } catch(e) {
            logger.error(`Unable to delete tvAppApk doc: ${e}`);
            return { error: e };
        }
    }
}

module.exports = TvAppApksDAO