const AndroidAppLogins = require('../dao/androidAppLogins.js');
const logger = require('../util/logger');
const { getDate, isNullUndefined } = require('../util/util');

class AndroidAppLoginsController {
    static async apiPostLogin(req, res, next) {
        try {
            const deviceId = req.body.deviceId;
            const loggedInAt = getDate();
            logger.debug(`loggedInAt: ${loggedInAt}`);

            const loginResponse = await AndroidAppLogins.addAndroidAppLogin(deviceId);
            res.json({status: 'success', postResponse: loginResponse});
        } catch(e) {
            logger.error(`Fatal error creating android app login: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiGetAllLogins(req, res, next) {
        const deviceId = req.query.deviceId;
        const period = req.query.period;
        const perPage = req.query.loginsPerPage;
        const mPage = req.query.page;
        const loginsPerPage = perPage ? parseInt(perPage, 10) : 20;
        const page = mPage ? parseInt(mPage, 10) : 0;

        let params = { deviceId, loginsPerPage, page };
        let data;

        try {
            logger.debug(`period: ${period}`);
            logger.debug(`params: ${JSON.stringify(params, null, 2)}`);
            if(isNullUndefined(period)) {
                logger.debug('using getAllAndroidAppLogins');
                data = await AndroidAppLogins.getAllAndroidAppLogins(params);
            } else if(period === 'day') {
                logger.debug('using getCurrentDayLogins');
                data = await AndroidAppLogins.getCurrentDayLogins(params);
            } else if(period === 'month') {
                logger.debug('using getCurrentMonthLogins');
                data = await AndroidAppLogins.getCurrentMonthLogins(params);
            } else {
                let msg = 'Fatal error! Wrong period input!';
                logger.error(msg);
                res.status(500).json({ error: msg });
                return;
            }


            const { loginsList, totalNumLogins } = data;

            let response = {
                logins: loginsList,
                page,
                entries_per_page: loginsPerPage,
                total_results: totalNumLogins
            };

            res.json(response);
        } catch(e) {
            logger.error(`Fatal error getting all android app logins for device: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiGetLoginById(req, res, next) {
        try {
            let id = req.params.id || {};
            logger.debug(`login id: ${id}`);
            let login = await AndroidAppLogins.getAppLoginById(id);
            if(!login) {
                res.status(404).json({error: 'Android App login not found!'});
                return;
            }
            res.json(login);
        } catch(e) {
            logger.error(`Fatal error getting android app login by id: ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiUpdateLogin(req, res, next) {
        try {
            const updatedLogin = {
                _id: req.body._id,
                device_id: req.body.device_id,
                logged_in_at: req.body.logged_in_at
            };
            const loginResponse = await AndroidAppLogins.updateLogins(updatedLogin);

            let { error } = loginResponse;
            if(error) {
                res.status(400).json({error});
                return;
            }

            if(loginResponse.modifiedCount === 0) {
                throw new Error(`Unable to update android app login: ${updatedlogin._id}`);
            }

            res.json({
                status: 'success',
                response: loginResponse
            });
        } catch(e) {
            logger.error(`Fatal error updating android app login: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiDeleteLogin(req, res, next) {
        try {
            const loginId = req.params.id || {};
            logger.debug(`loginId to delete: ${loginId}`);
            const loginResponse = await AndroidAppLogins.deleteAndroidAppLogins(loginId);
            res.json({ status: 'success', deleteResponse: loginResponse });
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }
    
    static async apiDeleteLoginsByDevice(req, res, next) {
        try {
            const deviceId = req.params.deviceId || {};
            logger.debug(`deviceId to delete logins by: ${deviceId}`);
            const loginResponse = await AndroidAppLogins.deleteLoginsByDeviceId(deviceId);
            res.json({ status: 'success', deleteResponse: loginResponse });
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }
}

module.exports = AndroidAppLoginsController;