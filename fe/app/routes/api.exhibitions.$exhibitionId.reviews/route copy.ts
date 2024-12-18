import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import config from "./config"
import { getKysely, getKyselyHyperdrive } from "~/.server/kysely"
import sessions from "~/.server/sessions"
import { sql } from "kysely"
import { alerts } from "../_main/alert"
import { z } from "zod"

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  invariant(params["exhibitionId"], "exhibition id missing")
  const exhibition_id = params["exhibitionId"]
  const env = context.cloudflare.env

  /**
   * Refine search params
   */
  const sp = new URL(request.url).searchParams
  const parsed = config.get.req.schema.safeParse(Object.fromEntries(sp.entries()))
  if (parsed.error) {
    return new Response("invalid search params", { status: 400 })
  }
  let { page, size, sort } = parsed.data
  {
    if (!page || page < 1) {
      page = 1
    }
    if (!size || size < 1 || config.get.policy.maxSize < size) {
      size = config.get.policy.defaultSize
    }
    if (!sort) {
      sort = "recent"
    }
  }

  /**
   * DB select review
   */
  const kysely = getKyselyHyperdrive(env)
  try {
    let q = kysely
      .selectFrom("review")
      .leftJoin("user", "review.user_id", "user.id")
      .select([
        "review.id as review_id",
        "review.title",
        "review.content",
        "review.created_at",
        "user.id as user_id",
        "user.unique_name",
      ])
      .$narrowType<{ user_id: string, unique_name: string }>()
      .where("review.exhibition_id", "=", exhibition_id)
    
    q = q
      .orderBy("created_at", "desc")
    
    q = q
      .limit(size)
      .offset(size * (page - 1))

    return response({ data: await q.execute() })
  } catch (e) {
    console.error("db select review error", e)
    return new Response("internal", { status: 500 })
  }

  function response(res: z.infer<typeof config.get.res.schema>) {
    return Response.json(res)
  }
}

export async function action({ params, request, context }: ActionFunctionArgs) {
  invariant(params["exhibitionId"], "exhibition id missing")
  const exhibition_id = params["exhibitionId"]
  const env = context.cloudflare.env
  const kysely = getKysely(env)

  const formData = await request.formData()
  const parsed = config.post.req.schema.safeParse(Object.fromEntries(formData.entries()))
  if (parsed.error) {
    return response("invalid request", 400, "review-create-error")
  }
  const { content, is} = parsed.data

  async function response(msg: string, status: number, alert: Extract<keyof typeof alerts, `review-create-${string}`>) {
    session.flash("alert", alert)
    return new Response(msg, { status, headers: { "Set-Cookie": await commitSession(session) } })
  }

  /**
   * Session
   */
  try {
    var { getSession, commitSession } = declareSession(env, "__main_session")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "" || !session.data.user) {
      return await respond("unauthorized", 401, "review-error")
    }
    var user = session.data.user
  } catch (e) {
    return await respond("internal", 500, "review-error")
  }

  /**
   * Delete review
   */
  if (request.method === "DELETE") {
    try {
      const res = await kysely
        .deleteFrom("review")
        .where("user_id", "=", session.data.user.id)
        .where("exhibition_id", "=", exhibition_id)
        .returning("id")
        .executeTakeFirst()
      
      if (!res) {
        return await respond("not found", 404, "review-error")
      }
    } catch (e) {
      logger.error(e, "db delete review error")
      return await respond("internal", 500, "review-error")
    }

    try {
      session.flash("alert", alerts["review-delete-success"].name)
      return new Response("ok" satisfies z.infer<typeof config.del.res>, { headers: { "Set-Cookie": await commitSession(session) } })
      // return redirect(request.url, { headers: { "Set-Cookie": await commitSession(session) } })
    } catch (e) {
      logger.error(e, "session commit error")
      return await respond("internal", 500, "review-error")
    }
  }

  const reqParse = config.put.req.safeParse(await request.json())
  if (!reqParse.success) {
    return await respond("invalid request", 400, "review-error")
  }
  const req = reqParse.data
  logger.info(req)
  
  /**
   * Update review
   */
  if (req.id) {
    try {
      var res = await kysely
        .updateTable("review")
        .set("title", req.title)
        .set("content", req.content)
        .set("is_public", req.is_public)
        .set("updated_at", new Date())
        .where("exhibition_id", "=", exhibition_id)
        .where("user_id", "=", user.id)
        .returning(["id", "created_at"])
        .executeTakeFirst()

      if (!res) {
        return await respond("not found", 404, "review-update-error")
      }
    } catch (e) {
      logger.error(e, "db update review error")
      return await respond("internal", 500, "review-update-error")
    }

    try {
      session.flash("alert", alerts["review-create-success"].name)
      return json({
        id: res.id,
        created_at: res.created_at,
      } satisfies z.infer<typeof config.put.res>,
      { headers: { "Set-Cookie": await commitSession(session)}})
    } catch (e) {
      logger.error(e, "session commit error")
      return await respond("internal", 500, "review-update-error")
    }
  }

  /**
   * Create review
   */
  {
    try {
      const now = new Date()
      var res = await kysely
        .insertInto("review")
        .values({
          id: sql`uuid_generate_v4()`,
          exhibition_id,
          user_id: user.id,
          title: req.title,
          content: req.content,
          is_public: req.is_public,
          created_at: now,
          updated_at: now,
        })
        .onConflict(oc => oc
          .columns(["user_id", "exhibition_id"])
          .doNothing()
        )
        .returning(["id", "created_at"])
        .executeTakeFirst()
        
      if (!res) {
        return await respond("conflict", 409, "review-create-error")
      }
    } catch (e) {
      logger.error(e, "db insert review error")
      return await respond("internal", 500, "review-create-error")
    }
  
    try {
      session.flash("alert", alerts["review-create-success"].name)
      return json({
        id: res.id,
        created_at: res.created_at,
      } satisfies z.infer<typeof config.put.res>,
      { headers: { "Set-Cookie": await commitSession(session)}})
    } catch (e) {
      logger.error(e, "session commit error")
      return await respond("internal", 500, "review-create-error")
    }
  }
}
