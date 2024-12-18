import { z } from "zod"
import { Util } from "@alleys/util"
import { Exhibition, Folder, Review } from "@alleys/kysely"

type DataKey = Util.KPick<Exhibition, "id" |
  "name_korean" | "about_korean" | "start_date" | "end_date" |
  "location_korean" | "price" | "artists_string" | "is_permanent" |
  "link_korean"
> | "image_link"
const dataSchema = z.object({
  id:               z.string(),
  name_korean:      z.string(),
  about_korean:     z.string().nullable(),
  start_date:       z.coerce.date(),
  end_date:         z.coerce.date().nullable(),
  location_korean:  z.string().nullable(),
  price:            z.coerce.number(),
  artists_string:   z.string().nullable(),
  is_permanent:     z.coerce.boolean(),
  link_korean:      z.string().nullable(),
  image_link:       z.string().nullable(),
}) satisfies Util.KeyAsZod<DataKey>

type MyReviewKey = Util.KPick<Review,
  "id" | "title" | "content" | "is_content_public" | "created_at"
>
const myReviewSchema = z.object({
  id:                 z.string(),
  title:              z.string(),
  content:            z.string(),
  is_content_public:  z.coerce.boolean(),
  created_at:         z.coerce.date(),
}) satisfies Util.KeyAsZod<MyReviewKey>

type MyFolderKey = Util.KPick<Folder, "id" | "name" | "is_public">
const myFolderSchema = z.object({
  id:         z.string(),
  name:       z.string(),
  is_public:  z.boolean(),
}) satisfies Util.KeyAsZod<MyFolderKey>

const addedFolderIdsSchema = z.record(z.string(), z.boolean())

const getSchema = z.object({
  exhibition:     dataSchema.nullable(),
  reviewCount:    z.coerce.number().nullable(),
  myUniqueName:   z.string().nullable(),
  myReview:       myReviewSchema.nullable(),
  myFolders:      z.array(myFolderSchema).nullable(),
  addedFolderIds: addedFolderIdsSchema.nullable(),
})

export default {
  get: {
    schema: getSchema,
    dataSchema,
    myReviewSchema,
    myFolderSchema,
    addedFolderIdsSchema,
  },
}
