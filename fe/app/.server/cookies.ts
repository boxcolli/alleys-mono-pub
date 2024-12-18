import { createCookie } from "@remix-run/cloudflare"
import { FESession } from "@alleys/lib/session/fe"

const getTypeSafeName = (name: FESession.Session) => name

const main = createCookie(
  getTypeSafeName("main"),
  {
    maxAge: 5_184_000,  // 60d
    path: "/",
    sameSite: true,
    secure: false,
  },
)

const auth = createCookie(
  getTypeSafeName("auth"),
  {
    maxAge: 7_200,      // 2h
    path: "/",
    sameSite: true,
    secure: false,
  },
)

export default { main, auth }
