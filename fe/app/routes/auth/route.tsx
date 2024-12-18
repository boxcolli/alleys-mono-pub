import "swiper/css"
import classes from "./styles.module.css"

import { $PATH } from "~/config"
import { Outlet, useLoaderData } from "@remix-run/react"
import { Alert } from "~/components"
import { alerts } from "./alert"
import { loader } from "./loader"

export { loader }

export default function Page() {
  const { alert } = useLoaderData<typeof loader>()
  const alertObject = (alert && alert in alerts)
    ? alerts[alert as keyof typeof alerts]
    : null

  return (
    <>
      <header className="small-padding">
        <nav className="row center-align">
          <a
            href={$PATH.home}
            className=""
            target="_blank"
          >
            <h1 className="logo inverse-primary-text">ALLEYS</h1>
          </a>
        </nav>
      </header>

      <main className="responsive padding">
        <div className={`center ${classes["layout"]}`}>
          <Outlet />
        </div>
      </main>

      {alertObject && <Alert
        type={alertObject.type}
        message={alertObject.msg}
        removeAfterMili={3000}
      />}
    </>
  )
}
