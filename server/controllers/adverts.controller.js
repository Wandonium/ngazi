const { DateTime } = require('luxon');
const AdvertsDAO = require('../dao/advert.dao.js');
const ImagesDAO = require('../dao/image.dao.js');
const VideosDAO = require('../dao/video.dao.js');
const AdQueueDAO = require('../dao/adqueue.dao.js');
const logger = require('../util/logger');
const { getDate, ADVERT_STATUS, isNullUndefined } = require("../util/util.js");

class AdvertsController {
    static async apiPostAdvert(req, res, next) {
        logger.debug(`req.body: ${JSON.stringify(req.body, null, 2)}`);
        const name = req.body.name;
        const desc = req.body.desc;
        const startTime = DateTime.fromISO(req.body.startTime);
        const endTime = DateTime.fromISO(req.body.endTime);
        const clientId = req.body.clientId;
        const addedBy = req.body.addedBy;
        const vidUrl = req.body.videoUrl;
        const vidName = req.body.videoName;
        const vidDuration = req.body.videoDuration;
        const vidWidth = req.body.videoWidth;
        const vidHeight = req.body.videoHeight;
        const deviceIds = req.body.deviceIds;
        const tv_images = req.body.tvImages;
        const wifi_images = req.body.wifiImages;

        
        if(startTime.isValid && endTime.isValid){
            const date = DateTime.now().setZone('Africa/Nairobi');
            const offset = date.offset;
            const env = process.env.ENV;
            let startTimeUTC = (env === 'dev') ? new Date(startTime.plus({minutes: offset}).toString())
            : new Date(startTime.toString());
            let endTimeUTC = (env === 'dev') ? new Date(endTime.plus({minutes: offset}).toString()) 
            : new Date(endTime.toString());
            let today = new Date(date.plus({minutes: offset}).toString());
            // an advert has an ACTIVE status only if the today is greater than or equal to the startTime and it's less than or equal to the endTime.

            let status = ADVERT_STATUS.inactive;
            if(today >= startTimeUTC && today <= endTimeUTC) {
                status = ADVERT_STATUS.active;
            }
            logger.debug(`date: ${date.toString()}`);
            logger.debug(`offset: ${offset}`);
	        logger.debug(`startTime: ${startTime.toString()}`);
	        logger.debug(`endTime: ${endTime.toString()}`);
            logger.debug(`today: ${today}`);
            logger.debug(`startTimeUTC: ${startTimeUTC}`);
            logger.debug(`endTimeUTC: ${endTimeUTC}`);
            logger.debug(`status: ${status}`);
            AdvertsDAO.addAdvert(
                name,
                desc,
                status,
                startTimeUTC,
                endTimeUTC,
                clientId,
            ).then(data => {
                logger.info(`create new advert response: ${data}`);
                let advertId = data.insertedId.toString();
                logger.debug(`vidUrl: ${vidUrl}`);
                if(!isNullUndefined(vidUrl)) {
                    VideosDAO.addVideos(
                        advertId,
                        null,
                        vidName,
                        null,
                        null,
                        vidUrl,
                        vidDuration,
                        vidWidth,
                        vidHeight,
                        "WIFI",//viewport,
                        addedBy,
                        getDate()
                    ).then(data => {
                        logger.info(`create new advert video response: ${data}`);
                    }).catch(err => {
                        logger.error(`create new advert video error: ${err}`);
                        throw new Error(`Failed to create new advert video: ${err}`);
                    })
                }

                tv_images.forEach(image => {
                    AdvertsController.addImage("TV", image, advertId, addedBy);
                });
                wifi_images.forEach(image => {
                    AdvertsController.addImage("WIFI", image, advertId, addedBy);
                });


                if(status === ADVERT_STATUS.active) {
                    // add new active advert to adqueue
                    AdQueueDAO.addAdQueueAdvert(
                        advertId,
                        deviceIds,
                        getDate()
                    ).then(data => {
                        logger.info(`add advert to adqueue response: ${data}`);
                        res.json({
                            status: 'success',
                            adqueue: 'advert added',
                            advertId: advertId
                        });
                    }).catch(err => {
                        logger.error(`add advert to adqueue error: ${err}`);
                        throw new Error(`Failed to add advert to adqueue: ${err}`);
                    });
                } else {
                    res.json({
                        status: 'success',
                        adqueue: 'advert not added',
                        advertId: advertId
                    })
                }

            }).catch(err => {
                logger.error(`create new advert error: ${err}`);
                res.json({
                    status: 'failure',
                    error: `create new advert error ${err}`
                })
            })
        } else {
            logger.error('One of the Date inputs is not a valid date.');
            logger.error(`startTime date input: ${startTime}`);
            logger.error(`startTime invalid reason: ${startTime.invalidReason}`);
            logger.error(`startTime invalid explanation: ${startTime.invalidExplanation}`);
            logger.error(`endTime date input: ${endTime}`);
            logger.error(`endTime invalid reason: ${endTime.invalidReason}`);
            res.json({
                status: 'failure',
                error: 'Wrong startTime/endTime input for advert!'
            });
        }
    }

