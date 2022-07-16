const { getDate, isNullUndefined } = require('../util/util.js');
const TvAppApkDAO = require('../dao/tvAppApks.dao.js');
const { DateTime } = require('luxon');
const fs = require('fs');
const logger = require('../util/logger');


class TvAppApksController {
    static async apiPostTvAppApk(req, res, next) {
        try {
            logger.debug(`req.file: ${JSON.stringify(req.file)}`);
            logger.debug(`req.body: ${JSON.stringify(req.body)}`);
            const newTvAppApk = {
                version_code: req.body.version_code,
                filename: req.file.originalname,
                system_filename: req.file.filename,
                apk_url: req.file.path,
                added_on: getDate(),
                added_by: req.body.added_by
            };

            const newTvAppApkResponse = await TvAppApkDAO.addTvAppApk(newTvAppApk);
            res.status(200).json({
                status: 'success',
                postResponse: newTvAppApkResponse
            });
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }

    static async apiGetTvAppApk(req, res, next) {
        const perPage = req.query.tvAppApksPerPage;
        const mPage = req.query.page;
        const tvAppApksPerPage = perPage ? parseInt(perPage, 10) : 20;
        const page = mPage ? parseInt(mPage, 10) : 0;

        try {
            let filters = {};
            if(req.query.version_code) {
                filters.version_code = req.query.version_code;
            } else if(req.query.filename) {
                filters.filename = req.query.filename;
            } else if(req.query.system_filename) {
                filters.system_filename = req.query.system_filename;
            } else if(req.query.apk_url) {
                filters.apk_url = req.query.apk_url;
            } else if(req.query.added_on) {
                logger.debug(`tvAppApkk added_on: ${req.query.added_on}`);
                const addedOn = DateTime.fromISO(req.query.added_on);
                logger.debug(`addedOn: ${addedOn.toString()}`);
                if(addedOn.isValid) {
                    const offset = DateTime.utc().toLocal().offset;
                    logger.debug(`offset: ${offset}`);
                    let offset_addedOn = new Date(addedOn.plus({
                        minutes: offset
                    }).toString());
                    logger.debug(`offset_addedOn: ${offset_addedOn}`);
                    filters.added_on = offset_addedOn;
                } else {
                    logger.error(`Fatal Error! TvAppApk added_on date is invalid!`);
                    logger.error(`added_on invalid reason: ${addedOn.invalidReason}`);
                    throw new Error(`TvAppApk added_on date is invalid: ${addedOn.invalidReason}`);
                }
            } else if(req.query.added_by) {
                filters.added_by = req.query.added_by;
            }

            const { tvAppApkList, totalNumTvAppApks } = await TvAppApkDAO.getTvAppApks({
                filters,
                page,
                tvAppApksPerPage
            });

            let response = {
                tvAppApks: tvAppApkList,
                page,
                filters,
                entries_per_page: tvAppApksPerPage,
                total_results: totalNumTvAppApks
            };

            res.json(response);
        } catch (e) {
            logger.error(`Fatal error getting TvAppApks: ${e}`);
            res.status(500).json({error: e});
        }
    }

    static async apiGetTvAppApkById(req, res, next) {
        try {
            let id = req.params.id || {};
            logger.debug(`tvAppApk id: ${id}`);
            let tvAppApk = await TvAppApkDAO.getTvAppApkById(id);
            if(!tvAppApk) {
                res.status(404).json({error: 'TvAppApk not found in DB'});
                return;
            }
            res.status(200).json(tvAppApk);
        } catch(e) {
            logger.error(`Fatal error getting tvAppApk by id: ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiGetLatestTvAppApk(req, res, next) {
        try {
            let date = req.params.date || {};
            logger.debug(`get latest tvAppApk date: ${date}`);
            let sortedTvAppApks = await TvAppApkDAO.getLatestTvAppApk();
            if(!sortedTvAppApks) {
                res.status(404).json({ error: 'Error getting sorted list of tvAppApks'});
                return;
            }
            logger.debug(`sorted tv app apks: ${JSON.stringify(sortedTvAppApks, null, 2)}`);
            res.status(200).json(sortedTvAppApks[0]);
        } catch(e) {
            logger.error(`Fatal error getting sorted tvAppApks list: ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiUpdateTvAppApk(req, res, next) {
        try {
            logger.debug(`req.file: ${JSON.stringify(req.file)}`);
            logger.debug(`req.body: ${JSON.stringify(req.body)}`);
            const filepath = req.body.apk_url;
            if(fs.existsSync(filepath)) {
                fs.unlink(filepath, (err) => {
                    if(err) {
                        logger.error(`Fatal error deleting file before update: ${err}`);
                        throw new Error(`Fatal error deleting file before updating: ${err}`);
                    }
                    logger.info(`File '${filepath}' deleted successfully!`);
                });
                const updateTvAppApk = {
                    _id: req.body._id,
                    version_code: req.body.version_code,
                    filename: req.file.originalname,
                    system_filename: req.file.filename,
                    apk_url: req.file.path,
                    added_on: req.body.added_on,
                    added_by: req.body.added_by
                };
                const updateResponse = await TvAppApkDAO.updateTvAppApk(updateTvAppApk);
    
                let { error } = updateResponse;
                if(error) {
                    res.status(400).json({error});
                    return;
                }
    
                if(updateResponse.modifiedCount === 0) {
                    throw new Error(`Unable to update tvAppApk: ${updateTvAppApk._id}`);
                }
    
                res.json({
                    status: 'success',
                    response: updateResponse
                });
            } else {
                res.status(400).json({
                    status: 'failure',
                    error: 'File not found so not updating tvAppApk!'
                });
            }
        } catch(e) {
            logger.error(`Fatal error updating tvAppApk: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }

    static async apiDeleteTvAppApk(req, res, next) {
        try {
            const tvAppApkId = req.params.id || {};
            logger.debug(`deleting tvAppApk: ${tvAppApkId}`);
            TvAppApkDAO.getTvAppApkById(tvAppApkId).then(data => {
                logger.info(`Get tvAppApk by id: ${JSON.stringify(data, null, 2)}`);
                if(isNullUndefined(data)) {
                    logger.error('Error! No tvAppApk found for the given Id!');
                    throw new Error(`Fatal error! No tvAppApk found for given ID`);
                }
                fs.unlink(data.apk_url, (err) => {
                    if(err) {
                        logger.error('Error deleting tvAppApk file from filesystem');
                        // throw new Error(`Fatal error deleting tvAppApk file: ${err}`);
                    }
                    logger.info(`File '${data.apk_url}' deleted successfully!`);
                });
                TvAppApkDAO.deleteTvAppApk(tvAppApkId).then(data => {
                    logger.info(`delete response: ${JSON.stringify(data, null, 2)}`);
                    let { error } = data;
                    if(error) {
                        res.status(400).json({error});
                        return;
                    }

                    if(data.deletedCount === 0) {
                        throw new Error(`Unable to delete tvAppApk: ${tvAppApkId}`);
                    }

                    res.status(200).json({
                        status: 'success',
                        response: data
                    });
                }).catch(err => {
                    logger.error(`Error deleting tvAppApk: ${err}`);
                    throw new Error(`Fatal error deleting tvAppApk: ${err}`);
                });
            }).catch(err => {
                logger.error(`Error getting tvAppApk by id: ${err}`);
                res.status(500).json({ error: err.message });
            });
        } catch(e) {
            logger.error(`Fatal error deleting tvAppApk: ${e}`);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = TvAppApksController;