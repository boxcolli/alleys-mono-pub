import config from "./config"
import { alerts } from "../_main/alert"
import { ActionFunctionArgs, json } from "@remix-run/cloudflare"
import { getKysely } from "~/.server/kysely"
import sessions from "~/.server/sessions"
import { sql } from "kysely"
import { z } from "zod"

export async function post({ params, request, context }: ActionFunctionArgs) {
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
    console.error("session main error", e)
    return new Response("internal", { status: 500 })
  }
  const user = session.data.user

  /**
   * FormData
   */
  const reqParse = await config.post.req.validator.validate(await request.formData())
  if (reqParse.error) {
    return await respondError("invalid request", 400, "error")
  }
  const req = reqParse.data
  
  /**
   * DB insert
   */
  const kysely = getKysely(env)
  try {
    const now = new Date()
    const result = await kysely
      .insertInto("folder")
      .values({
        id: sql`uuid_generate_v4()`,
        user_id: user.id,
        name: req.name,
        is_public: req.is_public,
        is_removable: true,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirst()
    if (!result) {
      return await respondError("internal", 500, "error")
    }

    return await respond({ id: result.id })
  } catch (e) {
    return await respondError("internal", 500, "error")
  }

  // helper function
  type AlertKey = Extract<keyof typeof alerts, `folder-${string}` | "error">
  async function respondError(msg: string, status: number, alert: AlertKey) {
    session.flash("alert", alert)
    return new Response(msg, { status, headers: { "Set-Cookie": await commitSession(session)}})
  }
  async function respond(obj: z.infer<typeof config.post.res.schema>) {
    session.flash("alert", alerts["folder-create-success"].name)
    return json(obj, { headers: { "set-Cookie": await commitSession(session) } })
  }
}
