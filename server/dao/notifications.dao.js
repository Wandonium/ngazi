const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;

let notifications;

class NotificationsDAO {
    static async injectDB(conn) {
        if(notifications) {
            return;
        }
        try {
            notifications = await conn.db(process.env.NGAZI_NS).collection('notifications');
        } catch(e) {
            console.error(`Unable to establish a connection to the notifications collection in NotificationsDAO: ${e}`);
        }
    }

    static async addNotification(notification) {
        try {
            const notificationDoc = {
                uid: notification.uid,
                thumbnail: notification.thumbnail,
                thumbnailTimestampPct: notification.thumbnailTimestampPct,
                readyToStream: notification.readyToStream,
                status: notification.status,
                meta: notification.meta,
                created: notification.created,
                modified: notification.modified,
                size: notification.size,
                preview: notification.preview,
                allowedOrigins: notification.allowedOrigins,
                requireSignedURLs: notification.requireSignedURLs,
                uploaded: notification.uploaded,
                uploadExpiry: notification.uploadExpiry,
                maxSizeBytes: notification.maxSizeBytes,
                maxDurationSeconds: notification.maxDurationSeconds,
                duration: notification.duration,
                input: notification.input,
                playback: notification.playback,
                watermark: notification.watermark
            };
            return await notifications.insertOne(notificationDoc);
        } catch(e) {
            console.error(`Unable to create new notification: ${e}`);
            return { error: e };
        }
    }

    static async getNotifications({
        uid = '',
        page = 0,
        notificationsPerPage = 20,
    } = {}) {
        let query = {};
        if(uid !== '') {
            query = {'uid': {$eq: uid}};
        }

        let cursor;
        try {
            cursor = await notifications.find(query);
        } catch(e) {
            console.error(`Unable to issue find command for notifications: ${e}`);
            return { notificationsList: [], totalNumNotifications: 0 };
        }

        const displayCursor = cursor.limit(notificationsPerPage).skip(notificationsPerPage * page);

        try {
            const notificationsList = await displayCursor.toArray();
            const totalNumNotifications = await notifications.countDocuments(query);
            return { notificationsList, totalNumNotifications };
        } catch(e) {
            console.error(`Unable to convert cursor to array or problem counting notification documents: ${e}`);
            return { notificationsList: [], totalNumNotifications: 0 };
        }
    }

    static async updateNotification(updatedNotification) {
        try {
            const updateResponse = await notifications.updateOne(
                {_id: ObjectId(updatedNotification._id)},
                {
                    $set: {
                        uid: updatedNotification.uid,
                        thumbnail: updatedNotification.thumbnail,
                        thumbnailTimestampPct: updatedNotification.thumbnailTimestampPct,
                        readyToStream: updatedNotification.readyToStream,
                        status: updatedNotification.status,
                        meta: updatedNotification.meta,
                        created: updatedNotification.created,
                        modified: updatedNotification.modified,
                        size: updatedNotification.size,
                        preview: updatedNotification.preview,
                        allowedOrigins: updatedNotification.allowedOrigins,
                        requireSignedURLs: updatedNotification.requireSignedURLs,
                        uploaded: updatedNotification.uploaded,
                        uploadExpiry: updatedNotification.uploadExpiry,
                        maxSizeBytes: updatedNotification.maxSizeBytes,
                        maxDurationSeconds: updatedNotification.maxDurationSeconds,
                        duration: updatedNotification.duration,
                        input: updatedNotification.input,
                        playback: updatedNotification.playback,
                        watermark: updatedNotification.watermark
                    }
                }
            );
            return updateResponse;
        } catch(e) {
            console.error(`Unable to update notification: ${e}`);
            return { error: e };
        }
    }

    static async deleteNotification(id) {
        try {
            const deleteResponse = await notifications.deleteOne({_id: ObjectId(id)});
            return deleteResponse;
        } catch(e) {
            console.error(`Unable to delete notification: ${e}`);
            return { error: e };
        }
    }
}

module.exports = NotificationsDAO;