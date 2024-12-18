import { getKysely } from "~/.server/kysely"
import config from "./config"
import { ActionFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import names from "@alleys/lib/names"

export async function action({ params, request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env
  invariant(params.location_id)
  const location_id = params.location_id
  
  const formData = await request.formData()
  const parsed = config.reqZod.safeParse(Object.fromEntries(formData.entries()))
  if (parsed.error) {
    console.info(parsed.error.message)
    return new Response("invalid formData", { status: 400 })
  }

  const action = parsed.data.action
  console.debug(`received action=${action}`)

  const kysely = getKysely(env)
  
  switch (action) {
    case "edit": {
      const d = parsed.data
      
      try {
        const result = await kysely
          .updateTable("location")
          .set("type", d.type)
          .set("name_korean", d.name_korean)
          .set("name_english", d.name_english)
          .set("name_sum_clean", names.getCleanSum(d.name_korean, [d.name_english]))
          .set("address_korean", d.address_korean)
          .set("address_english", d.address_english)
          .set("link_korean", d.link_korean)
          .set("link_english", d.link_english)
          .set("link_naver", d.link_naver)
          .set("link_kakao", d.link_kakao)
          .set("link_google", d.link_google)
          .set("is_visible", d.is_visible)
          .where("id", "=", location_id)
          .returning("id")
          .executeTakeFirst()

        if (!result) {
          return new Response("db update failed", { status: 500 })
        }
      } catch (e) {
        console.error(e, "db update location error")
        return new Response("db update location error", { status: 500 })
      }

      console.info("db update location success")
      return new Response()
    }

    case "about_korean": {
      const d = parsed.data.about_korean

      try {
        const result = await kysely
          .updateTable("location")
          .set("about_korean", d)
          .where("id", "=", location_id)
          .returning("id")
          .executeTakeFirst()

        if (!result) {
          return new Response("db update failed", { status: 500 })
        }
      } catch (e) {
        console.error(e, "db update location error")
        return new Response("db update location error", { status: 500 })
      }

      console.info("db update location success")
      return new Response()
    }

    default: {
      return new Response("wrong action", { status: 400 })
    }
  }
}
