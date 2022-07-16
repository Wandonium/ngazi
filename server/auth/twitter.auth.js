const UsersDAO = require('../dao/users.dao.js');
const AdViewDAO = require('../dao/adviews.dao.js');
const UserCtrl = require('../controllers/users.controller.js');
const logger = require('../util/logger');
const passportTwitter = require("passport-twitter");
const mongodb = require('mongodb');
const { getDate } = require('../util/util.js');

const ObjectId = mongodb.ObjectID;

module.exports = (passport, values, app) => {

    const TwitterStrategy = passportTwitter.Strategy;

    passport.use(new TwitterStrategy({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.TWITTER_CALLBACK_URL,
        includeEmail: true,
    }, function(token, tokenSecret, profile, done) {
        logger.info(`twitter user profile: ${profile._json}`);
        logger.info(`macAddress: ${values.macAddress}`);
        let filters = {};
        if(profile._json.email) {
            filters = {email: profile._json.email};
        } else {
            filters = {providerId: profile._json.id}
        }
        logger.info(`twitter filters: ${filters}`);
        // get users from DB who have the current email address
        UsersDAO.getUsers({
            filters, 
            page: 0, 
            usersPerPage: 20
        }).then(data => {
            logger.info(`users by email: ${data}`);
            if(data.usersList.length > 1) {
                // more than one user with the same email address in DB
                logger.error(`Fatal Error! User has more than one entry/record in 
                the Users DB Collection/Table: ${data.usersList[0]}`);
                return done(null, profile);
            } else if(data.usersList.length === 0 && data.totalNumUsers === 0) {
                // no users found in db with the provided email address
                // so we create a new user
                if(values.macAddress != '') {

                    UserCtrl.apiCreateUser(profile._json, values.macAddress, values.ipAddress, 'twitter')
                    .then(data => {
                        logger.info(`create new user from twitter in mongodb data: ${data}`);
                        let newUserId = data.insertedId.toString();
                        logger.info(`new user id: ${newUserId}`);
                        const viewedAt = getDate();
                        AdViewDAO.addAdView(
                            new ObjectId(), 
                            viewedAt, 
                            newUserId, 
                            new ObjectId()
                        ).then(data => {
                            logger.info(`create new adview from creating new twitter user: ${data}`);
                            return done(null, profile);
                        }).catch(err => {
                            logger.error(`error while creating new adview from creating new twitter user: ${err}`);
                            return done(null, profile);
                        })
                    })
                    .catch(err => {
                        logger.error(`create new user from twitter in mongodb error: ${err}`);
                        return done(null, profile);
                    });
                } else {
                    logger.error(`Cannot create new user using an empty mac address.`);
                    return done(null, profile);
                }
            } else {
                // user found in DB with the current email address
                let oldUser = data.usersList[0];
                let macs = oldUser.mac_addresses;
                logger.info(`macs: ${macs}`);
                if(values.macAddress !== '') {
                    if(macs.includes(values.macAddress)) {
                        logger.error(`Fatal Error! Tried creating new user but 
                            Mac Address already exist in DB! Check if /api/hotspot/login 
                            route did not work!`);
                        return done(null, profile);
                    } else {
                        // add current mac address to user's list of mac addresses
                        let newUser = {...oldUser};
                        let newMacs = oldUser.mac_addresses.slice();
                        newMacs.push(values.macAddress);
                        newUser.mac_addresses = newMacs;
                        logger.info(`newUser: ${newUser}`);
                        UsersDAO.updateUser(newUser).then(data => {
                            logger.info(`updated user mac address in twitter login: ${data}`);
                            const viewedAt = getDate();
                            let newUserId = newUser._id.toString();
                            AdViewDAO.addAdView(
                                new ObjectId(),
                                viewedAt, 
                                newUserId, 
                                new ObjectId()
                            ).then(data => {
                                logger.info(`create new adview from updating twitter user: ${data}`);
                                return done(null, profile);
                            }).catch(err => {
                                logger.error(`error while creating new adview from updating twitter user: ${err}`);
                                return done(null, profile);
                            })
                        }).catch(err => {
                            logger.error(`error while updating user mac address in twitter login: ${err}`);
                            return done(null, profile);
                        })
                    }
                } else {
                    logger.error("Cannot add empty mac address to user's list of mac addresses");
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
    
    app.get('/auth/twitter', passport.authenticate('twitter'));
    
    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/twitter/success',
        failureRedirect: '/twitter/failure'
    }));
    
    app.get('/twitter/success', (req, res) => {
        logger.debug('inside twitter success');
        let link = `${values.loginUrl}?username=${values.username}&password=${values.password}&dst=${values.redirectUrl}&popup=false`;
        logger.info(`link: ${link}`);
        res.redirect(link);
    })
    
    app.get('/twitter/failure', (req, res) => {
        res.send('twitter failure');
    })
}
