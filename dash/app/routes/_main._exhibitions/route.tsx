import { Outlet } from "@remix-run/react"

export default function Index() {
  return (
    <>
      <h1>Exhibition</h1>
      <Outlet />
    </>
  )
}