import config from "./config"
import { ActionFunctionArgs, json } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import sessions from "~/.server/sessions";
import { alerts } from "../_main/alert";
import { getKysely } from "~/.server/kysely";

export async function del({ params, request, context }: ActionFunctionArgs) {
  invariant(params["folderId"])
  const folderId = params["folderId"]
  const env = context.cloudflare.env

  /**
   * Open session
   */
  try {
    var { getSession, commitSession } = sessions.init(env, "main")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "" || !session.data.user) {
      return new Response("unauthorized", { status: 403 })
    }
  } catch (e) {
    return new Response("internal", { status: 500 })
  }
  const user = session.data.user

  /**
   * DB delete
   */
  const kysely = getKysely(env)
  try {
    const result = await kysely
      .deleteFrom("folder")
      .where("folder.id", "=", folderId)
      .where("folder.user_id", "=", user.id)
      .where("folder.is_removable", "=", true)
      .returning("folder.id")
      .executeTakeFirst()
    if (!result) {
      return await respondError("folder is not removable", 403)
    }
    
  } catch (e) {
    console.error("db delete folder error", e)
    return await respondError("internal", 500)
  }

  return await respond()

  // helper function
  async function respondError(msg: string, status: number) {
    try {
      session.flash("alert", alerts["error"].name)
      return new Response(
        msg,
        { status, headers: { "Set-Cookie": await commitSession(session)}},
      )
    } catch (e) {
      console.error("session main error", e)
      return new Response(msg, { status })
    }
  }
  async function respond() {
    try {
      session.flash("alert", alerts["folder-delete-success"].name)
      return new Response(
        "ok",
        { headers: { "set-Cookie": await commitSession(session) } },
      )
    } catch (e) {
      console.error("session main error", e)
      return new Response("ok")
    }
  }
}
