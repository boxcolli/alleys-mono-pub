import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import { validationError } from "@rvf/remix"
import { $PATH, $POLICY } from "~/config"
import config from "./config"
import { getKysely } from "~/.server/kysely"
import { hash_argon2id } from "~/.server/hash"
import sessions from "~/.server/sessions"
import { alerts as authAlerts } from "../auth/alert"
import UAParser from "ua-parser-js"
import { alerts as mainAlerts } from "../_main/alert"
import { sql } from "kysely"

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env
  
  const parsed = await config.req.validator.validate(await request.formData())
  if (parsed.error) {
    return validationError(parsed.error, parsed.submittedData)
  }
  /**
   * Data
   */
  const {
    email: emailRequested,
    unique_name,
    password: passwordRaw
  } = parsed.data
  const now = new Date()

  /**
   * Validate auth session
   */
  const cookieHeader = request.headers.get("Cookie")
  const authSessionObj = sessions.init(env, "auth")
  const mainSessionObj = sessions.init(env, "main")
  try {
    var authSession = await authSessionObj.getSession(request.headers.get("Cookie"))
    const signup = authSession.get("signup")
    if (
      !signup ||
      signup.email !== emailRequested ||
      !signup.verified
    ) {
      // Reset session
      var newSession = await authSessionObj.getSession()
      newSession.flash("alert", authAlerts["signup-session-expired"].name)
      return redirect(
        $PATH.auth.signup,
        { headers: { "Set-Cookie": await authSessionObj.commitSession(newSession) } },
      )
    }
    var { email } = signup
  } catch (e) {
    console.error("session auth fail", e)
    return responseMessage("internal")
  }

  /**
   * Password
   */
  const password_hash = hash_argon2id(passwordRaw)

  /**
   * DB create user
   */
  const kysely = getKysely(env)
  try {
    var user = await kysely
      .insertInto("user")
      .values({
        id: sql`uuid_generate_v4()`,
        unique_name,
        email,
        email_verified: true,
        password_hash,
        created_at: now,
        updated_at: now,
      })
      .onConflict(oc => oc.column("unique_name").doNothing())
      .returning("id")
      .executeTakeFirst()
    
    if (!user) {
      return responseMessage("unique-name-taken")
    }
  } catch (e) {
    console.error("db user insert error", e)
    return responseMessage("internal")
  }

  /**
   * Login Session
   */
  const expire_at = new Date()
  expire_at.setDate(now.getDate() + $POLICY.auth.login.sessionExpiresInDays)
  try {
    var mainSession = await mainSessionObj.getSession()
    mainSession.set("user", {
      id:               user.id,
      email,
      email_verified:   true,
      unique_name,
      restrict_end_at:  null,
      last_login_at:    now,
      expire_at,
      image_link:       null,
    })
    mainSession.flash("alert", mainAlerts["signup-success"].name)
    
    // Update session
    var [mainCookie, authCookie] = await Promise.all([
      mainSessionObj.commitSession(mainSession),
      authSessionObj.destroySession(authSession)
    ])
  } catch (e) {
    console.error("session main error", e)

    // Signup was successful but session was not made.
    // Notify user that account is created and ask for login.
    try {
      const newAuthSession = await authSessionObj.getSession(cookieHeader)
      newAuthSession.flash("alert", authAlerts["signup-error-after-success"].name)
      return redirect(
        $PATH.auth.login,
        { headers: { "Set-Cookie": await authSessionObj.commitSession(newAuthSession) } },
      )
    } catch (e) {
      console.error("session auth error", e)
      return redirect($PATH.auth.login)
    }
  }

  /**
   * DB create user_session
   */
  if (env.WHICH_ENV !== "development") {
    try {
      const ua = UAParser(request.headers.get("User-Agent") ?? "")
      const ip = request.headers.get("CF-Connecting-IP")
  
      await kysely
        .insertInto("user_session")
        .values({
          id:         (await mainSessionObj.getSession(mainCookie)).id,
          storage:    "cf-kv",
          user_id:    user.id,
          browser:    ua.browser.name,
          os:         ua.os.name,
          device:     ua.device.vendor,
          ip:         ip ?? undefined,
          expire_at,
          created_at: now,
          updated_at: now,
        })
        .execute()
    } catch (e) {
      console.error("db user_session error", e)

      // Signup was successful but session was not made.
      // Notify user that user's account is created and ask for login.
      try {
        const newAuthSession = await authSessionObj.getSession(cookieHeader)
        newAuthSession.flash("alert", authAlerts["signup-error-after-success"].name)
        return redirect(
          $PATH.auth.login,
          { headers: { "Set-Cookie": await authSessionObj.commitSession(newAuthSession) } },
        )
      } catch (e) {
        console.error("session auth error", e)
        return redirect($PATH.auth.login)
      }
    }
  }

  return redirect(
    $PATH.home,
    {
      headers: [
        ["Set-Cookie", mainCookie],
        ["Set-Cookie", authCookie],
      ],
    },
  )
}

function responseMessage(message: keyof typeof config.res.msg) {
  return validationError({ fieldErrors: { message }})
}
