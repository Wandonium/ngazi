const AdQueueDAO = require('../dao/adqueue.dao.js');
const { isNullUndefined } = require('../util/util.js');
const logger = require('../util/logger');

class AdQueueController {
    static async apiGetAdQueue(req, res, next) {
        const perPage = req.query.adsPerPage;
        const mPage = req.query.page;
        const adsPerPage = perPage ? parseInt(perPage, 10) : 20;
        const page = mPage ? parseInt(mPage, 10) : 0;

        let filters = {};
        if(req.query.adId) {
            filters.ad_id = req.query.adId;
        } else if(req.query.deviceIds) {
            filters.deviceId = req.query.deviceIds;
        } else if(req.query.addedOn) {
            filters.addedOn = req.query.addedOn;
        }

        try {
            const { advertsList, totalNumAdverts, errors } = await AdQueueDAO.getAdQueueAdverts({
                filters,
                page,
                adsPerPage
            });

            let response = {
                adQueueAdverts: advertsList,
                page,
                filters,
                entries_per_page: adsPerPage,
                total_results: totalNumAdverts,
                errors
            }

            res.json(response);
        } catch(e) {
            logger.error(`Fatal error getting adQueue adverts: ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiGetAdQueueAdvertById(req, res, next) {
        try {
            let id = req.params.id || {};
            logger.debug(`adQueue advert id: ${id}`);
            let advert = await AdQueueDAO.getAdQueueAdvertsById(id);
            if(!advert) {
                res.status(404).json({error: 'Advert not found in AdQueue'});
                return;
            }

            res.json(advert);
        } catch(e) {
            logger.error(`Fatal error getting advert by id in AdQueue: ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiUpdateAdQueueAdvert(req, res, next) {
        try {
            const updatedAdQueueAdvert = {
                _id: req.body._id,
                advert_id: req.body.advert_id,
                device_id: req.body.device_id,
                added_on: req.body.added_on
            };
            const adQueueResponse = await AdQueueDAO.updateAdQueueAdvert(updatedAdQueueAdvert);

            let { error } = adQueueResponse;
            if(error) {
                res.status(400).json({error});
                return ;
            }

            if(adQueueResponse.modifiedCount === 0) {
                throw new Error(`Unable to update adQueue advert: ${updatedAdQueueAdvert._id}`);
            }

            res.json({
                status: 'success',
                response: adQueueResponse
            });
        } catch(e) {
            logger.error(`Fatal error updating adQueue advert: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiDeleteAdQueueAdvert(req, res, next) {
        try {
            const advertId = req.query.advertId;
            const deviceId = req.query.deviceId;
            // const adQueueResponse = await AdQueueDAO.deleteAdQueueAdvert(advertId);

            let adQueueResponse;
            if(!isNullUndefined(advertId)) {
                logger.debug(`deleting adQueue advert: ${advertId}`);
                adQueueResponse = await AdQueueDAO.deleteAdQueueAdvert(advertId);
            } else if(!isNullUndefined(deviceId)) {
                logger.debug(`deleting adQueue advert by device: ${deviceId}`);
                adQueueResponse = await AdQueueDAO.deleteAdQueueByDevice(deviceId);
            }

            res.json({
                status: 'success',
                response: adQueueResponse
            });
        } catch(e) {
            logger.error(`Fatal error deleting adQueue advert: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = AdQueueController;