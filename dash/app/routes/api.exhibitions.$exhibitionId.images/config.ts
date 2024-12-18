import { ExhibitionImage, Image } from "@alleys/kanel"
import { Util } from "@alleys/util"
import { z } from "zod"

/**
 * Post
 */
type PostKeys = Util.KPick<Image,
  "source" | "source_link" | "description"
> | "image"
const postSchema = z.object({
  source:       z.string(),
  source_link:  z.string(),
  description:  z.string(),
  image:        z.string().or(z.null()),
}) satisfies Util.KeyAsZod<PostKeys>
const postNames: Util.KeyAsValue<PostKeys> = {
  source: "source",
  source_link: "source_link",
  description: "description",
  image: "image"
}

/**
 * Put
 */
const putSchema = z.object({
  image_ids: z.array(z.string()),
})
const putNames = {
  image_ids: "image_ids",
}

export default {
  post: {
    schema: postSchema,
    names: postNames,
  },
  put: {
    schema: putSchema,
    names: putNames,
  },
}
