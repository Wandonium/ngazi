const UsersDAO = require('../dao/users.dao.js');
const AdViewDAO = require('../dao/adviews.dao.js');
const UserCtrl = require('../controllers/users.controller.js');
const logger = require('../util/logger');
const passportFacebook = require('passport-facebook');
const mongodb = require('mongodb');
const { getDate } = require('../util/util.js');

const ObjectId = mongodb.ObjectID;

module.exports = (passport, values, app) => {

    const FacebookStrategy = passportFacebook.Strategy;

    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'name', 'picture.type(small)', 'email']
    }, function(token, refreshToken, profile, done) {
        logger.info(`profile: ${profile._json}`);
        logger.info(`macAddress: ${values.macAddress}`);
        let filters = {};
        if(profile._json.email) {
            filters = {email: profile._json.email};
        } else {
            filters = {providerId: profile._json.id};
        }
        logger.debug(`fb filters: ${filters}`);
        // get users from DB who have the current email address
        UsersDAO.getUsers({
            filters, 
            page: 0, 
            usersPerPage: 20
        }).then(data => {
            logger.debug(`getUsers by fb id data: ${data}`);
            if(data.usersList.length > 1) {
                // more than one user with the same email address in DB
                logger.error(`Fatal Error! User has more than one entry/record 
                in the Users DB Collection/Table: ${JSON.stringify(data.usersList[0])}`);
                return done(null, profile);
            } else if(data.usersList.length === 0 && data.totalNumUsers === 0) {
                // no users found in db with the provided email address
                // so we create a new user
                if(values.macAddress != '') {

                    UserCtrl.apiCreateUser(profile._json, values.macAddress, values.ipAddress, 'facebook')
                    .then(data => {
                        logger.info(`create new user from facebook in mongodb data: ${data}`);
                        let newUserId = data.insertedId.toString();
                        logger.debug(`new user id: ${newUserId}`);
                        const viewedAt = getDate();
                        AdViewDAO.addAdView(
                            new ObjectId(), 
                            viewedAt, 
                            newUserId, 
                            new ObjectId()
                        ).then(data => {
                            logger.info(`create new adview from creating new facebook user: ${data}`);
                            return done(null, profile);
                        }).catch(err => {
                            logger.error(`error while creating new adview from creating new facebook user: ${err}`);
                            return done(null, profile);
                        })
                    })
                    .catch(err => {
                        logger.error(`create new user from facebook in mongodb error: ${err}`);
                        return done(null, profile);
                    });
                } else {
                    logger.error(`Cannot create new user using ${values.macAddress} as mac address.`);
                    return done(null, profile);
                }
            } else {
                // user found in DB with the current facebook id
                let oldUser = data.usersList[0];
                let macs = oldUser.mac_addresses;
                logger.info('macs: ', macs);
                if(values.macAddress !== '') {
                    if(macs.includes(values.macAddress)) {
                        logger.error(`Fatal Error! Tried creating new user but Mac Address and Facebook Id already exist in DB! Check in /api/hotspot/login route did not work!`);
                        return done(null, profile);
                    } else {
                        // add current mac address to user's list of mac addresses
                        let newUser = {...oldUser};
                        let newMacs = oldUser.mac_addresses.slice();
                        newMacs.push(values.macAddress);
                        newUser.mac_addresses = newMacs;
                        logger.debug(`newUser: ${newUser}`);
                        UsersDAO.updateUser(newUser).then(data => {
                            logger.info(`updated user mac address in fb login: ${data}`);
                            const viewedAt = getDate();
                            let newUserId = newUser._id.toString();
                            AdViewDAO.addAdView(
                                new ObjectId(),
                                viewedAt, 
                                newUserId, 
                                new ObjectId()
                            ).then(data => {
                                logger.info(`create new adview from updating facebook user: ${data}`);
                                return done(null, profile);
                            }).catch(err => {
                                logger.error(`error while creating new adview from updating facebook user: ${err}`);
                                return done(null, profile);
                            })
                        }).catch(err => {
                            logger.error(`error while updating user mac address in fb login: ${err}`);
                            return done(null, profile);
                        })
                    }
                } else {
                    return done(null, profile);
                }
            }
            
        });
    }));
    
    passport.serializeUser((user, done) => {
        done(null, user);
    });
    
    passport.deserializeUser((id, done) => {
        done(null, id);
    });
    
    app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email, user_photos' }));
    
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/fb/success',
        failureRedirect: '/fb/failure'
    }));
    
    app.get('/fb/success', (req, res) => {
        logger.debug('inside fb success');
        let link = `${values.loginUrl}?username=${values.username}&password=${values.password}&dst=${values.redirectUrl}&popup=false`;
        logger.debug(`link: ${link}`);
        res.redirect(link);
    })
    
    app.get('/fb/failure', (req, res) => {
        res.send('fb failure');
    })
}
