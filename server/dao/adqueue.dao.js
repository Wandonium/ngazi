const { DateTime } = require('luxon');
const { isEmptyObject } = require('../util/util.js');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const logger = require('../util/logger');

let adverts;

class AdQueueDAO {
    static async injectDB(conn) {
        if(adverts) {
            return;
        }
        try {
            adverts = await conn.db(process.env.NGAZI_NS).collection('adqueue');
        } catch(e) {
            logger.error(`Unable to establish a connection to the adqueue collection in AdQueueDAO: ${e}`);
        }
    }

    static async addAdQueueAdvert(
        ad_id,
        deviceId,
        addedOn
    ) {

        try {
            const adqueueAdvert = {
                advert_id: ObjectId(ad_id),
                device_id: deviceId,    // this is an array of device ids
                added_on: addedOn
            };
            return await adverts.insertOne(adqueueAdvert);
        } catch(e) {
            logger.error(`Unable to create a new adqueue advert: ${e}`);
            return { error: e };
        }
    }

    static async getAdQueueAdverts({
        filters = null,
        page = 0,
        advertsPerPage = 20,
    } = {}) {
        let query = {};
        let errorList = {};
        if(filters) {
            // logger.log('filters in adqueue dao: ', filters);
            if('ad_id' in filters) {
                query = {'advert_id': ObjectId(filters['ad_id'])};
            } else if('deviceId' in filters) {
                query = {'device_id': filters['deviceId']};
            } else if('addedOn' in filters) {
                let date = DateTime.fromISO(filters['addedOn']);
                let offset = DateTime.utc().toLocal().offset;
                if(date.isValid) {
                    let from = new Date(date.set({hour: 0}).plus({minutes: offset}).toString());
                    let to = new Date(date.set({hour: 24}).plus({minutes: offset}).toString());
                    logger.debug(`hour: ${date.hour}`);
                    logger.debug(`date: ${date.toString()}`);
                    query = {'added_on': {$gte: from, $lte: to}};
                } else {
                    errorList.addedOnError = date.invalidReason
                }
            }
        }
        // logger.log('query: ', query);

        let cursor;
        try {
            cursor = await adverts.find(query);
        } catch(e) {
            logger.error(`Unable to find adqueue adverts in db: ${e}`);
            return { advertsList: [], totalNumAdverts: 0 };
        }

        const displayCursor = cursor.limit(advertsPerPage).skip(advertsPerPage * page);

        try {
            const advertsList = await displayCursor.toArray();
            const totalNumAdverts = await adverts.countDocuments(query);
            if(isEmptyObject(errorList)) {
                return { advertsList, totalNumAdverts, errors: errorList };
            } else {
                return {
                    advertsList: [],
                    totalNumAdverts: 0,
                    errors: errorList
                };
            }
        } catch(e) {
            logger.error(`Unable to convert cursor to array or error counting adqueue advert documents: ${e}`);
            return { advertsList: [], totalNumAdverts: 0 };
        }
    }

    static async getAdQueueAdvertsById(adQueueId) {
        try {
            let readResponse = await adverts.findOne({_id: ObjectId(adQueueId)});
            return readResponse;
        } catch(e) {
            logger.error(`Unable to find adqueue advert document by advert id: ${e}`);
            return { error: e };
        }
    }

    static async updateAdQueueAdvert(updatedAdvert) {
        try {
            const updateResponse = await adverts.updateOne(
                {_id: ObjectId(updatedAdvert._id)},
                {
                    // no need to update advert_id or added_on 
                    // since these are added by the system and
                    // should be maintained as such.
                    $set: {
                        // advert_id: updatedAdvert.advert_id,
                        device_id: updatedAdvert.device_id
                        // added_on: updatedAdvert.added_on
                    }
                }
            );
            return updateResponse;
        } catch(e) {
            logger.error(`Unable to update adqueue advert: ${e}`);
            return { error: e };
        }
    }
    
    static async deleteAdQueueAdvert(adId) {
        try {
            return await adverts.deleteOne({advert_id: ObjectId(adId)});
        } catch(e) {
            logger.error(`Unable to delete adqueue advert: ${e}`);
            return { error: e };
        }
    }

    static async deleteAdQueueByDevice(deviceId) {
        try {
            return await adverts.deleteMany({device_id: deviceId});
        } catch(e) {
            logger.error(`Unable to delete adqueue advert by device id: ${e}`);
            return { error: e };
        }
    }
}

module.exports = AdQueueDAO;