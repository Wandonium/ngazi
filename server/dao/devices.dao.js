const mongodb = require('mongodb');
const logger = require('../util/logger');
const ObjectId = mongodb.ObjectId;

let devices;

class DevicesDAO {
    static async injectDB(conn) {
        if(devices) {
            return;
        }

        try {
            devices = await conn.db(process.env.NGAZI_NS).collection('devices');
        } catch(e) {
            logger.error(`Unable to establish a connection to the devices collection in DevicesDAO: ${e}`);
        }
    }

    static async addDevice (newDevice) {
        try {
            const deviceDoc = {
                mac_address: newDevice.mac_address,
                status: newDevice.status,
                admin_username: newDevice.admin_username,
                admin_password: newDevice.admin_password,
                type: newDevice.type,
                brand: newDevice.brand,
                model: newDevice.model,
                serial_no: newDevice.serial_no,
                imei: newDevice.imei,
                simcard: newDevice.simcard
            };
            return await devices.insertOne(deviceDoc);
        } catch(e) {
            logger.error(`Unable to create a new device doc: ${e}`);
            return { error: e };
        }
    }

    static async getDevices({
        filters = null,
        page = 0,
        devicesPerPage = 20,
    } = {}) {
        let query = {};
        if(filters) {
            if("mac" in filters) {
                query = {'mac_address': {$eq: filters['mac']}};
            } else if('status' in filters) {
                query = {'status': {$eq: filters['status']}};
            } else if('type' in filters) {
                query = {'type': {$eq: filters['type']}};
            } else if('brand' in filters) {
                query = {'brand': {$eq: filters['brand']}};
            } else if('model' in filters) {
                query = {'model': {$eq: filters['model']}};
            } else if('serial_no' in filters) {
                query = {'serial_no' : {$eq: filters['serial_no']}};
            } else if('imei' in filters) {
                query = {'imei': {$eq: filters['imei']}};
            }
        }

        let cursor;
        try {
            cursor = await devices.find(query);
        } catch(e) {
            logger.error(`Unable to find device docs in db: ${e}`);
            return { devicesList: [], totalNumDevices: 0 };
        }

        const displayCursor = cursor.limit(devicesPerPage).skip(devicesPerPage * page);

        try {
            const devicesList = await displayCursor.toArray();
            const totalNumDevices = await devices.countDocuments(query);
            return { devicesList, totalNumDevices };
        } catch(e) {
            logger.error(`Unable to convert cursor to array or error counting devices documents: ${e}`);
            return { devicesList: [], totalNumDevices: 0 };
        }
    }

    static async getDevicesById(deviceId) {
        try {
            return await devices.findOne({_id: ObjectId(deviceId)});
        } catch (e) {
            logger.error(`Unable to find device document by id: ${e}`);
            return { error: e };
        }
    }

    static async updateDevice(updatedDevice) {
        try {
            const updateResponse = await devices.updateOne(
                { _id: ObjectId(updatedDevice._id)},
                {
                    $set: {
                        mac_address: updatedDevice.mac_address,
                        status: updatedDevice.status,
                        admin_username: updatedDevice.admin_username,
                        admin_password: updatedDevice.admin_password,
                        type: updatedDevice.type,
                        brand: updatedDevice.brand,
                        model: updatedDevice.model,
                        serial_no: updatedDevice.serial_no,
                        imei: updatedDevice.imei,
                        simcard: updatedDevice.simcard
                    }
                }
            );
            return updateResponse;
        } catch(e) {
            logger.error(`Unable to update device doc: ${e}`);
            return { error: e };
        }
    }

    // Use carefully. We rarely ever need to delete devices on prod!
    static async deleteDevice(deviceId) {
        try {
            return await devices.deleteOne({ _id: ObjectId(deviceId)});
        } catch(e) {
            logger.error(`Unable to delete device doc: ${e}`);
            return { error: e };
        }
    }
}

module.exports = DevicesDAO;