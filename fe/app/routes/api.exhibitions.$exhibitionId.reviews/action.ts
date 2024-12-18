import { ActionFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import config from "./config"
import { getKysely } from "~/.server/kysely"
import sessions from "~/.server/sessions"
import { sql } from "kysely"
import { alerts } from "../_main/alert"
import { z } from "zod"

export async function action({ params, request, context }: ActionFunctionArgs) {
  invariant(params["exhibitionId"], "exhibition id missing")
  const exhibition_id = params["exhibitionId"]
  const env = context.cloudflare.env

  if (request.method !== "POST") {
    return await respondError("method not available", 405, "review-create-error")
  }

  /**
   * Req
   */
  const parsed = config.post.req.schema.safeParse(await request.json())
  if (parsed.error) {
    return await respondError("invalid request", 400, "review-create-error")
  }
  const { title, content, is_content_public} = parsed.data

  /**
   * Session
   */
  try {
    var { getSession, commitSession } = sessions.init(env, "main")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "" || !session.data.user) {
      return await respondError("unauthorized", 401, "review-create-error")
    }
    var user = session.data.user
  } catch (e) {
    return await respondError("internal", 500, "review-create-error")
  }

  /**
   * DB insert
   */
  const kysely = getKysely(env)
  const now = new Date()
  try {
    var result = await kysely
      .insertInto("review")
      .values({
        id: sql`uuid_generate_v4()`,
        exhibition_id,
        user_id: user.id,
        title,
        content,
        is_content_public,
        created_at: now,
        updated_at: now,
      })
      .onConflict(oc => oc
        .columns(["user_id", "exhibition_id"])
        .doNothing()
      )
      .returning(["id", "created_at"])
      .executeTakeFirst()

    if (!result) {
      return await respondError("conflict", 409, "review-create-error")
    }
  } catch (e) {
    console.error("db insert review error", e)
    return await respondError("internal", 500, "review-create-error")
  }

  /**
   * Session Flash
   */
  session.flash("alert", alerts["review-create-success"].name)
  try {
    return Response.json(
      {
        id: result.id,
        created_at: result.created_at,
      } satisfies z.infer<typeof config.post.res.schema>,
      { headers: { "Set-Cookie": await commitSession(session) } },
    )
  } catch (e) {
    console.error("session auth error", e)
    return respondError("internal", 500, "review-create-error")
  }

  type CreateAlert =
    Extract<keyof typeof alerts, `review-create-${string}`>
  async function respondError(msg: string, status: number, alert: CreateAlert) {
    try {
      session.flash("alert", alert)
      return new Response(msg, { status, headers: { "Set-Cookie": await commitSession(session) } })
    } catch (e) {
      console.error("session main error", e)
      return new Response(msg, { status })
    }
  }
}
