const mongodb = require('mongodb');
const logger = require('../util/logger');
const ObjectId = mongodb.ObjectId;

let simcards;

class SimCardsDAO {
    static async injectDB(conn) {
        if(simcards) {
            return;
        }
        try {
            simcards = await conn.db(process.env.NGAZI_NS).collection('simcards');
        } catch(e) {
            logger.error(`Unable to establish a connection to the simcards collection in SimCardsDAO: ${e}`);
        }
    }

    static async addSimCards(newSimCard) {
        try {
            const simcardDoc = {
                phone_no: newSimCard.phone_no,
                pin1: newSimCard.pin1,
                pin2: newSimCard.pin2,
                imsi: newSimCard.imsi,
                serial_no: newSimCard.serial_no,
                puk1: newSimCard.puk1,
                puk2: newSimCard.puk2
            };
            return await simcards.insertOne(simcardDoc);
        } catch(e) {
            logger.error(`Unable to create new simcard document: ${e}`);
            return { error: e };
        }
    }

    static async getSimCards({
        filters = null,
        page = 0,
        simcardsPerPage = 20,
    } = {}) {
        let query = {};
        if(filters) {
            if('phone_no' in filters) {
                query = {'phone_no': {$eq: filters['phone_no']}};
            } else if('imsi' in filters) {
                query = {'imsi': {$eq: filters['imsi']}};
            } else if('serial_no' in filters) {
                query = {'serial_no': {$eq: filters['serial_no']}};
            }
        }

        let cursor;
        try {
            cursor = await simcards.find(query);
        } catch(e) {
            logger.error(`Unable to find simcards in db: ${e}`);
            return { simcardList: [], totalNumSimCards: 0 };
        }

        const displayCursor = cursor.limit(simcardsPerPage).skip(simcardsPerPage * page);

        try {
            const simcardList = await displayCursor.toArray();
            const totalNumSimCards = await simcards.countDocuments(query);
            return { simcardList, totalNumSimCards };
        } catch(e) {
            logger.error(`Unable to convert cursor to array or problem counting simcard documents: ${e}`);
            return { simcardList: [], totalNumSimCards: 0 };
        }
    }

    static async getSimCardsById(simcardId) {
        try {
            return await simcards.findOne({_id: ObjectId(simcardId)});
        } catch(e) {
            logger.error(`Unable to find simcard document by id: ${e}`);
            return { error: e };
        }
    }

    static async updateSimCards(updatedSimCard) {
        try {
            const updateResponse = await simcards.updateOne(
                {_id: ObjectId(updatedSimCard._id)},
                {
                    $set: {
                        phone_no: updatedSimCard.phone_no,
                        pin1: updatedSimCard.pin1,
                        pin2: updatedSimCard.pin2,
                        imsi: updatedSimCard.imsi,
                        serial_no: updatedSimCard.serial_no,
                        puk1: updatedSimCard.puk1,
                        puk2: updatedSimCard.puk2
                    }
                }
            );
            return updateResponse;
        } catch(e) {
            logger.error(`Unable to update simcard: ${e}`);
            return { error: e };
        }
    }

    // Use carefully. We rarely want to delete sim cards in prod
    static async deleteSimCard(simcardId) {
        try {
            return await simcards.deleteOne({_id: ObjectId(simcardId)});
        } catch(e) {
            logger.error(`Unable to delete simcard: ${e}`);
            return { error: e };
        }
    }
}

module.exports = SimCardsDAO;