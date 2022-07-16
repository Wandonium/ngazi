import "./home.css"
import logo from "./ngazi_logo.png"
import tvAds from "./services-tv-ads.jpeg"
import wifiAds from "./services-wifi-ads.jpg"
import contactUs from "./contacts-us.jpeg"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faTimes, faEnvelope } from "@fortawesome/free-solid-svg-icons"
import {
  faWhatsapp,
  faInstagram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons"
import { useState, useEffect } from "react"
import { Helmet } from "react-helmet-async"

const Home = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [viewMore1, setViewMore1] = useState(false)
  const [viewMore2, setViewMore2] = useState(false)

  useEffect(() => {
    // console.log('window object: ', window);
    window.addEventListener("scroll", onScroll)
  }, [])

  const onScroll = () => {
    let semiCircle = document.getElementById("semi-circle")
    let r = document.querySelector(":root")
    if (
      document.body.scrollTop > 50 ||
      document.documentElement.scrollTop > 50
    ) {
      r.style.setProperty("--nav-bg-color", "rgba(255, 255, 255, 0.9")
      semiCircle.style.opacity = 0
    } else {
      r.style.setProperty("--nav-bg-color", "transparent")
      semiCircle.style.opacity = 0.5
    }
  }

  const toggleMenu = () => {
    let r = document.querySelector(":root")
    let rs = getComputedStyle(r)
    let translateX = rs.getPropertyValue("--translateX")
    let width = window.innerWidth
    let xValue
    if (translateX === "0" && width <= 768) {
      xValue = "-150%"
      setShowMenu(false)
      r.style.setProperty("--translateX", xValue)
    } else if (width <= 768) {
      xValue = "0"
      setShowMenu(true)
      r.style.setProperty("--translateX", xValue)
    }
  }

  const onViewMore1 = () => {
    setViewMore1(!viewMore1)
    let tvMore = document.getElementById("tv-more")
    let wifiMore = document.getElementById("wifi-more")
    if (!viewMore1) {
      tvMore.style.display = "block"
      wifiMore.style.display = "none"
      if (viewMore2) setViewMore2(!viewMore2)
    } else {
      tvMore.style.display = "none"
    }
  }

  const onViewMore2 = () => {
    setViewMore2(!viewMore2)
    let wifiMore = document.getElementById("wifi-more")
    let tvMore = document.getElementById("tv-more")
    if (!viewMore2) {
      wifiMore.style.display = "block"
      tvMore.style.display = "none"
      if (viewMore1) setViewMore1(!viewMore1)
    } else {
      wifiMore.style.display = "none"
    }
  }

  return (
    <div onScroll={onScroll}>
      <Helmet>
        <title>Ngazi Media | Transit Advertising Services</title>
        <meta
          name='description'
          content='Ngazi Media. Home of Transit Advertising in East Africa.'
        />
        <link rel='canonical' href='/' />
      </Helmet>
      <section id='home'>
        <header>
          <FontAwesomeIcon
            icon={showMenu ? faTimes : faBars}
            id='hamburger'
            onClick={toggleMenu}
          />
          <img src={logo} alt='Ngazi Logo' className='logo' />
          <nav>
            <div className='nav-items-container'>
              <a href='#home' onClick={toggleMenu}>
                Home
              </a>
              <a href='#about' onClick={toggleMenu}>
                About
              </a>
              <a href='#services' onClick={toggleMenu}>
                Services
              </a>
              <a href='#contacts' onClick={toggleMenu}>
                Contacts
              </a>
            </div>
          </nav>
        </header>
        <div id='semi-circle'></div>
        <div className='hm-txt'>
          <h1 className='hm-txt'>
            <p className='hm-txt-top'>transit advertising services for</p>
            <p className='hm-txt-top'>small businesses across africa</p>
          </h1>

          <div className='hm-divider'></div>
          <p className='hm-txt-bt'>geo target & reach</p>
          <p className='hm-txt-bt'>your audience on the move</p>
        </div>
      </section>

      <section id='about'>
        <div className='corner-t'>
          <div className='horiz'></div>
          <div className='vert'></div>
        </div>
        <article>
          <h2>About us</h2>
          <div>
            <p>
              Ngazi is an <b>advertising platform</b> for small businesses in
              Africa. We place digital adverts on in-bus screens, giving small
              businesses the ability to advertise to over 1.2 million unique
              transit passengers per day in Nairobi, Kenya’s capital city.
            </p>
            <p>
              We have partnered with various public transport firms across the
              country to serve as the <b>distribution network</b> for these
              adverts.
            </p>
          </div>
        </article>

        <div className='corner-b'>
          <div className='vert'></div>
          <div className='horiz'></div>
        </div>
      </section>

      <section id='services'>
        <h2>our services</h2>
        <div className='services'>
          <div className='left'>
            <img src={tvAds} alt='public transport on screen adverts' />
            <p>Public transport On-Screen adverts</p>
            <button onClick={onViewMore1}>
              view {viewMore1 ? "less" : "more"}
            </button>
            <div id='tv-more'>
              Our platform places 10 - 15 second video ads in between visual
              entertainment segments eg DJ music mixes. The screens are always
              running through the day hence ensuring that client adverts are
              continuously exposed to different audiences.
            </div>
          </div>
          <div className='space-bt'></div>
          <div className='right'>
            <img src={wifiAds} alt='public transport wifi ads' />
            <p>Public transport Wifi adverts</p>
            <button onClick={onViewMore2}>
              view {viewMore2 ? "less" : "more"}
            </button>
            <div id='wifi-more'>
              We offer free Wi-Fi on public transport, placing video and/or
              graphic ads to be accessed by your audiences as they connect to
              our public Wi-Fi every time they use the service and at intervals
              of 15 minutes through their stay on the platform
            </div>
          </div>
        </div>
      </section>

      <section id='contacts'>
        <h2 id='grow'>
          Grow your business with <span>Ngazi</span>
        </h2>
        <div className='contacts'>
          <img src={contactUs} alt='free wifi poster on matatu' />
          <div className='contact-links'>
            <h2>contact us</h2>
            <hr />
            <a href='mailto:info@ngazi.media' target='_blank' rel='noreferrer'>
              <div className='mail'>
                <FontAwesomeIcon icon={faEnvelope} id='mail' />
              </div>
              <p>info@ngazi.media</p>
            </a>
            <hr />
            <a
              href='https://wa.me/+254725418049'
              target='_blank'
              rel='noreferrer'>
              <div className='whatsapp'>
                <FontAwesomeIcon icon={faWhatsapp} id='whatsapp' />
              </div>
              <p>
                <span>+</span>
                254 725 418 049
              </p>
            </a>
            <hr />
            <div className='social-media'>
              <h2>social media</h2>
              <a
                href='https://www.instagram.com/ngazi_media/'
                target='_blank'
                rel='noreferrer'>
                <FontAwesomeIcon icon={faInstagram} id='instagram' />
              </a>
              <a
                href='https://www.linkedin.com/company/ngazi-media/posts/?feedView=all'
                target='_blank'
                rel='noreferrer'>
                <FontAwesomeIcon icon={faLinkedin} id='linkedIn' />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
