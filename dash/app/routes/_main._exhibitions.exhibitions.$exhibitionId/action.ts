import { getKysely } from "~/.server/kysely"
import config from "./config"
import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import names from "@alleys/lib/names"
import { z } from "zod"

export async function action({ params, request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env
  invariant(params.exhibitionId)
  const exhibitionId = params.exhibitionId
  
  // Parse formData
  const formData = await request.formData()
  const parsed = config.req.schema.safeParse(Object.fromEntries(formData.entries()))
  if (parsed.error) {
    console.info(parsed.error.message)
    return new Response("invalid formData", { status: 400 })
  }

  const action = parsed.data.action
  console.debug("received action:", action)

  switch (action) {
    case "edit":
      return handleEdit(env, exhibitionId, parsed.data, request.url)

    case "about_korean":
      return handleAboutKorean(env, exhibitionId, parsed.data, request.url)

    case "image_delete":
      return handleImageDelete(env, exhibitionId, parsed.data, request.url)
    
    case "image_edit":
      return handleImageEdit(env, exhibitionId, parsed.data, request.url)

    default: {
      return new Response("wrong action", { status: 400 })
    }
  }
}

async function handleEdit(
  env: Env,
  exhibitionId: string,
  d: z.infer<typeof config.edit.schema>,
  myUrl: string,
) {
  const kysely = getKysely(env)
  try {
    const result = await kysely
      .updateTable("exhibition")
      .set("name_korean", d.name_korean)
      .set("name_english", d.name_english)
      .set("name_sum_clean", names.getCleanSum(d.name_korean, [d.name_english]))
      .set("artists_string", d.artists_string)
      .set("start_date", d.start_date)
      .set("end_date", d.end_date)
      .set("is_permanent", d.is_permanent)
      .set("link_korean", d.link_korean)
      .set("link_english", d.link_english)
      .set("location_korean", d.location_korean)
      .set("location_english", d.location_english)
      .set("is_visible", d.is_visible)
      .set("updated_at", new Date())
      .where("id", "=", exhibitionId)
      .returning("id")
      .executeTakeFirst()

    if (!result) {
      return new Response("db update failed", { status: 500 })
    }
  } catch (e) {
    console.error(e, "db update location error")
    return new Response("db update location error", { status: 500 })
  }

  console.info("db update location success")
  return redirect(myUrl)
}

async function handleAboutKorean(
  env: Env,
  exhibitionId: string,
  d: z.infer<typeof config.aboutKorean.schema>,
  myUrl: string,
) {
  const kysely = getKysely(env)

  try {
    const result = await kysely
      .updateTable("exhibition")
      .set("about_korean", d.about_korean)
      .set("updated_at", new Date())
      .where("id", "=", exhibitionId)
      .returning("id")
      .executeTakeFirst()

    if (!result) {
      return new Response("db update failed", { status: 500 })
    }
  } catch (e) {
    console.error(e, "db update exhibition error")
    return new Response("db update exhibition error", { status: 500 })
  }

  console.info("db update exhibition success")
  return redirect(myUrl)
}

async function handleImageDelete(
  env: Env,
  exhibitionId: string,
  d: z.infer<typeof config.imageDelete.schema>,
  myUrl: string,
) {
  const kysely = getKysely(env)

  /**
   * DB Select
   */
  try {
    var select = await kysely
      .selectFrom("image")
      .select("entry")
      .where("id", "=", d.image_id)
      .executeTakeFirst()
    if (!select) return new Response("no such image", { status: 404 })
  } catch (e) {
    console.error("db image select fail:", e)
    return new Response("internal", { status: 500 })
  }

  /**
   * Delete
   */
  const result = await Promise.all([
    /**
     * R2 delete
     */
    (async (entry: string) => {
      try {
        await env.MY_BUCKET.delete(entry)
        return null
      } catch (e) {
        console.error("r2 delete fail:", e)
        return e as Error
      }
    })(select.entry),
    /**
     * DB image delete
     */
    (async () => {
      try {
        await kysely
          .deleteFrom("image")
          .where("id", "=", d.image_id)
          .execute()
        return null
      } catch (e) {
        console.error("db image delete fail:", e)
        return e as Error
      }
    })()
  ])
  for (let v of result) {
    if (v instanceof Error) {
      return new Response("internal", { status: 500 })
    }
  }
  return redirect(myUrl)
}

async function handleImageEdit(
  env: Env,
  exhibitionId: string,
  d: z.infer<typeof config.imageEdit.schema>,
  myUrl: string,
) {
  const kysely = getKysely(env)

  /**
   * Update DB
   */
  const ok = await kysely.transaction().execute(async tx => {
    const promises = d.image_ids.map(async (id, order) => {
      const now = new Date()
      try {
        await tx
          .updateTable("exhibition_image")
          .set("order", order)
          .set("updated_at", now)
          .where("exhibition_id", "=", exhibitionId)
          .where("image_id", "=", id)
          .execute()
      } catch (e) {
        console.error("db exibition_image update fail:", e)
        return false
      }
    })

    await Promise.all(promises)
    return true
  })

  if (!ok) return new Response("internal", { status: 500 })
  return redirect(myUrl)
}
