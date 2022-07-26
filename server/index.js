const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const passport = require("passport")
const session = require("express-session")
const mongodb = require("mongodb")
const axios = require("axios")
const { DateTime } = require("luxon")
const logger = require('./util/logger');

const users = require("./routes/users.route.js")
const adViews = require("./routes/adviews.route.js")
const adverts = require("./routes/adverts.route.js")
const notifications = require("./routes/notifications.route.js")
const devices = require("./routes/devices.route.js")
const adQueue = require("./routes/adqueue.route.js")
const tvAppApks = require("./routes/tvAppApks.route.js")
const simcards = require("./routes/simcards.route.js")
const musicVideos = require('./routes/musicVideos.route.js')
const playlist = require('./routes/playlist.route.js');
const androidAppLogins = require('./routes/androidAppLogin.route.js');

const UsersDAO = require("./dao/users.dao.js")
const AdViewDAO = require("./dao/adviews.dao.js")
const AdvertsDAO = require("./dao/advert.dao.js")
const ImagesDAO = require("./dao/image.dao.js")
const VideosDAO = require("./dao/video.dao.js")
const NotificationsDAO = require("./dao/notifications.dao.js")
const AdQueueDAO = require("./dao/adqueue.dao.js")
const DevicesDAO = require("./dao/devices.dao.js")
const TvAppApksDAO = require("./dao/tvAppApks.dao.js")
const SimCardsDAO = require("./dao/simcards.dao.js")
const PlaylistDAO = require("./dao/playlist.dao.js");
const AndroidAppLogins = require("./dao/androidAppLogins.js");

let values = {
  macAddress: "",
  ipAddress: "",
  loginUrl: "http://hotspot.local/login",
  redirectUrl: "",
  loginError: "",
  username: "admin",
  password: "8b155f70a1164d244fe2429c5ed4a8ef",
}

const app = express()
const MongoClient = mongodb.MongoClient
const port = process.env.PORT || 5000

dotenv.config()
app.use(express.json())
app.use("/image_uploads", express.static("image_uploads"))
app.use("/tv_app_apks", express.static("tv_app_apks"))
app.use("/logs", express.static("logs"));
app.use(cors())

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
)
app.use(passport.initialize())
app.use(passport.session())

MongoClient.connect(process.env.NGAZI_DB_URI, { wtimeoutMS: 2500 })
  .catch((err) => {
    logger.error(err.stack)
    process.exit(1)
  })
  .then(async (client) => {
    await UsersDAO.injectDB(client)
    await AdViewDAO.injectDB(client)
    await AdvertsDAO.injectDB(client)
    await ImagesDAO.injectDB(client)
    await VideosDAO.injectDB(client)
    await NotificationsDAO.injectDB(client)
    await AdQueueDAO.injectDB(client)
    await DevicesDAO.injectDB(client)
    await TvAppApksDAO.injectDB(client)
    await SimCardsDAO.injectDB(client)
    await PlaylistDAO.injectDB(client)
    await AndroidAppLogins.injectDB(client)
    app.listen(port, () => {
      logger.info(`listening on port ${port}`)
    })
  })

require("./auth/facebook.auth.js")(passport, values, app)
require("./auth/google.auth.js")(passport, values, app)
require("./auth/twitter.auth.js")(passport, values, app)

app.get("/", (req, res) => {
  res.send("Successful response.")
})

app.get("/api/users", (req, res) => {
  res.json([
    {
      id: 1,
      username: "Carry Swisher",
    },
    {
      id: 2,
      username: "Bob Aldarock",
    },
  ])
})

app.use("/api/v1/users", users)
app.use("/api/v1/adviews", adViews)
app.use("/api/v1/adverts", adverts)
app.use("/api/v1/notifications", notifications)
app.use("/api/v1/devices", devices)
app.use("/api/v1/adqueue", adQueue)
app.use("/api/v1/tvAppApks", tvAppApks)
app.use("/api/v1/simcards", simcards)
app.use("/api/v1/musicVideos", musicVideos)
app.use("/api/v1/playlist", playlist)
app.use("/api/v1/androidAppLogins", androidAppLogins);


app.post("/api/hotspot/login",(req, res) => {
  try {
    const { loginFields, userId } = req.body;

    logger.debug(`req.body: ${JSON.stringify(req.body, null, 2)}`);
    logger.debug(`loginFields: ${JSON.stringify(loginFields, null, 2)}`);
    logger.debug(`userId: ${userId}`);

    if (userId === 'None') {
      // this is a new user so we create the user in DB
      const newUser = {
        firstName: null,
        lastName: null,
        profileProvider: 'cookie',
        providerId: 'cookie-id',
        email: null,
        picture: null,
        macAddress: loginFields.macAddress,
        ipAddress: loginFields.ipAddress
      };
      UsersDAO.addUser(newUser)
      .then(data => {
        logger.info(`create new user by cookie data: ${JSON.stringify(data, null, 2)}`);
        res.json({
          status: 'success',
          userId: data.insertedId,
          isNewUser: true
        });
      })
      .catch(err => {
        logger.error(`create new user by cookie error: ${err}`);
        // here we return a JSON failure object rather than a 500 error so that
        // the front-end does not hang and fail to show the adverts.
        res.json({
          status: 'failure',
          userId: 'None',
          isNewUser: true,
          error: 'Failed to create new user! ' + err.message
        });
      });
    } else {
      // this is an existing user so we look for them in the DB using the 
      // userId from the cookie. If we find them then we return a success response.
      // Otherwise we return a failure JSON object, again, so as not to hang the front-end.
      UsersDAO.getUsersById(userId)
      .then(data => {
        logger.info(`find user by userId cookie: ${JSON.stringify(data, null, 2)}`);
        if(!data) {
          res.json({
            status: 'failure',
            userId: 'None',
            isNewUser: false,
            error: 'Fatal Error! Failed to find user by the userId cookie!'
          });
        } else {
          res.json({
            status: 'success',
            userId: data._id,
            isNewUser: false,
          });
        }
      })
    }
  } catch (error) {
    logger.error(error.message)
    res.status(500).send("Login details not received correctly")
  }
})

app.get("/upload_url", (req, res) => {
  const advert_name = req.query.name
  console.log("advert_name: ", advert_name)
  let url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_CLIENT_ID}/stream/direct_upload`
  const date = DateTime.now().setZone("Africa/Nairobi")
  const offset = date.offset + 10
  const datePlusTenMinutes = date.plus({ minutes: offset }).toString()

  // Send a POST request
  axios({
    method: "post",
    url: url,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN,
    },
    data: {
      maxDurationSeconds: 3600,
      expiry: new Date(datePlusTenMinutes).toISOString(),
      requireSignedURLs: false,
      allowedOrigins: [],
      thumbnailTimestampPct: 0.568427,
      watermark: {
        uid: "",
      },
      meta: {
        name: advert_name,
      },
    },
  })
    .then((data) => {
      let response = data.data.result
      console.log("get advert video upload url response: ", response)
      res.json({
        status: "success",
        data: response,
      })
    })
    .catch((err) => {
      console.log("err: ", err)
      res.json({
        status: "failure",
        error: err,
      })
    })
})

app.use("*", (req, res) =>
  res.status(404).json({ error: "endpoint/route not found" })
)
