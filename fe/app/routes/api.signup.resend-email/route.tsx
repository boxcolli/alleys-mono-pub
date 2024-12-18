import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import { getRandomCode } from "~/.server/code"
import { sendEmailAlreadyTaken, sendEmailSignupCode } from "~/.server/email"
import sessions from "~/.server/sessions"
import { $PATH, $POLICY } from "~/config"
import config from "./config"
import { date, z } from "zod"
import { alerts } from "../auth/alert"

export async function action({ request, context }: ActionFunctionArgs)  {
  const env = context.cloudflare.env

  /**
   * Get session
   */
  try {
    var { getSession, commitSession } = sessions.init(env, "auth")
    var session = await getSession(request.headers.get("Cookie"))

    // Check session expiration
    if (session.id == "") {
      const newSession = await getSession()
      newSession.flash("alert", alerts["signup-session-expired"].name)
      return redirect(
        $PATH.auth.signup,
        { headers: { "Set-Cookie": await commitSession(newSession) }}
      )
    }

    // validate
    const signup = session.get("signup")
    if (!signup) {
      return new Response("internal", { status: 500 })
    }
    var { email, code, verified } = signup
    if (verified) {
      return redirect($PATH.auth.signupData)
    }
  } catch (e) {
    console.error("session auth error", e)
    return new Response("internal", { status: 500 })
  }

  /**
   * Email
   */
  const send_time = new Date()
  try {
    if (code) {
      const code = getRandomCode(
        $POLICY.auth.signup.emailVerifyCodeCharSet,
        $POLICY.auth.signup.emailVerifyCodeLength,
      )
      await sendEmailSignupCode(env, email, code)
      session.set(
        "signup",
        { email, code, verified: null, send_time },
      )
    } else {
      // If session does not have code, the email is already taken.
      await sendEmailAlreadyTaken(env, email)
    }
  } catch (e) {
    console.error("email error", e)
    return new Response("internal", { status: 500 })
  }

  /**
   * Commit session
   */
  try {
    return respond({ send_time })
  } catch (e) {
    console.error("session auth error", e)
    return Response.json({ send_time })
  }

  async function respond(obj: z.infer<typeof config.res.schema>) {
    return Response.json(
      obj,
      { headers: { "Set-Cookie": await commitSession(session) } },
    )
  }
}
