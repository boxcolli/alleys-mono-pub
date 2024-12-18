import { Outlet } from "@remix-run/react"

export default function Index() {
  return (
    <>
      <h1>Image</h1>
      <Outlet />
    </>
  )
}