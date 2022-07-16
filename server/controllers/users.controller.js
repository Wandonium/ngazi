const UsersDAO = require("../dao/users.dao.js");
const AdViewDAO = require('../dao/adviews.dao.js');
const { getDate } = require("../util/util.js");
const logger = require('../util/logger');

class UsersController {
    static async apiCreateUser(profile, macAddress, ipAddress, profileProvider) {
        try {
            let firstName, lastName, email, picture, providerId;
            if(profileProvider === 'facebook') {
                firstName = profile.first_name;
                lastName = profile.last_name;
                email = profile.email;
                picture = profile.picture.data.url;
                providerId = profile.id;
            } else if(profileProvider === 'google') {
                firstName = profile.given_name;
                lastName = profile.family_name;
                email = profile.email;
                picture = profile.picture;
                providerId = profile.sub;
            } else if(profileProvider === 'twitter') {
                if(profile.name.indexOf(' ')  === -1) {
                    firstName = profile.name;
                    lastName = null;
                } else {
                    firstName = profile.name.substring(0, profile.name.indexOf(' '));
                    lastName = profile.name.substring(profile.name.indexOf(' '), profile.name.length);
                }
                email = profile.email;
                picture = profile.profile_image_url_https;
                providerId = profile.id;
            }

            const userResponse = await UsersDAO.addUser(
                firstName,
                lastName,
                profileProvider,
                providerId,
                email,
                picture,
                macAddress,
                ipAddress
            )
            return userResponse;
        } catch(e) {
            return {error: e.message};
        }
    }

    static async apiPostUser(req, res, next) {
        const macAddress = req.body.macAddress;
        const ipAddress = req.body.ipAddress;
        const advertId = req.body.advertId;
        const deviceId = req.body.deviceId;
        const viewedAt = getDate();

        UsersDAO.getUsers({
            filters: null,
            page: 0,
            usersPerPage: 20
        }).then(data => {
            logger.info(`get all users response: ${JSON.stringify(data, null, 2)}`);
            if(data.usersList) {
                let macList = [];
                data.usersList.forEach(user => {
                    macList = [...macList, ...user.mac_addresses];
                    logger.debug(`macList: ${macList}`);
                });
                if(macList.includes(macAddress)) {
                    res.json({error: 'Fatal error! Mac address is already in DB!'});
                } else {
                    const picture = {
                        data: {
                            height: 50,
                            width: 50,
                            url: null
                        }
                    };
                    UsersDAO.addUser(
                        'User',
                        data.totalNumUsers + 1,
                        'mac address',
                        null,
                        null,
                        picture,
                        macAddress,
                        ipAddress
                    ).then(data => {
                        logger.info(`create new user data: ${JSON.stringify(data, null, 2)}`);
                        let newUserId = data.insertedId.toString();
                        AdViewDAO.addAdView(
                            advertId, 
                            viewedAt, 
                            newUserId, 
                            deviceId
                        ).then(data => {
                            logger.info(`create new adview from creating 
                                new mac address user: ${JSON.stringify(data, null, 2)}`);
                            res.json({
                                status: "success", 
                                new_user_id: newUserId,
                                new_adview_id: data.insertedId.toString()
                            });
                        }).catch(err => {
                            logger.error(`error while creating new adview from creating new mac address user: ${err}`);
                            res.status(500).json({
                                status: "failure",
                                error: err
                            });
                        })
                    })
                }
            } else {
                res.status(500).json({
                    status: 'failure',
                    error: 'Fatal error! No users found in DB!'
                });
            }
        })
    }

    static async apiGetUsers(req, res, next) {
        const perPage = req.query.usersPerPage;
        const mPage = req.query.page;
        const usersPerPage = perPage ? parseInt(perPage, 10) : 20;
        const page = mPage ? parseInt(mPage, 10): 0;

        let filters = {};
        if(req.query.name) {
            filters.name = req.query.name;
        } else if(req.query.macAddress) {
            filters.macAddress = req.query.macAddress;
        } else if(req.query.email) {
            filters.email = req.query.email;
        } else if(req.query.providerId) {
            filters.providerId = req.query.providerId;
        }

        const {usersList, totalNumUsers} = await UsersDAO.getUsers({
            filters,
            page,
            usersPerPage
        });

        let response = {
            users: usersList,
            page: page,
            filters: filters,
            entries_per_page: usersPerPage,
            total_results: totalNumUsers
        };

        res.json(response);
    }

    static async apiGetUsersById(req, res, next) {
        try {
            let id = req.params.id || {};
            logger.debug(`user id: ${id}`);
            let user = await UsersDAO.getUsersById(id);
            if(!user) {
                res.status(404).json({error: 'Not Found'});
                return;
            }
            res.json(user);
        } catch(e) {
            logger.error(`api error: ${e}`);
            res.status(500).json({error: e});
        }
    }

    static async apiUpdateUser(req, res, next) {
        try {
            const updatedUser = {
                _id: req.body._id,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                provider: req.body.provider,
                provider_id: req.body.provider_id,
                mac_addresses: req.body.mac_addresses,
                current_ip_address: req.body.current_ip_address,
                email: req.body.email,
                picture_url: req.body.picture_url,
            }

            const userResponse = await UsersDAO.updateUser(updatedUser);

            var { error } = userResponse;
            if(error) {
                res.status(400).json({error});
            }

            if(userResponse.modifiedCount === 0) {
                throw new Error(`unable to update user: ${userId}`);
            }

            res.json({status: 'success', response: userResponse});
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }

    static async apiDeleteUser(req, res, next) {
        try {
            const userId = req.params.id || {};
            logger.debug(`deleting user: ${userId}`);
            const userResponse = await UsersDAO.deleteUser(userId);
            res.json({status: 'success', response: userResponse});
        } catch(e) {
            res.status(500).json({error: e.message});
        }
    }
}

module.exports = UsersController;