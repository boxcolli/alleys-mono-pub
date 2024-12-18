import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import { $PATH, $POLICY } from "~/config"
import config from "./config"
import { validationError } from "@rvf/remix"
import { getKysely } from "~/.server/kysely"
import { sendEmailResetCode } from "~/.server/email"
import { getRandomCode } from "~/.server/code"
import sessions from "~/.server/sessions"

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env

  /**
   * Req
   */
  const parsed = await config.req.validator.validate(await request.formData())
  if (parsed.error) {
    return validationError(parsed.error, parsed.submittedData)
  }
  const { email } = parsed.data

  /**
   * Find user
   */
  try {
    const kysely = getKysely(env)
    var user = await kysely
      .selectFrom("user")
      .where("email", "=", email)
      .executeTakeFirst()
  } catch (e) {
    console.error("db user select error", e)
    return responseMessage("internal")
  }

  /**
   * Code
   */
  var code = user ? getRandomCode(
    $POLICY.auth.reset.emailVerifyCodeCharSet,
    $POLICY.auth.reset.emailVerifyCodeLength,
  ) : null

  /**
   * session
   */
  try {
    const { getSession, commitSession, destroySession } = sessions.init(env, "auth")
    const session = await getSession()
    session.set("reset", { email, code, send_time: new Date() })
    var cookie = await commitSession(session)
  } catch (e) {
    console.error("session error", e)
    return responseMessage("internal")
  }

  /**
   * Email
   */
  new Promise(async () => {
    if (!code) return
    try {
      await sendEmailResetCode(env, email, code)
    } catch (e) {
      console.error("email error", e)
    }  
  })

  return redirect($PATH.auth.resetVerify, { headers: { "Set-Cookie": cookie } })
}

function responseMessage(msg: keyof typeof config.res.msg) {
  return validationError({ fieldErrors: { msg }})
}
