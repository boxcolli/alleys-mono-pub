import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import { getKysely } from "~/.server/kysely"
import sessions from "~/.server/sessions"
import { alerts } from "~/routes/_main/alert"
import { $PATH } from "~/config"

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env

  /**
   * Get Session
   */
  try {
    var { getSession, commitSession, destroySession } = sessions.init(env, "main")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "") {
      return new Response("user is not logged in", { status: 409 })
    }
  } catch (e) {
    console.error("session main error", e)
    return new Response("internal", { status: 500 })
  }

  /**
   * DB
   */
  if (env.WHICH_ENV !== "development") {
    try {
      const kysely = getKysely(env)
      const userSession = await kysely
        .deleteFrom("user_session")
        .where("id", "=", session.id)
        .where("storage", "=", "cf-kv")
        .executeTakeFirst()
      
      if (!userSession) {
        // ...
      }
    } catch (e) {
      console.error("db delete user_session error", e)
      return new Response("internal", { status: 500 })
    }
  }

  /**
   * Destroy Session
   */
  try {
    // const session = await getSession()
    // session.flash("alert", alerts["logout-success"].name)
    return redirect(
      $PATH.home,
      { headers: { "Set-Cookie": await destroySession(session) } },
    )
  } catch (e) {
    console.error("session auth error", e)
    return redirect($PATH.home)
  }
}
