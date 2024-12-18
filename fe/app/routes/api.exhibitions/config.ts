import { Util } from "@alleys/util"
import { z } from "zod"
import { Exhibition, Location, Image } from "@alleys/kanel"

const policy = {
  maxPageSize: 20,
}

type ReqKeys =
  "page" | "size" | "is_count" |
  "location_ids" |
  "price_min" | "price_max" |
  "start_min"  | "start_max" | 
  "end_min" | "end_max" |
  "sort_by" | "sort_to"
const reqNames: Util.KeyAsValue<ReqKeys> = {
  page: "page",
  size: "size",
  is_count: "is_count",
  location_ids: "location_ids",
  price_min: "price_min",
  price_max: "price_max",
  start_min: "start_min",
  start_max: "start_max",
  end_min: "end_min",
  end_max: "end_max",
  sort_by: "sort_by",
  sort_to: "sort_to",
}
const reqSchema = z.object({
  page:         z.coerce.number().optional(),
  size:         z.coerce.number().optional(),
  is_count:     z.coerce.boolean().optional(),
  location_ids: z.string().transform(s => s.split(",")).optional(),
  price_min:    z.coerce.number().optional(),
  price_max:    z.coerce.number().optional(),
  start_min:    z.coerce.date().optional(),
  start_max:    z.coerce.date().optional(),
  end_min:      z.coerce.date().optional(),
  end_max:      z.coerce.date().optional(),
  sort_by:      z.enum(["start_date", "end_date"]).optional(),
  sort_to:      z.enum(["asc", "desc"]).optional(),
}) satisfies Util.KeyAsZod<ReqKeys>

type ResKeys = Util.KPick<Exhibition,
  "id" | "location_id" | "name_korean" | "price" | "start_date" | "end_date"
> | "image_link"
const dataSchema = z.object({
  id:           z.string(),
  location_id:  z.string().nullable(),
  name_korean:  z.string(),
  price:        z.coerce.number(),
  start_date:   z.coerce.date(),
  end_date:     z.coerce.date().nullable(),
  image_link:   z.string().nullable(),
}) satisfies Util.KeyAsZod<ResKeys>
const resSchema = z.object({
  data: z.array(dataSchema),
}).or(z.object({
  count: z.coerce.number(),
})).or(z.object({
  err: z.string(),
}))

export default {
  policy,
  req: { names: reqNames, schema: reqSchema },
  res: { data: dataSchema, schema: resSchema },
}
