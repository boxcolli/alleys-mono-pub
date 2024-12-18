import { json, LoaderFunctionArgs, redirect } from "@remix-run/cloudflare"
import sessions from "~/.server/sessions"
import { $PATH } from "~/config"

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env

  try {
    const { getSession, commitSession, destroySession } = sessions.init(env, "auth")
    const session = await getSession(request.headers.get("Cookie"))
    console.debug("session data", session.data)
    const reset = session.get("reset")
    if (!reset) {
      return redirect($PATH.auth.reset)
    }
    
    return json({ email: reset.email, sendTime: reset.send_time })
  } catch (e) {
    console.error("session error", e)
    return redirect($PATH.auth.reset)
  }
}
