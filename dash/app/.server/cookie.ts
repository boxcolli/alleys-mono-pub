import { createCookie } from "@remix-run/cloudflare"

const auth = createCookie(
  "auth",
  { maxAge: 604_800 },
)

export default { auth }
