import { defer, LoaderFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import { getKysely } from "~/.server/kysely"

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env
  const kysely = getKysely(env)

  invariant(params.imageId)
  const imageId = params.imageId

  /**
   * DB select
   */
  try {
    const image = kysely
      .selectFrom("image")
      .selectAll()
      .where("id", "=", imageId)
      .executeTakeFirst()

    const exhibitionImages = kysely
      .selectFrom("exhibition_image")
      .selectAll()
      .where("image_id", "=", imageId)
      .execute()

    const locationImages = kysely
      .selectFrom("location")
      .selectAll()
      .where("image_id", "=", imageId)
      .execute()

    return defer({
      imageId,
      image,
      exhibitionImages,
      locationImages,
    })
  } catch (e) {
    console.error(e, "db selet image error")
    return defer({
      imageId,
      image: null,
      exhibitionImages: null,
      locationImages: null,
    })
  }
}
