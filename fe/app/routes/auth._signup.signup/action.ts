import { ActionFunctionArgs, json, redirect } from "@remix-run/cloudflare"
import sessions from "~/.server/sessions"
import { $PATH, $POLICY } from "~/config"
import config from "./config"
import { validationError } from "@rvf/remix"
import { validateTurnstile } from "~/.server/turnstile"
import { getKysely } from "~/.server/kysely"
import { sendEmailAlreadyTaken, sendEmailSignupCode } from "~/.server/email"
import { getRandomCode } from "~/.server/code"

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env
  const parsed = await config.req.validator.validate(await request.formData())
  if (parsed.error) { return validationError(parsed.error, parsed.submittedData) }
  const { token, email } = parsed.data

  /**
   * Turnstile
   */
  {
    const ip = request.headers.get("CF-Connecting-IP") ?? undefined
    const pass = validateTurnstile({ env, token, ip })
    if (!pass) {
      return responseMessage("turnstile-fail")
    }
  }

  /**
   * DB
   */
  const kysely = getKysely(env)
  try {
    var user = await kysely
      .selectFrom("user")
      .where("email", "=", email)
      .executeTakeFirst()
  } catch (e) {
    console.error(e, "db user select error")
    return responseMessage("internal")
  }

  /**
   * Email
   */
  var code = !user ? getRandomCode(
    $POLICY.auth.signup.emailVerifyCodeCharSet,
    $POLICY.auth.signup.emailVerifyCodeLength,
  ) : null
  new Promise(async () => {
    try {
      if (code) {
        await sendEmailSignupCode(env, email, code)
      } else {
        await sendEmailAlreadyTaken(env, email)
      }
    } catch (e) {
      console.error("email send error", e)
    }
  })

  /**
   * Session
   */
  try {
    const { getSession, commitSession, destroySession } = sessions.init(env, "auth")
    const session = await getSession()
    session.set("signup", { email, code, send_time: new Date(), verified: false })
    var cookie = await commitSession(session)
    
  } catch (e) {
    console.error("session auth error", e)
    return responseMessage("internal")
  }

  return redirect($PATH.auth.signupVerify, { headers: { "Set-Cookie": cookie } })
}

function responseMessage(msg: keyof typeof config.res.msg) {
  return validationError({ fieldErrors: { msg }})
}
