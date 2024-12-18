import config from "./config"
import { ActionFunctionArgs, json } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import sessions from "~/.server/sessions"
import { alerts } from "../_main/alert"
import { getKysely } from "~/.server/kysely"

export async function put({ params, request, context }: ActionFunctionArgs) {
  invariant(params["folderId"])
  const folderId = params["folderId"]
  const env = context.cloudflare.env

  /**
   * Validate session
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
   * FormData
   */
  const formData = await request.formData()
  const parsed = config.put.req.schema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return await respondError("invalid request", 400)
  }
  const { name, is_public } = parsed.data
  if (!name && !is_public) {
    return await respond()
  }

  /**
   * DB update
   */
  const kysely = getKysely(env)
  try {
    let q = kysely
      .updateTable("folder")

    if (name) {
      q = q.set("folder.name", name)
    }
    if (is_public) {
      q = q.set("folder.is_public", is_public)
    }

    const result = await q
      .where("folder.id", "=", folderId)
      .where("folder.user_id", "=", user.id)
      .returning("folder.id")
      .executeTakeFirst()
    if (!result) {
      return await respondError("not found", 404)
    }
  } catch (e) {
    console.error("db update folder error", e)
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
      session.flash("alert", alerts["folder-update-success"].name)
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
