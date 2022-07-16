const mongodb = require('mongodb');
const logger = require('../util/logger');
const ObjectId = mongodb.ObjectId;

let images;

class ImagesDAO {
    static async injectDB(conn) {
        if(images) {
            return;
        }
        try {
            images = await conn.db(process.env.NGAZI_NS).collection('images');
        } catch(e) {
            logger.error(`Unable to establish a connection to the images collection in ImagesDAO: ${e}`);
        }
    }

    static async addImages(
        advertId,
        filename,
        systemFilename,
        url,
        width,
        height,
        viewport,
        screen,
        addedBy,
        addedOn
    ) {
        try {
            const imageDoc = {
                advert_id: ObjectId(advertId),
                filename: filename,
                system_filename: systemFilename,
                url: url,
                width: width,
                height: height,
                viewport: viewport,
                screen: screen,
                added_by: addedBy,
                added_on: addedOn
            }
            return await images.insertOne(imageDoc);
        } catch(e) {
            logger.error(`Unable to create new image: ${e}`);
            return {error: e};
        }
    }

    static async getImages({
        filters = null,
        page = 0,
        imagesPerPage = 20,
    } = {}) {
        let query = {};
        if(filters) {
            if('advertId' in filters) {
                query = {'advert_id': {$eq: filters['advertId']}};
            } else if('filename' in filters) {
                query = {$text: {$search: filters['filename']}};
            } else if('addedBy' in filters) {
                query = {'added_by': {$eq: filters['addedBy']}};
            }
        }

        let cursor;
        try {
            cursor = await images.find(query);
        } catch(e) {
            logger.error(`Unable to find images in db: ${e}`);
            return { imagesList: [], totalNumImages: 0 };
        }

        const displayCursor = cursor.limit(imagesPerPage).skip(imagesPerPage * page);

        try {
            const imagesList = await displayCursor.toArray();
            const totalNumImages = await images.countDocuments(query);
            return { imagesList, totalNumImages };
        } catch(e) {
            logger.error(`Unable to convert cursor to array or problem counting image documents: ${e}`);
            return { imagesList:[], totalNumImages: 0 };
        }
    }

    static async getImagesById(imageId) {
        try {
            let readResponse = await images.findOne({ _id: ObjectId(imageId) });
            return readResponse;
        } catch(e) {
            logger.error(`Unable to find image document by id: ${e}`);
            return { error: e };
        }
    }

    static async updateImages(updatedImage) {
        try {
            const updateResponse = await images.updateOne(
                {_id: ObjectId(updatedImage._id)},
                {
                    $set: {
                       advert_id: updatedImage.advert_id,
                       filename: updatedImage.filename,
                       system_filename: updatedImage.system_filename,
                       url: updatedImage.url,
                       width: updatedImage.width,
                       height: updatedImage.height,
                       viewport: updatedImage.viewport,
                       screen: updatedImage.screen,
                       added_by: updatedImage.added_by,
                       added_on: updatedImage.added_on, 
                    }
                }
            );
            return updateResponse;
        } catch(e) {
            logger.error(`Unable to update image: ${e}`);
            return { error: e };
        }
    }

    static async deleteImage(imageId) {
        try {
            const deleteResponse = await images.deleteOne({_id: ObjectId(imageId)});
            return deleteResponse;
        } catch(e) {
            logger.error(`Unable to delete image: ${e}`);
            return { error: e };
        }
    }

    static async deleteImagesByAdvertId(advertId) {
        try {
            const deleteResponse = await images.deleteMany({advert_id: ObjectId(advertId)});
            return deleteResponse;
        } catch(e) {
            logger.error(`Unable to delete images for advert: ${e}`);
            return { error: e };
        }
    }
}

module.exports = ImagesDAO;