    static addImage(viewport, image, advertId, addedBy) {
        logger.debug(`adding advert image to DB: ${image}`);

        let screen;
        if(viewport === "TV") {
            if(image.width > image.height) {
                screen = "horizontal";
            } else {
                screen = "vertical";
            }
        } else if(viewport === "WIFI") {
            if(image.width >= 1024) {
                screen = "laptop";
            } else if(image.width >= 540) {
                screen = "tablet";
            } else {
                screen = "mobile";
            }
        }

        ImagesDAO.addImages(
            advertId,
            image.filename,
            image.systemFilename,
            image.url,
            image.width,
            image.height,
            viewport,
            screen,
            addedBy,
            getDate()
        ).then(data => {
            logger.info(`create new advert image response: ${data}`);                                      
        }).catch(err => {
            logger.error(`create new advert image error: ${err}`);
            throw new Error(`Failed to create new advert image: ${err}`);
        })
    }

    static async apiGetAdverts(req, res, next) {
        const perPage = req.query.advertsPerPage;
        const mPage = req.query.page;
        const advertsPerPage = perPage ? parseInt(perPage, 10) : 20;
        const page = mPage ? parseInt(mPage, 10): 0;

        // sample startTimes and endTimes: "2022-01-03", "2022-02-03T14:00"
        let filters = {};
        if(req.query.status) {
            filters.status = req.query.status;
        } else if(req.query.startTime) {
            filters.startTime = req.query.startTime;
        } else if(req.query.endTime) {
            filters.endTime = req.query.endTime;
        } else if(req.query.clientId) {
            filters.clientId = req.query.clientId;
        }

        try {
            const {advertsList, totalNumAdverts, errors} = await AdvertsDAO.getAdverts({
                filters,
                page,
                advertsPerPage
            });
    
            let response = {
                adverts: advertsList,
                page: page,
                filters: filters,
                entries_per_page: advertsPerPage,
                total_results: totalNumAdverts,
                errors
            };
    
            res.json(response);
        } catch(e) {
            logger.error(`Fatal error getting adverts: ${e}`);
            res.status(500).json({error: e});
        }
    }

    static async apiGetAdvertsById(req, res, next) {
        try {
            let id = req.params.id || {};
            logger.debug(`advert id: ${id}`);
            let advert = await AdvertsDAO.getAdvertsById(id);
            if(!advert) {
                res.status(404).json({error: 'Advert not found!'});
                return;
            }
            res.json(advert);
        } catch(e) {
            logger.error(`Fatal error getting adverts by id: ${e}`);
            res.status(500).json({error: e});
        }
    }

    static async apiUpdateAdvert(req, res, next) {
        try {
            const updatedAdvert = {
                _id: req.body._id,
                name: req.body.name,
                description: req.body.description,
                status: req.body.status,
                campaign_start: req.body.campaign_start,
                campaign_end: req.body.campaign_end,
                client_id: req.body.client_id
            };

            const advertResponse = await AdvertsDAO.updateAdvert(updatedAdvert);

            var { error } = advertResponse;
            if(error) {
                res.status(400).json({error});
                return;
            }

            if(advertResponse.modifiedCount === 0) {
                throw new Error(`Unable to update advert: ${updatedAdvert._id}`);
                return;
            }

            res.json({
                status: 'success',
                response: advertResponse
            });
        } catch(e) {
            logger.error(`Fatal error updating advert: ${e}`);
            res.status(500).json({error: e.message});
        }
    }

