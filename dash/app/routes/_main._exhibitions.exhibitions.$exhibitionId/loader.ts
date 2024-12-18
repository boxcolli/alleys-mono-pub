import { defer, LoaderFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import { getKysely } from "~/.server/kysely"
import { ImageRowData } from "./config"

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env
  const kysely = getKysely(env)

  invariant(params.exhibitionId)
  const exhibitionId = params.exhibitionId

  /**
   * DB select
   */
  try {
    const exhibition = kysely
      .selectFrom("exhibition")
      .selectAll()
      .where("id", "=", exhibitionId)
      .executeTakeFirst()

    const images: Promise<ImageRowData[]> = kysely
      .selectFrom("exhibition_image")
      .leftJoin("image", "exhibition_image.image_id", "image.id")
      .select(["exhibition_image.image_id", "exhibition_image.order", "image.link"])
      .where("exhibition_image.exhibition_id", "=", exhibitionId)
      .execute()

    return defer({ exhibitionId, exhibition, images })
  } catch (e) {
    console.error(e, "db selet exhibition error")
    return defer({ exhibitionId, exhibition: null, images: null })
  }
}
