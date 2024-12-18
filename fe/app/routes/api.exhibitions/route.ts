import { data, LoaderFunctionArgs } from "@remix-run/cloudflare"
import config from "./config"
import { getKyselyHyperdrive } from "~/.server/kysely"
import { z } from "zod"
import cloud from "@alleys/lib/cloud"

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env
  const url = new URL(request.url)
  const sp = url.searchParams
  let res: z.infer<typeof config.res.schema>

  const parsed = config.req.schema.safeParse(Object.fromEntries(sp.entries()))
  if (parsed.error) {
    res = { err: "wrong search params" }
    return Response.json(res, { status: 400 })
  }
  const req = parsed.data
  if (req.is_count) {
    const result = await getCount(env, req)
    if (result === undefined) {
      res = { err: "internal" }
      return Response.json(res, { status: 500 })
    }

    res = { count: result ?? 0 }
    return res
  } else {
    const result = await getExhibition(env ,req)
    if (result === undefined) {
      res = { err: "internal" }
      return Response.json(res, { status: 500 })
    }

    res = { data: result }
    return res
  }
}

async function getExhibition(env: Env, req: z.infer<typeof config.req.schema>) {
  /**
 * DB
 */
  const kysely = getKyselyHyperdrive(env)  
  try {
    let q = kysely
      .selectFrom("exhibition")
      .leftJoin("image", "exhibition.id", "image.id")
      .select([
        "exhibition.id",
        "exhibition.location_id",
        "exhibition.name_korean",
        "exhibition.price",
        "exhibition.start_date",
        "exhibition.end_date",
      ])

    // Conditions
    if (req.location_ids) {
      q = q.where("exhibition.location_id", "in", req.location_ids)
    }
    if (req.price_min) {
      q = q.where("exhibition.price", ">=", req.price_min)
    }
    if (req.price_max) {
      q = q.where("exhibition.price", "<=", req.price_max)
    }
    if (req.start_min) {
      q = q.where("exhibition.start_date", ">=", req.start_min)
    }
    if (req.start_max) {
      q = q.where("exhibition.start_date", "<=", req.start_max)
    }
    if (req.end_min) {
      q = q.where("exhibition.end_date", ">=", req.end_min)
    }
    if (req.end_max) {
      q = q.where("exhibition.end_date", "<=", req.end_max)
    }

    // Order
    if (req.sort_by && req.sort_to) {
      if (req.sort_by == "start_date") {
        q = q.orderBy("exhibition.start_date", req.sort_to)
      } else {
        q = q.orderBy("exhibition.end_date", req.sort_to)
      }
    } else if (req.sort_by == "end_date") {
      q = q.orderBy("exhibition.end_date", "asc")
    } else {
      // default order
      q = q.orderBy("exhibition.start_date", "asc")
    }

    // Limit
    let size: number
    if (
      req.size &&
      0 < req.size &&
      req.size <= config.policy.maxPageSize
    ) {
      size = req.size
    } else {
      size = config.policy.maxPageSize
    }
    q = q.limit(size)

    // Offset
    if (req.page && 0 < req.page) {
      q = q.offset(size * (req.page - 1))
    }

    // Execute
    const list = await q.execute()
    const exhibitionsPromise = list.map<Promise<z.infer<typeof config.res.data>>>(async ex => {
      try {
        const image = await kysely
          .selectFrom("exhibition_image")
          .leftJoin("image", "exhibition_image.image_id", "image.id")
          .select([
            "image.provider",
            "image.bucket",
            "image.entry",
          ])
          .where("exhibition_image.exhibition_id", "=", ex.id)
          .orderBy("exhibition_image.order asc")
          .limit(1)
          .executeTakeFirst()
        
        if (!image || !image.provider || !image.bucket || !image.entry) {
          return { ...ex, image_link: null }
        }
        const image_link = cloud.getImageLink({
          provider: image.provider,
          bucket: image.bucket,
          entry: image.entry,
        })
        return { ...ex, image_link }
      } catch (e) {
        console.error("db select image error", e)
        return { ...ex, image_link: null }
      }
    })
    return Promise.all(exhibitionsPromise)
  } catch (e) {
    console.error("Hyperdrive error:", e)
    return undefined
  }
}

async function getCount(env: Env, req: z.infer<typeof config.req.schema>) {
  /**
   * DB
   */
  const kysely = getKyselyHyperdrive(env)  
  try {
    let q = kysely
      .selectFrom("exhibition")
      .select(({ fn }) => fn.countAll<number>().as("count"))

    // Conditions
    if (req.location_ids) {
      q = q.where("exhibition.location_id", "in", req.location_ids)
    }
    if (req.price_min) {
      q = q.where("exhibition.price", ">=", req.price_min)
    }
    if (req.price_max) {
      q = q.where("exhibition.price", "<=", req.price_max)
    }
    if (req.start_min) {
      q = q.where("exhibition.start_date", ">=", req.start_min)
    }
    if (req.start_max) {
      q = q.where("exhibition.start_date", "<=", req.start_max)
    }
    if (req.end_min) {
      q = q.where("exhibition.end_date", ">=", req.end_min)
    }
    if (req.end_max) {
      q = q.where("exhibition.end_date", "<=", req.end_max)
    }

    const result = await q.executeTakeFirst()
    return result?.count ?? null
  } catch (e) {
    console.error("Hyperdrive select exhibition error:", e)
    return undefined
  }
}

function getDateStrings() {
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const todayString = today.toISOString().split("T")[0]
  const yesterdayString = yesterday.toISOString().split("T")[0]
  const tomorrowString = tomorrow.toISOString().split("T")[0]

  return {
    today: todayString,
    yesterday: yesterdayString,
    tomorrow: tomorrowString,
  }
}