    static async apiDeleteAdvert(req, res, next) {
        try {
            const advertId = req.params.id || {};
            logger.debug(`deleting advert: ${advertId}`);
            AdQueueDAO.deleteAdQueueAdvert(advertId).then(data => {
                logger.info(`deleting advert from adqueue response: ${JSON.stringify(data, null, 2)}`);
                if(data.deletedCount < 1) {
                    logger.info('Advert not found in AdQueue');
                }
                ImagesDAO.deleteImagesByAdvertId(advertId).then(data => {
                    logger.info(`deleting advert images response: ${JSON.stringify(data, null, 2)}`);
                    if(data.deletedCount < 1) {
                        logger.info('Advert Images not found in DB');
                    }
                    VideosDAO.deleteVideosByAdvertId(advertId).then(data => {
                        logger.info(`deleting advert videos response: ${JSON.stringify(data, null, 2)}`);
                        if(data.deletedCount < 1) {
                            logger.info('Advert videos not found in DB');
                        }
                        AdvertsDAO.deleteAdvert(advertId).then(advertResponse => {
                            if(advertResponse.deletedCount < 1) {
                                res.status(404).json({
                                    status: 'failure',
                                    error: 'Advert not found'
                                });
                            } else {
                                logger.info(`Deleted advert after deleting it from the 
                                 adqueue and deleting its images and videos.
                                 Delete response: ${JSON.stringify(advertResponse, null, 2)}`);
                                res.json({
                                    status: 'success',
                                    response: advertResponse
                                });
                            }
                        }).catch(err => {
                            logger.error(`Fatal error deleting advert: ${err}`);
                            throw new Error(`Unable to delete advert: ${err}`);
                        })
                    }).catch(err => {
                        logger.error(`Fatal error deleting advert videos: ${err}`);
                        throw new Error(`Unable to delete advert videos: ${err}`);
                    })
                }).catch(err => {
                    logger.error(`Fatal error deleting advert images: ${err}`);
                    throw new Error(`Unable to delete advert images: ${err}`);
                })
                
            }).catch(err => {
                logger.error(`Fatal error deleting advert from adqueue: ${err}`);
                throw new Error(`Unable to delete advert from adqueue: ${err}`);
            })
            
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }

    static async apiRemoveAdFromAdQueue(req, res, next) {
        try {
            const advertId = req.params.advertId;
            const advertIndex = req.params.index;
            logger.debug(`advertId: ${advertId}`);
            logger.debug(`advertIndex: ${advertIndex}`);
            AdvertsDAO.getAdvertsById(advertId).then(advert => {
                if(!advert) {
                    res.status(404).json({error: 'Advert not found!'});
                    return;
                }
                logger.info(`Get advert to remove from adqueue response: ${JSON.stringify(advert, null, 2)}`);
                let date = DateTime.utc().toLocal();
                let offset = date.offset;
                let today;
                if(process.env.ENV === 'dev') {
                    today = new Date(date.plus({minutes: offset}).toString());
                } else {
                    today = new Date(getDate().toString());
                }

                let campaign_end_date = new Date(advert.campaign_end);
                logger.debug(`today: ${today}`);
                logger.debug(`campaign end: ${campaign_end_date}`);
                if(today > campaign_end_date) {
                    AdQueueDAO.deleteAdQueueAdvert(advertId).then(data => {
                        logger.info(`Removing advert from adqueue response: ${JSON.stringify(data, null, 2)}`);
                        if(data.deletedCount < 1) {
                            res.status(404).json({
                                status: 'failure',
                                error: 'Advert not found in AdQueue!'
                            });
                        } else {
                            let updatedAdvert = {
                                _id: advert._id,
                                name: advert.name,
                                description: advert.description,
                                status: ADVERT_STATUS.inactive,
                                campaign_start: advert.campaign_start,
                                campaign_end: advert.campaign_end,
                                client_id: advert.client_id, 
                            };
                            AdvertsDAO.updateAdvert(updatedAdvert).then(data => {
                                // logger.log('Update advert status response: ', data);
                                AdQueueDAO.getAdQueueAdverts().then(adqueue => {
                                    // logger.log('Get updated adqueue: ', adqueue);
                                    let nextAdvert_id = adqueue.advertsList[advertIndex].advert_id;
                                    logger.debug(`nextAdvert_id: ${nextAdvert_id}`);
                                    AdvertsDAO.getAdvertsById(nextAdvert_id).then(nextAdvert => {
                                        logger.info(`Get next advert response: ${JSON.stringify(nextAdvert, null, 2)}`);
                                        res.json({
                                            status: 'success',
                                            adqueue: adqueue.advertsList,
                                            advert: nextAdvert
                                        });
                                    }).catch(err => {
                                        logger.error(`Fatal error getting next advert: ${err}`);
                                        throw new Error(`Unable to get next advert: ${err}`);
                                    })
                                }).catch(err => {
                                    logger.error(`Fatal error getting updated adqueue: ${err}`);
                                    throw new Error(`Unable to get updated adqueue: ${err}`);
                                })
                            }).catch(err => {
                                logger.error(`Fatal error updating advert status: ${err}`);
                                throw new Error(`Unable to update advert status: ${err}`);
                            })
                        }
                    }).catch(err => {
                        logger.error(`Fatal error removing advert from adqueue: ${err}`);
                        throw new Error(`Unable to remove advert from adqueue: ${err}`);
                    })
                } else {
                    res.json({
                        status: 'failure',
                        error: "Advert has not reached it's campaign end date",
                        campaign_end_date: campaign_end_date.toString()
                    });
                }
            })
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }
}

module.exports = AdvertsController;

