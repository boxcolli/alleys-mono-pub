import { getKyselyHyperdrive } from "~/.server/kysely"
import config from "./config"
import { LoaderFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
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
        "review.is_content_public",
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

    const result = await q.execute()
    const filtered = result.map<z.infer<typeof config.get.res.data>>(v => {
      if (!v.is_content_public) {
        return {
          review_id:    v.review_id,
          title:        v.title,
          content:      null,
          created_at:   v.created_at,
          user_id:      v.user_id,
          unique_name:  v.unique_name,
        }
      }
      return {
        review_id:    v.review_id,
        title:        v.title,
        content:      v.content,
        created_at:   v.created_at,
        user_id:      v.user_id,
        unique_name:  v.unique_name,
      } satisfies z.infer<typeof config.get.res.data>
    })
    return respond({ reviews: filtered })
  } catch (e) {
    console.error("db select review error", e)
    return new Response("internal", { status: 500 })
  }

  function respond(res: z.infer<typeof config.get.res.schema>) {
    return Response.json(res)
  }
}