const NotificationsDAO = require('../dao/notifications.dao.js');

class NotificationsController {
    static async apiPostNotification(req, res, next) {
        console.log('notifications post request body: ', req.body);
        NotificationsDAO.addNotification(req.body).then(data => {
            console.log('add notification data: ', data);
            res.send('[captured]');
        }).catch(err => {
            console.error('Error adding notification into db: ', err);
            res.send('[error]');
        })
    }

    static async apiGetNotificationByUid(req, res, next) {
        try {
            let uid = req.params.id || {};
            console.log('notification uid: ', uid);
            let { notificationsList, totalNumNotifications } = await NotificationsDAO.getNotifications({
                uid,
                page: 0,
                notificationsPerPage: 20
            });

            let response = {
                notifications: notificationsList,
                page: 0,
                entriesPerPage: 20,
                total_results: totalNumNotifications
            }

            res.json(response);
        } catch(e) {
            console.error('api error: ', e);
            res.status(500).json({error: e});
        }
    }
}

module.exports = NotificationsController;