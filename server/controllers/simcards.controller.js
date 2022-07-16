const SimCardsDAO = require('../dao/simcards.dao.js');
const logger = require('../util/logger');

class SimCardsController {
    static async apiPostSimCard(req, res, next) {
        try {
            const newSimCard = {
                phone_no: req.body.phone_no,
                pin1: req.body.pin1,
                pin2: req.body.pin2,
                imsi: req.body.imsi,
                serial_no: req.body.serial_no,
                puk1: req.body.puk1,
                puk2: req.body.puk2
            };

            const postResponse = await SimCardsDAO.addSimCards(newSimCard);
            res.status(200).json({
                status: 'success',
                postResponse
            });
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }

    static async apiGetSimCards(req, res, next) {
        const perPage = req.query.simcardsPerPage;
        const mPage = req.query.page;
        const simcardsPerPage = perPage ? parseInt(perPage, 10) : 20;
        const page = mPage ? parseInt(mPage, 10) : 0;

        try {
            let filters = {};
            if(req.query.phone_no) {
                filters.phone_no = req.query.phone_no;
            } else if(req.query.imsi) {
                filters.imsi = req.query.imsi;
            } else if(req.query.serial_no) {
                filters.serial_no = req.query.serial_no;
            }

            const { simcardList, totalNumSimCards } = await SimCardsDAO.getSimCards({
                filters,
                page,
                simcardsPerPage
            });

            let response = {
                simcards: simcardList,
                page,
                filters,
                entries_per_page: simcardsPerPage,
                total_results: totalNumSimCards
            };

            res.status(200).json(response);
        } catch(e) {
            logger.error(`Fatal error getting SimCards: ${e}`);
            res.status(500).json({error: e});
        }
    }

    static async apiGetSimCardsById(req, res, next) {
        try {
            let id = req.params.id || {};
            logger.debug(`sim card id: ${id}`);
            let simcard = await SimCardsDAO.getSimCardsById(id);
            if(!simcard) {
                res.status(404).json({error: 'SimCard not found in DB!'});
                return;
            }
            res.status(200).json(simcard);
        } catch(e) {
            logger.error(`Fatal error getting simcard by id: ${e}`);
            res.status(500).json({error: e});
        }
    }

    static async apiUpdateSimCard(req, res, next) {
        try {
            const updatedSimCard = {
                _id: req.body._id,
                phone_no: req.body.phone_no,
                pin1: req.body.pin1,
                pin2: req.body.pin2,
                imsi: req.body.imsi,
                serial_no: req.body.serial_no,
                puk1: req.body.puk1,
                puk2: req.body.puk2
            };
            const updateResponse = await SimCardsDAO.updateSimCards(updatedSimCard);

            let { error } = updateResponse;
            if(error) {
                res.status(400).json({error});
                return;
            }

            if(updateResponse.modifiedCount === 0) {
                throw new Error(`Unable to update simcard: ${updatedSimCard._id}`);
            }

            res.status(200).json({
                status: 'success',
                response: updateResponse
            });
        } catch(e) {
            logger.error(`Fatal error updating simcard: ${e}`);
            res.status(500).json({error: e.message});
        }
    }

    static async apiDeleteSimCard(req, res, next) {
        try {
            const simcardId = req.params.id || {};
            logger.debug(`deleting simcard with id: ${simcardId}`);
            const deleteResponse = await SimCardsDAO.deleteSimCard(simcardId);
            res.status(200).json({
                status: 'success',
                response: deleteResponse
            })
        } catch(e) {
            logger.error(`Fatal error deleting simcard: ${e}`);
            res.status(500).json({error: e.message});
        }
    }
}

module.exports = SimCardsController;