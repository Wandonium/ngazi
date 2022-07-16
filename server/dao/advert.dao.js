const { DateTime } = require('luxon');
const { isEmptyObject } = require('../util/util.js');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const logger = require('../util/logger');

let adverts;

class AdvertsDAO {
    static async injectDB(conn) {
        if(adverts){
            return;
        }
        try {
            adverts = await conn.db(process.env.NGAZI_NS).collection('adverts');
        } catch(e) {
            logger.error(`Unable to establish a connection to the adverts collection in AdvertsDAO: ${e}`);
        }
    }

    static async addAdvert(
        name,
        desc,
        status,
        startTime,
        endTime,
        clientId
    ) {
        try {
            const advertDoc = {
                name: name,
                description: desc,
                status: status,
                campaign_start: startTime,
                campaign_end: endTime,
                client_id: ObjectId(clientId)
            }
            return await adverts.insertOne(advertDoc);
        } catch(e) {
            logger.error(`Unable to create new advert: ${e}`);
            return { error: e };
        }
    }

    static async getAdverts({
        filters = null,
        page = 0,
        advertsPerPage = 20,
    } = {}) {
        let query = {};
        let errorList = {};
        if(filters) {
            let offset = DateTime.utc().toLocal().offset;
            if('status' in filters) {
                query = {'status': {$eq: filters['status']}};
            } else if('startTime' in filters) {
                let date = DateTime.fromISO(filters['startTime']);
                if(date.isValid) {
                    let cDate = new Date(date.plus({minutes:offset}).toString());
                    // logger.debug(`hour: ${date.hour}`);
                    // logger.debug(`date: ${date.toString()}`);
                    // logger.debug(`cDate: ${cDate}`);
                    query = {'campaign_start': {$gte: cDate}}
                } else {
                    errorList.startTimeError = date.invalidReason;
                }
            } else if('endTime' in filters) {
                let date = DateTime.fromISO(filters['endTime']);
                if(date.isValid) {
                    let theDate = date.hour === 0 ? date.set({hour: 24}) : date;
                    let cDate = new Date(theDate.plus({minutes:offset}).toString());
                    // logger.debug(`hour: ${date.hour}`);
                    // logger.debug(`date: ${date.toString()}`);
                    // logger.debug(`cDate: ${cDate}`);
                    query = {'campaign_end': {$lte: cDate}}
                } else {
                    errorList.endTimeError = date.invalidReason;
                }
            } else if('clientId' in filters) {
                query = {'client_id': ObjectId(filters['clientId'])};
            }
        }

        let cursor;
        try {
            cursor = await adverts.find(query);
        } catch(e) {
            logger.error(`Unable to issue find command for adverts: ${e}`);
            return { advertsList: [], totalNumAdverts: 0 };
        }

        const displayCursor = cursor.limit(advertsPerPage).skip(advertsPerPage * page);

        try {
            const advertsList = await displayCursor.toArray();
            const totalNumAdverts = await adverts.countDocuments(query);
            if(isEmptyObject(errorList)) {
                return { 
                    advertsList, 
                    totalNumAdverts, 
                    errors: errorList
                }
            } else {
                return {
                    advertsList: [],
                    totalNumAdverts: 0,
                    errors: errorList
                }
            }
        } catch(e) {
            logger.error(`Unable to convert cursor to array or problem counting advert documents: ${e}`);
            return { advertsList: [], totalNumAdverts: 0 };
        }
    }

    static async getAdvertsById(id) {
        try {
            const pipeline = [
                {
                    $match: {
                        _id: new ObjectId(id),
                    },
                },
                {
                    $lookup: {
                        from: 'images',
                        let: {
                            id: "$_id",
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$advert_id", "$$id"],
                                        // $eq: ["$advert_id", id],
                                    },
                                },
                            },
                            {
                                $sort: {
                                    added_on: -1,
                                },
                            },
                        ],
                        as: 'ad_images',
                    }
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
                                        $eq: ['$advert_id', id],
                                    },
                                },
                            },
                            {
                                $sort: {
                                    added_on: -1,
                                },
                            },
                        ],
                        as: 'ad_videos',
                    }
                },
                {
                    $addFields: {
                        ad_images: "$ad_images",
                        ad_videos: '$ad_videos',
                    },
                }
            ]
            return await adverts.aggregate(pipeline).next();
        } catch(e) {
            logger.error(`Something went wrong in getAdvertsById: ${e}`);
            throw e;
        }
    }

    static async updateAdvert(updatedAdvert) {
        try {
            const updateResponse = await adverts.updateOne(
                {_id: ObjectId(updatedAdvert._id)},
                {
                    $set: {
                        name: updatedAdvert.name,
                        description: updatedAdvert.description,
                       status: updatedAdvert.status,
                       campaign_start: updatedAdvert.campaign_start,
                       campaign_end: updatedAdvert.campaign_end,
                       client_id: updatedAdvert.client_id, 
                    }
                }
            );
            return updateResponse;
        } catch(e) {
            logger.error(`Unable to update advert: ${e}`);
            return { error: e };
        }
    }

    static async deleteAdvert(id) {
        try {
            const deleteResponse = await adverts.deleteOne({_id: ObjectId(id)});
            return deleteResponse;
        } catch(e) {
            logger.error(`Unable to delete advert: ${e}`);
            return { error: e };
        }
    }
}

module.exports = AdvertsDAO;