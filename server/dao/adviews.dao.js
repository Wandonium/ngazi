const mongodb = require('mongodb');
const { DateTime } = require("luxon");
const logger = require('../util/logger');

const ObjectId = mongodb.ObjectId;

let adviews;

class AdViewDAO {
    static async injectDB(conn) {
        if(adviews) {
            return;
        }
        try {
            adviews = await conn.db(process.env.NGAZI_NS).collection('adviews');
        } catch(e) {
            logger.error(`Unable to establish a connection to the adviews collection in AdViewsDAO: ${e}`);
        }
    }

    static async addAdView (
        adId,
        viewedAt,
        userId,
        deviceId,
        adviewType
    ) {
        try {
            const adviewDoc = {
                ad_id: ObjectId(adId),
                viewed_at: viewedAt,
                user_id: ObjectId(userId),
                device_id: ObjectId(deviceId),
                type: adviewType
            };
            return await adviews.insertOne(adviewDoc);
        } catch(e) {
            logger.error(`Unable to create adview: ${e}`);
            return {error: e};
        }
    }

    static async getAdViews({
        filters = null,
        from = null,     
        to = null,
        page = 0,
        adViewsPerPage = 20,
    } = {}) {
        let dt = DateTime.now();
        const offset = dt.offset;
        if(from === null) {
            from = new Date(dt.set({hour: 4}).plus({minutes: offset}).toString());     // current day at 4am
        }
        if(to === null) {
            to = new Date(dt.set({hour: 22}).plus({minutes: offset}).toString());   // current day at 10pm
        }
        logger.debug(`from: ${from}`);
        logger.debug(`to: ${to}`);

        let query = {'viewed_at': {$gte: from, $lte: to}};
        if(filters) {
            if("adId" in filters) {
                query = {
                    $and: [
                        {"ad_id": {$eq: ObjectId(filters['adId'])}},
                        {"viewed_at": {$gte: from, $lte: to}}
                    ]
                };
            } else if("userId" in filters) {
                query = {
                    $and: [
                        {"user_id": {$eq: ObjectId(filters['userId'])}},
                        {"viewed_at": {$gte: from, $lte: to}}
                    ]
                };
            } else if("deviceId" in filters) {
                query = {
                    $and: [
                        {"device_id": {$eq: ObjectId(filters["deviceId"])}},
                        {"viewed_at": {$gte: from, $lte: to}}
                    ]
                };
            }
        }

        logger.debug(`query: ${query}`);

        let cursor;
        try {
            cursor = await adviews.find(query);
        } catch(e) {
            logger.error(`Unable to issue find command for adviews: ${e}`);
            return { adViewsList: [], totalNumAdViews: 0}
        }

        const displayCursor = cursor.limit(adViewsPerPage).skip(adViewsPerPage * page);

        try {
            const adViewsList = await displayCursor.toArray();
            const totalNumAdViews = await adviews.countDocuments(query);
            return {adViewsList, totalNumAdViews};
        } catch(e) {
            logger.error(`Unable to convert cursor to array or problem counting adview documents: ${e}`);
            return {adViewsList: [], totalNumAdViews: 0};
        }
    }

    static async getAdViewsById(adViewId) {
        try {
            let readResponse = await adviews.findOne({ _id: ObjectId(adViewId) });
            return readResponse;
        } catch(e) {
            logger.error(`Unable to find adview document by id: ${e}`);
            return {error: e};
        }
    }

    static async updateAdViews(
        adViewId,
        adId,
        // viewedAt,
        userId,
        deviceId
    ) {
        try {
            const updateResponse = await adviews.updateOne(
                {_id: ObjectId(adViewId)},
                {$set: {
                    ad_id: adId,
                    // viewed_at: viewedAt,
                    user_id: ObjectId(userId),
                    device_id: deviceId
                }}
            );
            return updateResponse;
        } catch(e) {
            logger.error(`Unable to update adview: ${e}`);
            return {error: e};
        }
    }

    static async deleteAdView(adViewId) {
        try {
            const deleteResponse = await adviews.deleteOne({
                _id: ObjectId(adViewId)
            });
            return deleteResponse;
        } catch(e) {
            logger.error(`Unable to delete adview: ${e}`);
            return {error: e};
        }
    }
    
    static async deleteAdViews(userId) {
        try {
            const deleteResponse = await adviews.deleteMany({
                user_id: ObjectId(userId)
            });
            return deleteResponse;
        } catch(e) {
            logger.error(`Unable to delete adview: ${e}`);
            return {error: e};
        }
    }
}

module.exports = AdViewDAO;