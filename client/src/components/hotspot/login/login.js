/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router"
import "./login.css"
import logo from "../../../Ngazi_logo_circular.png"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faVolumeUp, faVolumeMute } from "@fortawesome/free-solid-svg-icons"
import Loading from "../loading/loading"
import { BlobServiceClient } from "@azure/storage-blob"
import Cookies from "js-cookie"
import { Helmet } from "react-helmet-async"

// A custom hook that builds on useLocation to parse
// the query string for you.
function useQuery() {
  return new URLSearchParams(useLocation().search)
}
function Login(props) {
  let query = useQuery()
  const [userId, setUserId] = useState("")

  const mac = query.get("mac")
  const ip = query.get("ip")
  const url = query.get("url")
  const dst = query.get("dst")
  const error = query.get("error")
  const username = query.get("username")
  const password = query.get("password")
  const deviceId = query.get("deviceId")

  const [muted, setMuted] = useState(true)
  const [timer, setTimer] = useState(10)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)
  const [bannerAd, setBannerAd] = useState(null)
  const [longitude, setLongitude] = useState("")
  const [latitude, setLatitude] = useState("")
  const [videoLink, setVideoLink] = useState("")

  const backendUrl = props.appUrl
  const player = useRef(null)

  useEffect(() => {
    console.log("userId cookie: ", Cookies.get("userId"))
    let userId = ""
    // first check if the userId cookie exists at all
    if (Cookies.get("userId")) {
      // if it exists, send it to the backend server so that
      // we check if a user exists with that user Id.
      userId = Cookies.get("userId")

      // check expiration date, if today is the expiration day minus one day
      // then we create a new cookie with the same userId that expires a year from now.
      let expires = Cookies.get("expirationDate")
      let exDate = new Date(expires)
      let today = new Date()
      let previousDay = new Date(exDate.setDate(exDate.getDate() - 1))

      if (today > previousDay) {
        console.log("replacing cookie...")
        Cookies.remove("userId")
        Cookies.remove("expirationDate")
        Cookies.set("userId", userId, { expires: 365 })
        let dt = new Date()
        let expires = new Date(dt.setFullYear(dt.getFullYear() + 1))
        Cookies.set("expirationDate", expires)
        console.log("expiratonDate: ", Cookies.get("expirationDate"))
        console.log("userId: ", Cookies.get("userId"))
      }
    } else {
      // if doesn't exits then send None to backend server so that
      // we can get back a new user's Id and create the cookie with it
      userId = "None"
    }
    let loginFields = {
      macAddress: mac,
      ipAddress: ip,
      loginUrl: url,
      redirectUrl: dst,
      loginError: error,
      username,
      password,
      deviceId,
    }

    const requestOptions = {
      method: "POST",
      // credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginFields, userId }),
    }
    fetch(backendUrl + "/api/hotspot/login", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log("hotspot login response: ", data)
        if (data.userId !== "None" && !data.error) {
          if (data.isNewUser) {
            // console.log('Creating new userId cookie....');
            Cookies.set("userId", data.userId, { expires: 365 })
            let dt = new Date()
            let expires = new Date(dt.setFullYear(dt.getFullYear() + 1))
            // console.log('expires b4 creating cookie: ', expires);
            Cookies.set("expirationDate", expires)
          }
          setUserId(data.userId)
        }
        getBlobFiles()
        getGeoLocation()
      })
      .catch((err) => console.error("error: ", err))

    if (!player.current) {
      // do componentDidMount logic
    } else {
      const video = player.current
      video.onplay = () => {
        setLoading(false)
        setTimer(10)
      }
    }
  }, [])

  useEffect(() => {
    // exit early when we reach 0
    if (!timer || loading) {
      return
    }

    const myVid = player.current
    myVid.onwaiting = () => {
      setLoading(true)
    }
    myVid.onplaying = () => {
      setLoading(false)
    }

    if (timer === 1) {
      const closeVid = document.getElementById("closeVid")
      closeVid.style.display = "block"
    }

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setTimer(timer - 1)
    }, 1000)

    // add timeLeft as a dependency to re-rerun the effect
    // when we update it
    // clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId)
  }, [timer, loading])

  const getGeoLocation = () => {
    fetch(
      `https://api.geoapify.com/v1/ipinfo?apiKey=${process.env.REACT_APP_GEOAPIFY_API_KEY}`,
      {
        method: "GET",
      }
    )
      .then(function (response) {
        return response.json()
      })
      .then(function (data) {
        // console.log('latitude: ', data.location?.latitude);
        // console.log('longitude: ', data.location?.longitude);
        setLatitude(data.location?.latitude)
        setLongitude(data.location?.longitude)
      })
  }

  // AZURE BLOB FUNCTIONALITY
  const getBlobFiles = async () => {
    // Create an instance of azure blob client and pass the sas code for authentication
    const blobService = new BlobServiceClient(
      `https://ngazi.blob.core.windows.net/${process.env.REACT_APP_BLOB_STORE_SECRET_SAS_KEY}`
    )

    // Create an instance of the container containing our files
    const containerClient = blobService.getContainerClient("ngazi-files")

    // Loop through each file/blob and set it to our state as a complete url
    let blobs = containerClient.listBlobsFlat({
      prefix: "media/AdTech/Mobile TV Banners (336 × 280 px)",
    })
    const links = []
    for await (const blob of blobs) {
      links.push(
        `https://ngazi.blob.core.windows.net/ngazi-files/${blob.name}${process.env.REACT_APP_BLOB_STORE_SECRET_SAS_KEY}`
      )
    }
    const randomBanner = links[Math.floor(Math.random() * links.length)]
    // console.log("bannerAd: ", randomBanner)
    setBannerAd(randomBanner)
    let videoblobs = await containerClient.listBlobsFlat({
      prefix: "media/Bond Video (480 × 260 px).mp4",
    })
    for await (const blob of videoblobs) {
      let vidLink = `https://ngazi.blob.core.windows.net/ngazi-files/${blob.name}${process.env.REACT_APP_BLOB_STORE_SECRET_SAS_KEY}`;
      // console.log('videoLink: ', vidLink)
      setVideoLink(vidLink)
    }
  }

  const closeModal = () => {
    let modal = document.getElementById("myModal")
    modal.style.display = "none"
    const video = player.current
    video.pause()
    console.log('userId: ', userId);
  }

  const unmute = () => {
    // console.log("muted: ", muted)
    setMuted(!muted)
  }

  const handleCheckbox = () => {
    setChecked(!checked)
    let warning = document.getElementById("warning")
    if (!checked) warning.style.display = "none"
    else warning.style.display = "block"
    // console.log("checked: ", checked)
  }

  return (
    <div className='center main'>
      <Helmet>
        <title>Hotspot Login</title>
        <meta name='description' content='Login in to use our hotspot' />
        <link rel='canonical' href='/hotspot/login' />
      </Helmet>
      <div className='header'>
        <h1 className='by-line'>Powered by</h1>
        <img src={logo} alt='Ngazi Logo' className='logo2' />
      </div>
      <div id='myModal' className='modal center'>
        <div className='instructions'>
          <p>
            You can close the video in
            <span className='timer'> {timer} </span>
            seconds
          </p>
          <a href='#' onClick={unmute} className='link'>
            Click here to {muted ? "unmute" : "mute"} Video
          </a>
          <a
            href='#'
            onClick={closeModal}
            id='closeVid'
            className='closeVid link'>
            [CLOSE VIDEO]
          </a>
        </div>
        <div className='modal-content center'>
          <FontAwesomeIcon
            icon={muted ? faVolumeMute : faVolumeUp}
            id='unmute'
            onClick={unmute}
          />
          {loading && (
            <div id='loading'>
              <Loading />
            </div>
          )}
          <video
            data-testid='myVideo'
            id='myVideo'
            ref={player}
            autoPlay={true}
            muted={muted}
            src={videoLink && videoLink}
          />
        </div>
      </div>
      <div id='otherModal' className='modal center'>
        <div id='loading'>
          <Loading />
        </div>
      </div>
      <div className='banner-d center'>
        <img className='banner' src={bannerAd} alt='Banner Advert' />
      </div>
      <div>
        <div className='center'>
          <div className='policy'>
            <input
              type='checkbox'
              value='policy'
              name='policy'
              checked={checked}
              onChange={handleCheckbox}
            />
            <span> </span>
            <label style={{ textAlign: "center" }}>
              I <strong>ACCEPT</strong> the terms and conditions of the
              <a href='#'> User Agreement</a> and
              <a href='#'> Privacy Policy</a>
            </label>
          </div>
          <br />
          <p id='warning' className='warning'>
            You must accept the terms and conditions before logging in!
          </p>
          <p className='inst'>
            If you lose your internet connection please go to
            <a href='http://captive.apple.com'> captive.apple.com </a>
            on your browser to come back to this page and login again.
          </p>
          <p className='inst'>
            <a href='sms:+254 708 072 998'>Click here</a> to text the system
            admin in case of any issues. Click the button below to get internet
            access.
          </p>
          {/* {userId ? ( */}
            <a
              href='#'
              className='fblogin btn txt-center'
              onClick={(event) => {
                event.preventDefault()
                let otherModal = document.getElementById("otherModal")
                let warning = document.getElementById("warning")
                if (checked) {
                  warning.style.display = "none"
                  otherModal.style.display = "block"
                  // console.log("backend: " + backendUrl)
                  const requestOptions = {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      adId: Math.floor(Math.random() * 100000 + 1),
                      userId,
                      deviceId,
                      type: "WIFI"
                    }),
                  }
                  fetch(backendUrl + "/api/v1/adviews", requestOptions)
                    .then((response) => response.json())
                    .then((data) => {
                      console.log("create adview for user response: ", data)
                      // let link = `${url}?username=${username}&password=${password}&dst=${dst}&popup=false&chap-challenge=chapChallenge&chap-id=chapId`;
                      let link = `${url}?username=${username}&password=${password}&dst=https://bit.ly/358z5gQ&popup=false&chap-challenge=chapChallenge&chap-id=chapId`
                      // console.log("link: ", link)
                      window.location = link
                    })
                    .catch((err) => console.error("error: ", err))
                } else {
                  warning.style.display = "block"
                }
              }}>
              Login
            </a>
          {/* ) : (
            <button className='fblogin btn txt-center'>Login</button>
          )} */}
        </div>
      </div>
    </div>
  )
}

export default Login
