import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare"
import sessions from "~/.server/sessions"
import { $PATH } from "~/config"

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env

  /**
   * Session
   */
  try {
    const { getSession, destroySession } = sessions.init(env, "auth")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "") {
      console.debug("Session is empty")
      return redirect($PATH.auth)
    }

    const expireAt = session.get("expire_at")
    const expireDate = expireAt ? new Date(expireAt) : null
    if (!expireDate || isNaN(expireDate.getTime()) || new Date() > expireDate) {
      return redirect(
        $PATH.auth,
        { headers: { "Set-Cookie": await destroySession(session) } },
      )
    }

    return Response.json({ expireAt })
  } catch (e) {
    console.error("session read fail", e)
    return redirect($PATH.auth)
  }
}
