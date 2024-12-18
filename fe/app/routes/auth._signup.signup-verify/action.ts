import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import { $PATH, $POLICY } from "~/config"
import config from "./config"
import { validationError } from "@rvf/remix"
import sessions from "~/.server/sessions"

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env
  const parsed = await config.req.validator.validate(await request.formData())
  if (parsed.error) { return validationError(parsed.error, parsed.submittedData) }
  const { code: reqCode } = parsed.data
  /**
   * Session
   */
  try {
    const { getSession, commitSession } = sessions.init(env, "auth")
    const session = await getSession(request.headers.get("Cookie"))
    const signup = session.get("signup")
    if (!signup) {
      return redirect($PATH.auth.signup)
    }

    const { email, code, verified, send_time } = signup
    if (verified) {
      return redirect($PATH.auth.signupData)
    }
    
    // Check code expiration
    if (hasTimePassedThreshold(send_time)) {
      return responseMessage("code-expired")
    }

    // Compare code (the code may not exist)
    if (!code || code !== reqCode) {
      return responseMessage("incorrect")
    }

    session.set("signup", { email, code, verified: true, send_time })
    return redirect(
      $PATH.auth.signupData,
      { headers: { "Set-Cookie": await commitSession(session) } },
    )
  } catch (e) {
    console.error("session auth error", e)
    return responseMessage("internal")
  }
}

function responseMessage(msg: keyof typeof config.res.msg) {
  return validationError({ fieldErrors: { msg }})
}

function hasTimePassedThreshold(time: Date) {
  const mili = $POLICY.auth.signup.emailVerifyCodeExpireSeconds * 1000
  const current = Date.now()
  const t = time.getTime()

  return current - t > mili
}
