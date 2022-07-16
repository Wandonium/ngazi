import { render, screen, waitFor } from "@testing-library/react"
import Login from "./components/hotspot/login/login"
import { BrowserRouter as Router } from "react-router-dom"

test("Video should be renderd from azure blob store", async () => {
  render(
    <Router>
      <Login />
    </Router>
  )
  setTimeout(async () => {
    expect(screen.getByTestId("myVideo").src).toContain(
      /https:\/\/ngazi.blob.core.windows.net/
    )
  }, 4000)
})
