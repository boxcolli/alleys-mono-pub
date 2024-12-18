import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import sessions from "~/.server/sessions"
import { $PATH, $POLICY } from "~/config"
import config from "./config"
import { validationError } from "@rvf/remix"
import { getKysely } from "~/.server/kysely"
import { hash_argon2id } from "~/.server/hash"
import { alerts } from "../auth/alert"

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env

  const parsed = await config.req.validator.validate(await request.formData())
  if (parsed.error) {
    return validationError(parsed.error, parsed.submittedData)
  }
  const { code, password: passwordRaw } = parsed.data

  /**
   * Session
   */
  try {
    var { getSession, commitSession, destroySession } = sessions.init(env, "auth")
    var session = await getSession(request.headers.get("Cookie"))
    const reset = session.get("reset")
    if (!reset) {
      return redirect($PATH.auth.reset)
    }
    if (hasTimePassedThreshold(reset.send_time)) {
      return responseMessage("expired")
    }
    if (code !== reset.code) {
      return responseMessage("invalid")
    }
    var email = reset.email
  } catch (e) {
    console.error("session error", e)
    return responseMessage("internal")
  }

  /**
   * DB
   */
  const password_hash = hash_argon2id(passwordRaw)
  const kysely = getKysely(env)
  try {
    const user = await kysely
      .updateTable("user")
      .set({
        password_hash,
        updated_at: new Date(),
      })
      .where("email", "=", email)
      .executeTakeFirst()
    if (!user) {
      return responseMessage("internal")
    }
  } catch (e) {
    console.error("db user update error", e)
    return responseMessage("internal")
  }

  /**
   * Session
   */
  try {
    session.unset("reset")
    session.flash("alert", alerts["reset-success"].name)
    return redirect($PATH.auth.login, { headers: { "Set-Cookie": await commitSession(session) } })
  } catch (e) {
    console.error("session error", e)
    return responseMessage("internal")
  }
}

function responseMessage(msg: keyof typeof config.res.msg) {
  return validationError({ fieldErrors: { msg }})
}

function hasTimePassedThreshold(time: Date) {
  const mili = $POLICY.auth.reset.emailVerifyCodeExpireSeconds * 1000
  const current = Date.now()
  const t = time.getTime()

  return current - t > mili
}
