import { json, LoaderFunctionArgs, redirect } from "@remix-run/cloudflare"
import sessions from "~/.server/sessions"
import { $PATH } from "~/config"

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env
  const cookieHeader = request.headers.get("Cookie")

  /**
   * Check login status
   */
  try {
    const { getSession, commitSession, destroySession } = sessions.init(env, "main")
    const session = await getSession(cookieHeader)
    if (session.has("user")) {
      return redirect($PATH.home)
    }
  } catch (e) {
    console.error("session main error", e)
    return defaultResponse()
  }

  /**
   * Get signup session
   */
  try {
    var { getSession, commitSession, destroySession } = sessions.init(env, "auth")
    var session = await getSession(cookieHeader)
    var signup = session.get("signup")
  } catch (e) {
    console.error("session auth error", e)
    return defaultResponse()
  }

  /**
   * Handle signup flow redirection
   */
  try {
    const url = new URL(request.url)
    const pathname = url.pathname
    
    if (
      pathname === $PATH.auth.signupVerify ||
      pathname === $PATH.auth.signupData
    ) {
      // The path is either `signup-verify` or `signup-data`
      if (!signup) {
        return redirect($PATH.auth.signup)
      }
    }
  } catch (e) {
    console.error("session auth error", e)
    return defaultResponse()
  }

  /**
   * Check alert
   */
  const alert = session.get("alert")
  if (alert) {
    return json({ alert }, { headers: { "Set-Cookie": await commitSession(session) } })
  }

  return defaultResponse()
}

function defaultResponse() {
  return json({ alert: null })
}