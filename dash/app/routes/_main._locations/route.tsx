import { Outlet } from "@remix-run/react"

export default function Index() {
  return (
    <>
      <h1>Location</h1>
      <Outlet />
    </>
  )
}