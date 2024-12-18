import { Location } from "@alleys/kysely"
import { Util } from "@alleys/util"
import { z } from "zod"

type ActionKeys = "edit" | "about_korean"
const actionName = "action"
const actionNames: Util.KeyAsValue<ActionKeys> = {
  edit: "edit",
  about_korean: "about_korean",
}

type EditOmit = Omit<Location,
  "id" | "image_id" | "name_sum_clean" | "about_korean" | "about_english" | "created_at" | "updated_at"
>
type EditKeys = keyof EditOmit
const editNames: Util.KeyAsValue<EditKeys> = {
  type: "type",
  name_korean: "name_korean",
  name_english: "name_english",
  address_korean: "address_korean",
  address_english: "address_english",
  link: "link",
  link_korean: "link_korean",
  link_english: "link_english",
  link_naver: "link_naver",
  link_kakao: "link_kakao",
  link_google: "link_google",
  is_visible: "is_visible",
}
const editZod = z.object({
  type:                 z.enum(["museum", "gallery"]),
  name_korean:          z.string(),
  name_english:         z.string(),
  address_korean:       z.string(),
  address_english:      z.string(),
  link:                 z.string(),
  link_korean:          z.string(),
  link_english:         z.string(),
  link_naver:           z.string(),
  link_kakao:           z.string(),
  link_google:          z.string(),
  is_visible:           z.coerce.boolean(),
}) satisfies Util.KeyAsZod<EditKeys>


type AboutKoreanKeys = Util.KPick<Location, "about_korean">
const aboutKoreanNames: Util.KeyAsValue<AboutKoreanKeys> = {
  about_korean: "about_korean",
}
const aboutKoreanZod = z.object({
  about_korean: z.string(),
}) satisfies Util.KeyAsZod<AboutKoreanKeys>


const reqZod = editZod.extend({
  action: z.literal(actionNames.edit),
}).or(aboutKoreanZod.extend({
  action: z.literal(actionNames.about_korean),
}))


export default {
  actionName, actionNames,
  edit: { editNames, editZod },
  aboutKorean: { aboutKoreanNames, aboutKoreanZod },
  reqZod,
}
