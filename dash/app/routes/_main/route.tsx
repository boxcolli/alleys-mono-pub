import { Outlet, useLoaderData } from "@remix-run/react"
import { $PATH } from "~/config"
import { loader } from "./loader"
import { Ticker } from "./Ticker"

export { loader }

export default function Index() {
  const { expireAt } = useLoaderData<{ expireAt: Date | null }>()

  return (
    <>
      <header>
        <a href={$PATH.home}><h1>ALLEYS</h1></a>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {expireAt && <Ticker target={new Date(expireAt)} />}
        </div>
        
        <nav>
          <ul>
            <li><a href={$PATH.main.exhibitions}>Exhibition</a></li>
            <li><a href={$PATH.main.locations}>Location</a></li>
            <li><a href={$PATH.main.images}>Image</a></li>
            <li><a href={$PATH.main.users}>User</a></li>
          </ul>
        </nav>
      </header>
      
      <main>
        <Outlet />
      </main>
    </>
  )
}
