const AdViewsDAO = require("../dao/adviews.dao.js");
const { getDate } = require('../util/util.js');
const { DateTime } = require('luxon');
const logger = require('../util/logger');

class AdViewsController {
    static async apiPostAdViews(req, res, next) {
        try {
            const adId = req.body.adId;
            const userId = req.body.userId;
            const deviceId = req.body.deviceId;
            const adviewType = req.body.type;
            const viewedAt = new Date(getDate().toString());
            logger.info(`viewedAt: ${viewedAt}`);
            logger.info(`req.body: ${JSON.stringify(req.body, null, 2)}`);

            const adViewResponse = await AdViewsDAO.addAdView(
                adId,
                viewedAt,
                userId,
                deviceId,
                adviewType
            );
            res.json({status: 'success', postResponse: adViewResponse});
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }

    static async apiGetAdViews(req, res, next) {
        let viewsPerPage = req.query.adViewsPerPage;
        let mPage = req.query.page;
        const adViewsPerPage = viewsPerPage ? parseInt(viewsPerPage, 10) : 20;
        const page = mPage ? parseInt(mPage, 10) : 0;
        let from = DateTime.fromISO(req.query.from);
        let to = DateTime.fromISO(req.query.to);

        logger.debug(`req.query.from: ${req.query.from}`);
        logger.debug(`req.query.to: ${req.query.to}`);

        const date = DateTime.utc().toLocal();
        const offset = date.offset;
        if(from.isValid && to.isValid){
            let fromUTC = from.plus({minutes: offset});
            from = new Date(fromUTC.toString());
            // logger.log('from input: ', from.toString());

            let toUTC = to.plus({minutes: offset});
            to = new Date(toUTC.toString());
            // logger.log('to input: ', to.toString());
        } else {
            logger.error('One of the Date inputs is not a valid date. System will use a default date instead');
            logger.error(`from date input: ${from}`);
            logger.error(`from invalid reason: ${from.invalidReason}`);
            logger.error(`to date input: ${to}`);
            logger.error(`to invalid reason: ${to.invalidReason}`);
            from = null;
            to = null;
        }

        let filters = {};
        if(req.query.adId) {
            filters.adId = req.query.adId;
        } else if(req.query.userId) {
            filters.userId = req.query.userId;
        } else if(req.query.deviceId) {
            filters.deviceId = req.query.deviceId;
        }

        const {adViewsList, totalNumAdViews} = await AdViewsDAO.getAdViews({
            filters,
            from,
            to,
            page,
            adViewsPerPage
        });

        let response = {
            adViews: adViewsList,
            page: page,
            filters: filters,
            entries_per_page: adViewsPerPage,
            total_results: totalNumAdViews,
        }
        res.json(response);
    }

    static async apiGetAdViewsById(req, res, next) {
        try {
            let id = req.params.id || {};
            logger.debug(`id: ${id}`);
            let adView = await AdViewsDAO.getAdViewsById(id);
            if(!adView) {
                res.status(404).json({error: 'Not Found'});
                return;
            }
            res.json(adView);
        } catch(e) {
            logger.error(`api error, ${e}`);
            res.status(500).json({error: e});
        }
    }

    static async apiUpdateAdViews(req, res, next) {
        try {
            const adViewId = req.body.adViewId;
            const adId = req.body.adId;
            // const viewedAt = new Date();
            const userId = req.body.userId;
            const deviceId = req.body.deviceId;

            const adViewResponse = await AdViewsDAO.updateAdViews(
                adViewId,
                adId,
                // viewedAt,
                userId,
                deviceId
            )

            var { error } = adViewResponse;
            if(error) {
                res.status(400).json({error});
            }

            if(adViewResponse.modifiedCount === 0) {
                throw new Error(
                    `Unable to update adView with id: ${adViewId}`
                );
            }
            res.json({status: 'success', updateResponse: adViewResponse});
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }

    static async apiDeleteAdView(req, res, next) {
        try {
            const adViewId = req.params.id;
            logger.debug(`adViewId: ${adViewId}`);
            const adViewResponse = await AdViewsDAO.deleteAdView(adViewId);
            res.json({status: 'success', deleteResponse: adViewResponse});
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }
    
    static async apiDeleteAdViews(req, res, next) {
        try {
            const userId = req.params.userId;
            const adViewResponse = await AdViewsDAO.deleteAdViews(userId);
            res.json({status: 'success', deleteResponse: adViewResponse});
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }
}

module.exports = AdViewsController;