import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import { validationError } from "@rvf/remix"
import { getKysely } from "~/.server/kysely"
import sessions from "~/.server/sessions"
import { $PATH, $POLICY } from "~/config"
import config from "./config"
import { verify_argon2id } from "~/.server/hash"
import { alerts } from "../_main/alert"
import UAParser from "ua-parser-js"

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env
  const result = await config.req.validator.validate(await request.formData())
  if (result.error) { return validationError(result.error, result.submittedData) }

  /**
   * Prepare
   */
  const { email, password: passwordRaw } = result.data
  
  /**
   * User
   */
  try {
    var kysely = getKysely(env)
    var user = await kysely.selectFrom("user")
      .leftJoin("image", "image_id", "image.id")
      .select([
        "user.id", "password_hash",
        "unique_name", "email", "email_verified", "restrict_end_at",
        "image.link"
      ])
      .where("user.email", "=", email)
      .executeTakeFirst()
    
    if (
      !user ||
      user.id == null ||
      !verify_argon2id(user.password_hash, passwordRaw)
    ) {
      return responseMessage("not-found")
    }
  } catch (e) {
    console.error("db select user error", e)
    return responseMessage("internal")
  }

  /**
   * New session
   */
  const now = new Date()
  const expire_at = new Date(now)
  expire_at.setDate(now.getDate() + $POLICY.auth.login.sessionExpiresInDays)
  
  try {
    var { getSession, commitSession } = sessions.init(env, "main")
    var session = await getSession()
    session.set("user", {
      id:               user.id,
      unique_name:      user.unique_name,
      email:            user.email,
      email_verified:   user.email_verified,
      image_link:       user.link ?? null,
      last_login_at:    now,
      expire_at,        
      restrict_end_at:  user.restrict_end_at ?? null,
    })
    session.flash("alert", alerts["login-success"].name)
    var cookie = await commitSession(session)
  } catch (e) {
    console.error("session main error", e)
    return responseMessage("internal")
  }

  /**
   * Insert into user_session
   */
  if (env.WHICH_ENV !== "development") {
    try {
      const ua = UAParser(request.headers.get("User-Agent") ?? "")
      const ip = request.headers.get("CF-Connecting-IP")
      
      await kysely.insertInto("user_session")
        .values({
          id:         (await getSession(cookie)).id,
          storage:    "cf-kv",
          user_id:    user.id,
          browser:    ua.browser.name,
          os:         ua.os.name,
          device:     ua.device.vendor,
          ip:         ip ?? undefined,
          created_at: now,
          updated_at: now,
          expire_at,
        })
        .execute()
    } catch (e) {
      console.error("db insert user_session error", e)
      return responseMessage("internal")
    }
  }

  return redirect(
    $PATH.home,
    { headers: { "Set-Cookie": cookie } },
  )
}

function responseMessage(msg: keyof typeof config.res.msg | string) {
  return validationError({ fieldErrors: { msg }})
}
