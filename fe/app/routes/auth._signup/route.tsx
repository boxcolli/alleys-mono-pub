import { Outlet } from "@remix-run/react"

export default function Page() {
  return (
    <>
      <h2>회원가입</h2>
      <Outlet />
    </>
  )
}
