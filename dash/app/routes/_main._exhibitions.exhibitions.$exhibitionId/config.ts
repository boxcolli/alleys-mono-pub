import { ExhibitionImage } from "@alleys/kanel"
import { Exhibition } from "@alleys/kysely"
import { Util } from "@alleys/util"
import { z } from "zod"

/**
 * Actions
 */
type ActionKeys = "edit" | "about_korean" | "image_delete" | "image_edit"
const actionName = "action"
const actionNames: Util.KeyAsValue<ActionKeys> = {
  edit: "edit",
  about_korean: "about_korean",
  image_delete: "image_delete",
  image_edit: "image_edit"
}

/**
 * Edit
 */
type EditOmit = Omit<Exhibition,
  "id" | "location_id" | "image_id" | "created_at" | "name_sum_clean" | "updated_at" | "about_korean" | "about_english"
>
type EditKeys = keyof EditOmit
const editNames: Util.KeyAsValue<EditKeys> = {
  artists_string: "artists_string",
  end_date: "end_date",
  is_permanent: "is_permanent",
  is_visible: "is_visible",
  link_english: "link_english",
  link_korean: "link_korean",
  location_english: "location_english",
  location_korean: "location_korean",
  name_english: "name_english",
  name_korean: "name_korean",
  price: "price",
  start_date: "start_date"
}
const editSchema = z.object({
  artists_string:   z.string(),
  start_date:       z.coerce.date(),
  end_date:         z.coerce.date(),
  is_permanent:     z.coerce.boolean(),
  is_visible:       z.coerce.boolean(),
  link_korean:      z.string(),
  link_english:     z.string(),
  location_korean:  z.string(),
  location_english: z.string(),
  name_korean:      z.string(),
  name_english:     z.string(),
  price: z.coerce.number(),
}) satisfies Util.KeyAsZod<EditKeys>

/**
 * AboutKorean
 */
type AboutKoreanKeys = Util.KPick<Exhibition, "about_korean">
const aboutKoreanNames: Util.KeyAsValue<AboutKoreanKeys> = {
  about_korean: "about_korean",
}
const aboutKoreanSchema = z.object({
  about_korean: z.string(),
}) satisfies Util.KeyAsZod<AboutKoreanKeys>

/**
 * Image delete
 */
type ImageDeleteKeys = Util.KPick<ExhibitionImage, "image_id">
const imageDeleteNames: Util.KeyAsValue<ImageDeleteKeys> = {
  image_id: "image_id"
}
const imageDeleteSchema = z.object({
  image_id: z.string(),
}) satisfies Util.KeyAsZod<ImageDeleteKeys>

/**
 * Image edit
 */
type ImageEditKeys = "image_ids"
const imageEditNames: Util.KeyAsValue<ImageEditKeys> = {
  image_ids: "image_ids"
}
const imageEditSchema = z.object({
  image_ids: z
    .string()
    .transform(str => str.split(",")) // Transform the string into an array
    .pipe(z.array(z.string())), // Ensure it's an array of strings,
}) satisfies Util.KeyAsZod<ImageEditKeys>

/**
 * Composed formData
 */
const reqSchema = editSchema.extend({
  action: z.literal(actionNames.edit),
}).or(aboutKoreanSchema.extend({
  action: z.literal(actionNames.about_korean),
})).or(imageDeleteSchema.extend({
  action: z.literal(actionNames.image_delete)
})).or(imageEditSchema.extend({
  action: z.literal(actionNames.image_edit)
}))

export default {
  action: { name: actionName, names: actionNames },
  edit: { names: editNames, schema: editSchema },
  aboutKorean: { names: aboutKoreanNames, schema: aboutKoreanSchema },
  imageDelete: { names: imageDeleteNames, schema: imageDeleteSchema },
  imageEdit: { names: imageEditNames, schema: imageEditSchema },
  req: { schema: reqSchema },
}

export type ImageRowData = {
  image_id: string
  order: number
  link: string | null
}
