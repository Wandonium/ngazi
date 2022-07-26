const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const logger = require('../util/logger');
const getDate = require('../util/util');
const { DateTime } = require("luxon");

let logins;

class AndroidAppLogins {
    static async injectDB(conn) {
        if(logins) {
            return;
        }

        try {
            logins = await conn.db(process.env.NGAZI_NS).collection('androidAppLogins');
        } catch(e) {
            logger.error(`Unable to establish a connection to the androidAppLogins collection in AndroidAppLogins: ${e}`);
        }
    }

    static async addAndroidAppLogin(deviceId) {
        try {
            const androidAppLogin = {
                device_id: ObjectId(deviceId),
                logged_in_at: getDate()
            };
            return await logins.insertOne(androidAppLogin);
        } catch(e) {
            logger.error(`Unable to create a new androidAppLogin: ${e}`);
            return { error: e };
        }
    }

    static async getAllAndroidAppLogins({
        deviceId = "",
        page = 0,
        loginsPerPage = 20
    } = {}) {
        try {
            cursor = await logins.find({'device_id': deviceId});
        } catch(e) {
            logger.error(`Unable to find androidApp logins in db: ${e}`)
            return { loginsList: [], totalNumLogins: 0 };
        }

        const displayCursor = cursor.limit(loginsPerPage).skip(loginsPerPage * page);

        try {
            const loginsList = await displayCursor.toArray();
            const totalNumLogins = await logins.countDocuments({});
            return { loginsList, totalNumLogins };
        } catch(e) {
            logger.error(`Unable to convert cursor to array or error counting androidApp login documents: ${e}`);
            return { loginsList: [], totalNumLogins: 0 };
        }
    }

    static async getCurrentDayLogins({
        deviceId = "",
        page = 0,
        loginsPerPage = 20
    } = {}) {
        let dt = DateTime.now();
        const offset = dt.offset;
        const from = new Date(dt.set({hour: 0}).plus({minutes: offset}).toString());
        const to = new Date(dt.set({hour: 24}).plus({minutes: offset}).toString());

        logger.debug(`from : ${from}`);
        logger.debug(`to : ${to}`);

        let query = {
            $and: [
                {"device_id": {$eq: ObjectId(deviceId)}},
                {'logged_in_at': {$gte: from, $lte: to}}
            ]
        };
        logger.debug(`query: ${query}`);

        let cursor;
        try {
            cursor = await logins.find(query);
        } catch(e) {
            logger.error(`Unable to find android app logins in db: ${e}`);
            return { loginsList: [], totalNumLogins: 0 };
        }

        const displayCursor = cursor.limit(loginsPerPage).skip(loginsPerPage * page);

        try {
            const loginsList = await displayCursor.toArray();
            const totalNumLogins = await logins.countDocuments(query);
            return { loginsList, totalNumLogins };
        } catch(e) {
            logger.error(`Unable to convert cursor to array or error counting android app login documents: ${e}`);
            return { loginsList: [], totalNumLogins: 0 };
        }
    }
    
    static async getCurrentMonthLogins({
        deviceId = "",
        page = 0,
        loginsPerPage = 20
    } = {}) {
        let dt = DateTime.now();
        const offset = dt.offset;
        const from = new Date(dt.set({day: 1}).plus({minutes: offset}).toString());
        const to = new Date(dt
            .set({day: 1})
            .plus({days: dt.daysInMonth})
            .plus({minutes: offset})
            .toString()
        );

        logger.debug(`from : ${from}`);
        logger.debug(`to : ${to}`);

        let query = {
            $and: [
                {"device_id": {$eq: ObjectId(deviceId)}},
                {'logged_in_at': {$gte: from, $lte: to}}
            ]
        };
        logger.debug(`query: ${query}`);

        let cursor;
        try {
            cursor = await logins.find(query);
        } catch(e) {
            logger.error(`Unable to find android app logins in db: ${e}`);
            return { loginsList: [], totalNumLogins: 0 };
        }

        const displayCursor = cursor.limit(loginsPerPage).skip(loginsPerPage * page);

        try {
            const loginsList = await displayCursor.toArray();
            const totalNumLogins = await logins.countDocuments(query);
            return { loginsList, totalNumLogins };
        } catch(e) {
            logger.error(`Unable to convert cursor to array or error counting android app login documents: ${e}`);
            return { loginsList: [], totalNumLogins: 0 };
        }
    }

    static async getAppLoginById(loginId) {
        try {
            let loginResponse = await logins.findOne({ _id: ObjectId(loginId) });
            return loginResponse;
        } catch(e) {
            logger.error(`Unable to find login document by id: ${e}`);
            return { error: e };
        }
    }

    static async updateLogins(updatedLogin) {
        try {
            const updateResponse = await logins.updateOne(
                {_id: ObjectId(updatedLogin._id)},
                {$set: {
                    device_id: updatedLogin.device_id,
                    logged_in_at: updatedLogin.logged_in_at
                }}
            );
            return updateResponse;
        } catch(e) {
            logger.error(`Unable to update android app logins: ${e}`);
            return { error: e };
        }
    }

    static async deleteAndroidAppLogins(loginId) {
        try {
            return await logins.deleteOne({ _id: ObjectId(loginId) });
        } catch(e) {
            logger.error(`Unable to delete android app login: ${e}`);
            return { error: e };
        }
    }

    static async deleteLoginsByDeviceId(deviceId) {
        try {
            return await logins.deleteMany({ device_id: ObjectId(deviceId) });
        } catch(e) {
            logger.error(`Unable to delete android app logins by device id: ${e}`);
            return { error: e };
        }
    }
}

module.exports = AndroidAppLogins;