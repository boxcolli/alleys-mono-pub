import { defer, LoaderFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import { z } from "zod"
import { getKysely, getKyselyHyperdrive } from "~/.server/kysely"
import config from "./config"
import cloud from "@alleys/lib/cloud"
import sessions from "~/.server/sessions"

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  invariant(params.exhibitionId, "exhibition id missing")
  const exhibitionId = params.exhibitionId
  const env = context.cloudflare.env
  const kysely = getKysely(env)
  const hd = getKyselyHyperdrive(env)
  let res: z.infer<typeof config.get.schema> = {
    exhibition: null,
    reviewCount: null,
    myUniqueName: null,
    myReview: null,
    myFolders: null,
    addedFolderIds: null,
  } satisfies Record<keyof z.infer<typeof config.get.schema>, any>

  /**
   * Fetch exhibition
   */
  try {
    const ex = await hd
      .selectFrom("exhibition")
      .leftJoin("exhibition_image", "exhibition.id", "exhibition_image.exhibition_id")
      .leftJoin("image", "exhibition_image.image_id", "image.id")
      .select([
        "exhibition.id",
        "exhibition.name_korean",
        "exhibition.about_korean",
        "exhibition.start_date",
        "exhibition.end_date",
        "exhibition.location_korean",
        "exhibition.price",
        "exhibition.artists_string",
        "exhibition.is_permanent",
        "exhibition.link_korean",
        "image.provider",
        "image.bucket",
        "image.entry",
      ])
      .where("exhibition.id", "=", exhibitionId)
      .executeTakeFirst()
    if (!ex) return defer(res)
    
    let image_link: string | null = null
    if (ex.provider && ex.bucket && ex.entry) {
      image_link = cloud.getImageLink({
        provider: ex.provider,
        bucket: ex.bucket,
        entry: ex.entry,
      })
    }

    var exhibition = {
      id:               ex.id,
      name_korean:      ex.name_korean,
      about_korean:     ex.about_korean,
      start_date:       ex.start_date,
      end_date:         ex.end_date,
      location_korean:  ex.location_korean,
      price:            ex.price,
      artists_string:   ex.artists_string,
      is_permanent:     ex.is_permanent,
      link_korean:      ex.link_korean,
      image_link,
    }
    res.exhibition = exhibition
  } catch (e) {
    console.error("db select exhibition error:", e)
    return defer(res)
  }

  /**
   * Check user session
   */
  try {
    var { getSession } = sessions.init(env, "main")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "" || !session.data.user) {
      return defer(res)
    }
  } catch (e) {
    console.error("session main error", e)
    return defer(res)
  }
  const user = session.data.user
  res.myUniqueName = user.unique_name

  /**
   * DB select review count
   */
  const reviewCountPromise = new Promise<number | null>(async resolve => {
    try {
      const result = await hd
        .selectFrom("review")
        .select(eb => eb.fn.countAll<number>().as("count"))
        .where("exhibition_id", "=", exhibitionId)
        .executeTakeFirst()
      if (!result) {
        resolve(null)
        return
      }
      resolve(result.count)
    } catch (e) {
      console.error("db select review count error", e)
      resolve(null)
    }
  })

  /**
   * DB select my review
   */
  const myReviewPromise = new Promise<z.infer<typeof config.get.myReviewSchema> | null>(async (resolve) => {
    try {
      const review = await kysely
        .selectFrom("review")
        .select([
          "id",
          "title",
          "content",
          "is_content_public",
          "created_at",
        ])
        .where("review.user_id", "=", user.id)
        .where("review.exhibition_id", "=", exhibitionId)
        .executeTakeFirst()

      if (!review) {
        resolve(null)
        return
      }
      resolve(review)
    } catch (e) {
      console.error("db select review error", e)
      resolve(null)
    }
  })

  /**
   * DB select my folder
   */
  const myFoldersPromise = new Promise<z.infer<typeof config.get.myFolderSchema>[] | null>(async resolve => {
    try {
      const folders = await kysely
        .selectFrom("folder")
        .select(["id", "name", "is_public"])
        .where("folder.user_id", "=", user.id)
        .execute()
      resolve(folders)
    } catch (e) {
      console.error("db select folder error", e)
      resolve(null)
    }
  })

  /**
   * DB select added folder
   */
  const addedFolderIdsPromise = new Promise<z.infer<typeof config.get.addedFolderIdsSchema> | null>(async resolve => {
    try {
      const list = await kysely
        .selectFrom("folder")
        .leftJoin("folder_exhibition", "folder.id", "folder_exhibition.folder_id")
        .select("folder.id")
        .where("folder.user_id", "=", user.id)
        .where("folder_exhibition.exhibition_id", "=", exhibitionId)
        .execute()

      resolve(list.reduce((prev, v) => {
        prev[v.id] = true
        return prev
      }, {} as z.infer<typeof config.get.addedFolderIdsSchema>))
    } catch (e) {
      console.error("db select folder_exhibition error", e)
      resolve(null)
    }
  })

  return defer({
    exhibition: res.exhibition,
    reviewCount: reviewCountPromise,
    myUniqueName: user.unique_name,
    myReview: await myReviewPromise,
    myFolders: await myFoldersPromise,
    addedFolderIds: await addedFolderIdsPromise
  })
}
