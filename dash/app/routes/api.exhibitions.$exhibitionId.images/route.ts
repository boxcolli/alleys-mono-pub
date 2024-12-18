import { ActionFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import { getKysely } from "~/.server/kysely"
import { parseMultipartFormData } from "~/.server/multipart"
import config from "./config"
import { sql } from "kysely"
import r2 from "@alleys/cf/r2"

export async function action(args: ActionFunctionArgs) {
  const { params, request, context } = args
  invariant(params.exhibitionId)
  const exhibitionId = params.exhibitionId
  const env = context.cloudflare.env
  const kysely = getKysely(env)

  /**
   * Find exhibition
   */
  try {
    const find = await kysely
      .selectFrom("exhibition")
      .select("id")
      .where("id", "=", exhibitionId)
      .executeTakeFirst()
    if (!find) {
      return new Response("no such exhibition", { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return new Response("internal", { status: 500 })
  }

  switch (request.method) {
    case "POST":  return await post(args)
    case "PUT":   return await put(args)
    default:      return new Response("not implemented", { status: 404 })
  }
}

async function post({ params, request, context }: ActionFunctionArgs) {
  invariant(params.exhibitionId)
  const exhibitionId = params.exhibitionId
  const env = context.cloudflare.env
  const kysely = getKysely(env)

  /**
   * Find exhibition
   */
  try {
    const find = await kysely
      .selectFrom("exhibition")
      .select("id")
      .where("id", "=", exhibitionId)
      .executeTakeFirst()
    if (!find) {
      return new Response("no such exhibition", { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return new Response("internal", { status: 500 })
  }

  /**
   * Find max order value
   */
  try {
    const find = await kysely
      .selectFrom("exhibition_image")
      .select(eb => eb.fn.max<number>("order").as("maxOrder"))
      .where("exhibition_id", "=", exhibitionId)
      .executeTakeFirst()
    if (!find) {
      return new Response("no such exhibition", { status: 404 })
    }
    var { maxOrder } = find
  } catch (e) {
    console.error(e)
    return new Response("db fail", { status: 500 })
  }

  /**
   * Parse MultipartFormData
   */
  try {
    var fileNameWithoutExt = `${exhibitionId}-${maxOrder + 1}`
    var formData = await parseMultipartFormData({
      request,
      fileInputName: config.post.names.image,
      fileNameWithoutExt: "",
      handleFile: async (blob, contentType) => {
        // Upload to R2
        const result = await env.MY_BUCKET.put(
          `exhibition/${fileNameWithoutExt}.${contentType.split("/")[1]}`,
          blob,
          { httpMetadata: { contentType } },
        )
        console.info("R2:", Object.entries(result))
        return result.key
      },
    })
  } catch (e) {
    console.error("parseMultipartFormData fail", e)
    return new Response("parseMultipartFormData fail", { status: 500 })
  }

  /**
   * Parse FormData
   */
  {
    const parsed = config.post.schema.safeParse(Object.fromEntries(formData))
    if (parsed.error) {
      return new Response("invalid request", { status: 400 })
    }
    var data = parsed.data
    if (data.image == null) {
      return new Response("image upload failed", { status: 500 })
    }
    var entry = data.image
  }

  /**
   * DB
   */
  try {
    await kysely.transaction().execute(async tx => {
      const now = new Date()
      const image = await tx
        .insertInto("image")
        .values({
          id:           sql`uuid_generate_v4()`,
          ...r2.pro.loadValues(entry),
          source:       data.source,
          source_link:  data.source_link,
          description:  data.description,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirst()
      
      if (!image) throw "failed to insert into image"
      
      const result = await tx
        .insertInto("exhibition_image")
        .values({
          exhibition_id: exhibitionId,
          image_id: image.id,
          order: maxOrder + 1,
          created_at: now,
          updated_at: now,
        })
        .returning("image_id")
        .executeTakeFirst()
      
        if (!result) throw "failed to insert into exhibition_image"
    })
  } catch (e) {
    console.error("db insert into image failed", e)
    await env.MY_BUCKET.delete(entry)
    return new Response("db insert into image failed", { status: 500 })
  }

  return new Response("ok")
}

async function put({ params, request, context }: ActionFunctionArgs) {
  invariant(params.exhibitionId)
  const exhibitionId = params.exhibitionId
  const env = context.cloudflare.env
  const kysely = getKysely(env)

  /**
   * FormData
   */
  const parsed = config.put.schema.safeParse(Object.fromEntries(await request.formData()))
  if (parsed.error) {
    return new Response("invalid request", { status: 400 })
  }
  const data = parsed.data
  const now = new Date()

  /**
   * DB Update
   */
  const updatePromises = data.image_ids.map(async (image_id, order) => {
    try {
      const result = await kysely
        .updateTable("exhibition_image")
        .set("order", order)
        .set("updated_at", now)
        .where("exhibition_id", "=", exhibitionId)
        .where("image_id", "=", image_id)
        .returning("image_id")
        .executeTakeFirst()
      if (!result) return null

      return result.image_id
    } catch (e) {
      console.error("db exhibition_image update failed:", e)
      return null
    }
  })

  const updateResult = await Promise.all(updatePromises)
  if (updateResult.includes(null)) {
    return new Response("db error", { status: 500 })
  }
  return new Response("ok")
}
