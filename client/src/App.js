import "./App.css"
import React, { useState, useEffect } from "react"
import {
  BrowserRouter as Router,
  Route,
  Switch,
  useLocation,
} from "react-router-dom"
import Login from "./components/hotspot/login/login"
import Home from "./components/home/home.js"
import CreateAdvert from "./components/advert/createAdvert.js"
import MusicVideo from './components/musicVideo/musicVideo.js';
import Playlist from './components/playlist/playlist.js';


let APP_URL = process.env.REACT_APP_BASE_URL;

// A custom hook that builds on useLocation to parse
// the query string for you.
function useQuery() {
  return new URLSearchParams(useLocation().search)
}

function App() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch(APP_URL + "/api/users")
      .then((res) => res.json())
      .then((users) => {
        console.log("APP_URL: ", APP_URL)
        // console.log("users: ", users)
        setUsers(users)
      })
      .catch((err) => console.log("err: ", err))
  }, [])

  return (
    <Router>
      <Switch>
        <Route path='/hotspot/login'>
          <Login
            useQuery={useQuery}
            appUrl={APP_URL}
          />
        </Route>
        <Route path='/advert/create'>
          <CreateAdvert backendUrl={APP_URL} />
        </Route>
        <Route path='/playlist/create'>
          <Playlist backendUrl={APP_URL} />
        </Route>
        <Route path='/music_video/create'>
          <MusicVideo backendUrl={APP_URL} />
        </Route>
        <Route path='/data'>
          <Users users={users} />
        </Route>
        <Route path='/'>
          <Home />
        </Route>
      </Switch>
    </Router>
  )
}

const Users = (data) => {
  let users = data.users
  return (
    <div className='App'>
      <h1>Users</h1>
      {users.map((user) => (
        <div key={user.id}>{user.username}</div>
      ))}
    </div>
  )
}

export default App
