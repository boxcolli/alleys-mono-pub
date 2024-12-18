import { json, LoaderFunctionArgs, redirect } from "@remix-run/cloudflare"
import sessions from "~/.server/sessions"
import { $PATH } from "~/config"

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env

  try {
    const { getSession } = sessions.init(env, "auth")
    const session = await getSession(request.headers.get("Cookie"))
    const signup = session.get("signup")
    if (!signup || !signup.verified) {
      return redirect($PATH.auth.signup)
    }
    
    return json({ email: signup.email })
  } catch (e) {
    console.error("session auth error", e)
    return redirect($PATH.auth.signup)
  }
}
