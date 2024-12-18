import { Review, User } from "@alleys/kysely"
import { Util } from "@alleys/util"
import { z } from "zod"

const policy = {
  get: {
    defaultSize: 10,
    maxSize: 20,
  },
}

type GetReqKey = "page" | "size" | "sort" | "is_count"
const getReqNames: Util.KeyAsValue<GetReqKey> = {
  page: "page",
  size: "size",
  sort: "sort",
  is_count: "is_count",
}
const getReqSchema = z.object({
  page:     z.coerce.number().optional(),
  size:     z.coerce.number().optional(),
  sort:     z.enum(["recent", "popular"]).optional(),
  is_count: z.coerce.boolean(),
}) satisfies Util.KeyAsZod<GetReqKey>

type GetResKey =
  "review_id" | Util.KPick<Review, "title" | "content" | "created_at"> |
  "user_id" | Util.KPick<User, "unique_name">
const getResDataSchema = z.object({
  review_id:    z.string(),
  title:        z.string(),
  content:      z.string().nullable(),
  created_at:   z.coerce.date(),
  user_id:      z.string(),
  unique_name:  z.string(),
}) satisfies Util.KeyAsZod<GetResKey>
const getResSchema = z.object({
  reviews: z.array(getResDataSchema),
})

type PostReqKey = Util.KPick<Review, "title" | "content" | "is_content_public">
const postReqNames: Util.KeyAsValue<PostReqKey> = {
  title: "title",
  content: "content",
  is_content_public: "is_content_public"
}
const postReqSchema = z.object({
  title:              z.string(),
  content:            z.string(),
  is_content_public:  z.coerce.boolean(),
}) satisfies Util.KeyAsZod<PostReqKey>

type PostResKey = Util.KPick<Review, "id" | "created_at">
const postResSchema = z.object({
  id:         z.string(),
  created_at: z.coerce.date(),
}) satisfies Util.KeyAsZod<PostResKey>

export default {
  get : {
    req: { names: getReqNames, schema: getReqSchema },
    res: { data: getResDataSchema, schema: getResSchema },
    policy: policy.get,
  },
  post : {
    req: { names: postReqNames, schema: postReqSchema },
    res: { schema: postResSchema },
  },
}
