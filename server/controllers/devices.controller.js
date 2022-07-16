const DevicesDAO = require('../dao/devices.dao.js');
const AdQueueDAO = require('../dao/adqueue.dao.js');
const SimCardsDAO = require('../dao/simcards.dao.js');
const logger = require('../util/logger');

const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

class DevicesController {
    static async apiPostDevice(req, res, next) {
        try {
            logger.debug(`device post request: ${JSON.stringify(req.body)}`);
            let simcard, newDevice, result;
            if(req.body.simcard === undefined) {
                logger.debug(`simcard is undefined: ${req.body.simcard}`);
                throw new Error(`Simcard is undefined!`);
            } else if(req.body.simcard === null) {
                simcard = req.body.simcard;
                logger.debug(`simcard is null: ${simcard}`);
                newDevice = {
                    mac_address: req.body.mac_address,
                    status: req.body.status,
                    admin_username: req.body.admin_username,
                    admin_password: req.body.admin_password,
                    type: req.body.type,
                    brand: req.body.brand,
                    model: req.body.model,
                    serial_no: req.body.serial_no,
                    imei: req.body.imei,
                    simcard: simcard
                };
                DevicesController.createDevice(newDevice, res);
            } else {
                simcard = req.body.simcard;
                logger.debug(`simcard is not null: ${simcard}`);
                SimCardsDAO.getSimCardsById(simcard).then(mSimcard => {
                    logger.info(`find simcard by id response: ${JSON.stringify(mSimcard, null, 2)}`);
                    if(!mSimcard || !mSimcard._id) {
                        throw new Error('SimCard not found in DB!');
                    } else {
                        simcard = ObjectId(mSimcard._id);
                        newDevice = {
                            mac_address: req.body.mac_address,
                            status: req.body.status,
                            admin_username: req.body.admin_username,
                            admin_password: req.body.admin_password,
                            type: req.body.type,
                            brand: req.body.brand,
                            model: req.body.model,
                            serial_no: req.body.serial_no,
                            imei: req.body.imei,
                            simcard: simcard
                        };
                        logger.info(`new device: ${newDevice}`);
                        DevicesController.createDevice(newDevice, res);
                    }
                }).catch(err => {
                    logger.error(`find simcard by id error: ${err}`);
                    // throw new Error(`Find simcard by Id error: ${err}`);
                    res.status(500).json({error: err.message});
                });
            }
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }

    static createDevice(newDevice, res) {
        /* Add new device to DB then add it to every advert on the
        adqueue such that all the adverts will be played on the new device.
        This should be okay because the adverts on the adqueue are removed once
        they reach the end of their campaign period. This means that after a given
        period of time only new adverts added through the front-end will be playing
        on this new device.*/

        DevicesDAO.addDevice(newDevice).then(deviceData => {
            logger.info(`Create new device response: ${JSON.stringify(deviceData)}`);
            AdQueueDAO.getAdQueueAdverts().then(adqueue => {
                // logger.log('Get entire adqueue response: ', adqueue);
                adqueue.advertsList.forEach(advert => {
                    logger.debug(`advert to update: ${JSON.stringify(advert, null, 2)}`);
                    let deviceArray = [...advert.device_id, deviceData.insertedId.toString()];
                    logger.debug(`deviceArray: ${JSON.stringify(deviceArray, null, 2)}`);
                    advert.device_id = deviceArray;
                    logger.debug(`updated advert: ${JSON.stringify(advert, null, 2)}`);
                    AdQueueDAO.updateAdQueueAdvert(advert).then(data => {
                        // logger.info('Updating adqueue advert response: ', data);
                        if(data.modifiedCount < 1) {
                            res.status(404).json({
                                status: 'failure',
                                error: 'AdQueue Advert not updated!'
                            });
                        }
                    }).catch(err => {
                        logger.error(`Fatal error updating adqueue advert: ${err}`);
                        throw new Error(`Unable to update adqueue advert: ${err}`);
                    });
                });
                res.status(200).json({
                    status: 'success',
                    postResponse: deviceData
                });
            }).catch(err => {
                logger.error(`Fatal error getting entire adqueue: ${err}`);
                throw new Error(`Unable to get entire adqueue: ${err}`);
            })
        }).catch(err => {
            logger.error(`Error creating new device: ${err}`);
            res.json({
                status: 'failure',
                error: err
            });
        });
    }

    static async apiGetDevices(req, res, next) {
        const perPage = req.query.devicesPerPage;
        const mPage = req.query.page;
        const devicesPerPage = perPage ? parseInt(perPage, 10): 20;
        const page = mPage ? parseInt(mPage, 10) : 0;

        let filters = {};
        if(req.query.mac) {
            filters.mac = req.query.mac;
        } else if(req.query.status) {
            filters.status = req.query.status;
        } else if(req.query.type) {
            filters.type = req.query.type;
        } else if(req.query.brand) {
            filters.brand = req.query.brand;
        } else if(req.query.model) {
            filters.model = req.query.model;
        } else if(req.query.serialNo) {
            filters.serial_no = req.query.serialNo;
        } else if(req.query.imei) {
            filters.imei = req.query.imei;
        }

        try {
            const { devicesList, totalNumDevices } = await DevicesDAO.getDevices({
                filters,
                page,
                devicesPerPage
            });

            let response = {
                devices: devicesList,
                page: page,
                filters: filters,
                entries_per_page: devicesPerPage,
                total_results: totalNumDevices
            };

            res.json(response);
        } catch(e) {
            logger.error(`Fatal error getting devices: ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiGetDeviceById(req, res, next) {
        try {
            let id = req.params.id || {};
            logger.debug(`device id: ${id}`);
            let device = await DevicesDAO.getDevicesById(id);
            if(!device) {
                res.status(404).json({error: 'Device not found'});
                return;
            }
            res.json(device);
        } catch(e) {
            logger.error(`Fatal error getting device by id: ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiUpdateDevice(req, res, next) {
        try {
            const updatedDevice = {
                _id: req.body._id,
                mac_address: req.body.mac_address,
                status: req.body.status,
                admin_username: req.body.admin_username,
                admin_password: req.body.admin_password,
                type: req.body.type,
                brand: req.body.brand,
                model: req.body.model,
                serial_no: req.body.serial_no,
                imei: req.body.imei,
                simcard: req.body.simcard
            };
            const deviceResponse = await DevicesDAO.updateDevice(updatedDevice);

            let { error } = deviceResponse;
            if(error) {
                res.status(400).json({error});
                return;
            }

            if(deviceResponse.modifiedCount === 0) {
                throw new Error(`Unable to update device: ${updatedDevice._id}`);
            }

            res.json({
                status: 'success',
                response: deviceResponse
            });
        } catch(e) {
            logger.error(`Fatal error updating device: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiDeleteDevice(req, res, next) {
        try {
            const deviceId = req.params.id || {};
            logger.debug(`deleting device: ${deviceId}`);
            const deviceResponse = await DevicesDAO.deleteDevice(deviceId);
            
            res.json({
                status: 'success',
                response: deviceResponse
            });
        } catch(e) {
            logger.error(`Fatal error deleting device: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = DevicesController;