import { ActionFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import config from "./config"
import { getKysely } from "~/.server/kysely"
import sessions from "~/.server/sessions"
import { sql } from "kysely"
import { alerts } from "../_main/alert"
import { z } from "zod"

export async function del({ params, request, context }: ActionFunctionArgs) {
  invariant(params["exhibitionId"], "exhibitionId missing")
  invariant(params["reviewId"], "reviewId missing")
  const exhibitionId = params["exhibitionId"]
  const reviewId = params["reviewId"]
  const env = context.cloudflare.env

  /**
   * Session
   */
  try {
    var { getSession, commitSession } = sessions.init(env, "main")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "" || !session.data.user) {
      return await respondError("unauthorized", 401, "review-error")
    }
    var user = session.data.user
  } catch (e) {
    return await respondError("internal", 500, "review-error")
  }

  /**
   * DB delete
   */
  const kysely = getKysely(env)
  try {
    var result = await kysely
      .deleteFrom("review")
      .where("review.user_id", "=", user.id)
      .where("review.id", "=", reviewId)
      .where("review.exhibition_id", "=", exhibitionId)
      .returning("id")
      .executeTakeFirst()

    if (!result) {
      return await respondError("review object not found or not owned by user", 400, "review-error")
    }
  } catch (e) {
    console.error("db insert review error", e)
    return await respondError("internal", 500, "review-error")
  }

  /**
   * Session Flash
   */
  session.flash("alert", alerts["folder-delete-success"].name)
  try {
    return Response.json(
      { review_id: reviewId } satisfies z.infer<typeof config.del.res.schema>,
      { headers: { "Set-Cookie": await commitSession(session) } },
    )
  } catch (e) {
    console.error("session auth error", e)
    return respondError("internal", 500, "review-error")
  }

  type DelAlert =
    Extract<keyof typeof alerts, `review-delete-${string}`> |
    Extract<keyof typeof alerts, `review-error`>
  async function respondError(msg: string, status: number, alert: DelAlert) {
    session.flash("alert", alert)
    return new Response(msg, { status, headers: { "Set-Cookie": await commitSession(session) } })
  }
}