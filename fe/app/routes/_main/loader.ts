import { json, LoaderFunctionArgs } from "@remix-run/cloudflare"
import { getUniqueColor } from "~/.server/colorize"
import { getKysely } from "~/.server/kysely"
import sessions from "~/.server/sessions"
import { $POLICY } from "~/config"

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env

  /**
   * Session
   */
  try {
    var { getSession, commitSession, destroySession } = sessions.init(env, "main")
    var session = await getSession(request.headers.get("Cookie"))

    // not found
    if (session.id === "") {
      return json({ user: null, alert: null })
    }

    // simple assert
    var user = session.get("user") ?? null
    var alert = session.get("alert") ?? null
    if (!user) {
      return json({ user, alert })
    }
  } catch (e) {
    console.error("session main error", e)
    return json({ user: null, alert: null })
  }

  // memo
  const responseData = {
    user: {
      id: user.id,
      unique_name: user.unique_name,
      restrict_end_at: user.restrict_end_at,
      image_link: user.image_link ?? null,
      unique_color: await getUniqueColor(user.unique_name),
    },
    alert,
  }

  const threshold = (
    new Date(user.last_login_at).getTime()
     + $POLICY.main.index.updateUserLastLoginAtThresholdHours
      * 3600 * 1000
  )
  if (threshold > Date.now()) {
    const now = new Date()

    /**
     * DB update
     */
    try {
      const kysely = getKysely(env)
      kysely.updateTable("user_session")
      .set({
        last_login_at: new Date,
        updated_at: new Date,
      })
      .where("id", "=", session.id)
      .where("storage", "=", "cf-kv")
      .execute()
    } catch (e) {
      console.error("kysely update user_session error", e)
      return json(responseData)
    }

    /**
     * Session update
     */
    try {
      session.set("user", {
        ...user,
        last_login_at: new Date(),
      })
      var cookie = await commitSession(session)
    } catch (e) {
      console.error("session update user error", e)
      return json(responseData)
    }
    
    return json(responseData, { headers: { "Set-Cookie": cookie } })
  }

  return json(responseData)
}
