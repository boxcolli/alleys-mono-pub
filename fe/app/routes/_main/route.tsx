import { Outlet, useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import { $PATH } from "~/config"
import { loader } from "./loader"
import { alerts } from "./alert"
import { Alert } from "~/components"
import { useCallback, useState } from "react"
import { UniqueAvatar } from "~/components"
import classes from "./styles.module.css"

export { loader }

export default function Page() {
  const navigate = useNavigate()
  const logoutFetcher = useFetcher()
  const logoutSubmitting = logoutFetcher.state !== "idle"

  const { user, alert: alertKey } = useLoaderData<typeof loader>()
  const alert = (
    alertKey && alertKey in alerts
      ? alerts[alertKey as keyof typeof alerts]
      : null
  )
  
  /**
   * Drawer
   */
  const [isOpen, setIsOpen] = useState(false)
  const toggleDrawer = useCallback(() => {
    setIsOpen((prev) => !prev)
    console.log({ isOpen })
  }, [isOpen])

  return (
    <>
      <header className={classes["app-bar"]}>
        <nav className="prefix suffix">
          <a href={$PATH.home}>
            <div />
            <h2 className="logo small primary-text">ALLEYS</h2>
          </a>
          <div className="max"></div>
          <div className={classes["nav-menu"]}>
            <a href={$PATH.main.exhibitions}>
              <button className="transparent extra">
                <i>wall_art</i>
                <span className="m l">전시</span>
              </button>
            </a>
            <a href="#">
              <button className="transparent extra">
                <i>flag</i>
                <span className="m l">장소</span>
              </button>
            </a>
          </div>
          <button className="secondary circle extra" onClick={toggleDrawer}>
            {user ? (
              <UniqueAvatar
                name={user.unique_name}
                color={user.unique_color}
                image_link={user.image_link ?? undefined}
              />
            ) : (
              <i>menu</i>
            )}
          </button>
        </nav>
      </header>

      {/* Drawer */}
      <div className={`overlay ${isOpen ? "active" : ""}`} onClick={toggleDrawer}></div>
      <dialog className={`right ${isOpen ? "active" : ""}`}>
        <nav className="drawer responsive">
          <div className="row right-align">
            <button className="transparent circle extra" onClick={toggleDrawer}>
              <i>close</i>
            </button>
          </div>
        </nav>
        {user? (
            <>
              <header>
                <nav>
                  <div className={classes["avatar-in-drawer"]}>
                  <UniqueAvatar
                    name={user.unique_name}
                    color={user.unique_color}
                    image_link={user.image_link ?? undefined}
                  />
                  </div>
                  
                  <h3 className="small">{user.unique_name}님</h3>
                </nav>
              </header>
              <div className="small-padding" />
              <a className="row padding wave">
                <i>rate_review</i>
                내가 쓴 후기
              </a>
              <a className="row padding wave">
                <i>folder</i>
                나만의 리스트
              </a>
              <hr />
              <a href="" className="row padding wave">
                <i>person</i>
                내 계정
              </a>
              <div className="padding" />
              <button
                disabled={logoutSubmitting}
                onClick={() => logoutFetcher.submit(
                  {}, { method: "put", action: $PATH.api.auth.logout })
                }
                className="transparent small-round small"
              >
                {logoutSubmitting
                  ? <progress className="circle small" />
                  : "로그아웃"
                }
              </button>
              
            </>
          ) : (
            <>
              <a className="row padding round"
              href={$PATH.auth.login}
              >
                <i>login</i>
                <span>로그인</span>
              </a>
              <a className="row padding round"
                href={$PATH.auth.signup}
              >
                <i>edit_square</i>
                <span className="">회원가입</span>
              </a>
            </>
          )}
      </dialog>

      <main className={`responsive no-padding ${classes["main-container"]}`}>
        <Outlet />
      </main>
      
      {alert && <Alert
        type={alert.type}
        message={alert.msg}
        removeAfterMili={3000}
      />}
    </>
  )
}
