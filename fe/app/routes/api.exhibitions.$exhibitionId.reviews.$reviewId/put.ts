import { ActionFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import config from "./config"
import { getKysely } from "~/.server/kysely"
import sessions from "~/.server/sessions"
import { sql } from "kysely"
import { alerts } from "../_main/alert"
import { z } from "zod"

export async function put({ params, request, context }: ActionFunctionArgs) {
  invariant(params["exhibitionId"], "exhibitionId missing")
  invariant(params["reviewId"], "reviewId missing")
  const exhibitionId = params["exhibitionId"]
  const reviewId = params["reviewId"]
  const env = context.cloudflare.env

  /**
   * FormData
   */
  const parsed = config.put.req.schema.safeParse(await request.json())
  if (parsed.error) {
    return await respondError("invalid request", 400, "review-update-error")
  }
  const { title, content, is_content_public} = parsed.data

  /**
   * Session
   */
  try {
    var { getSession, commitSession } = sessions.init(env, "main")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "" || !session.data.user) {
      return await respondError("unauthorized", 401, "review-update-error")
    }
    var user = session.data.user
  } catch (e) {
    return await respondError("internal", 500, "review-update-error")
  }

  /**
   * DB update
   */
  const kysely = getKysely(env)
  const now = new Date()
  try {
    var result = await kysely
      .updateTable("review")
      .set({
        title,
        content,
        is_content_public,
        updated_at: now,
      })
      .where("review.user_id", "=", user.id)
      .where("review.id", "=", reviewId)
      .where("review.exhibition_id", "=", exhibitionId)
      .returning("id")
      .executeTakeFirst()

    if (!result) {
      return await respondError("review object not found or not owned by user", 400, "review-update-error")
    }
  } catch (e) {
    console.error("db insert review error", e)
    return await respondError("internal", 500, "review-update-error")
  }

  /**
   * Session Flash
   */
  session.flash("alert", alerts["folder-update-success"].name)
  try {
    return Response.json(
      { review_id: reviewId, created_at: now } satisfies z.infer<typeof config.put.res.schema>,
      { headers: { "Set-Cookie": await commitSession(session) } },
    )
  } catch (e) {
    console.error("session auth error", e)
    return respondError("internal", 500, "review-update-error")
  }

  type PutAlert =
    Extract<keyof typeof alerts, `review-update-${string}`>
  async function respondError(msg: string, status: number, alert: PutAlert) {
    session.flash("alert", alert)
    return new Response(msg, { status, headers: { "Set-Cookie": await commitSession(session) } })
  }
}