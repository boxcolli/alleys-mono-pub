import { defer, json, LoaderFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import { getKysely } from "~/.server/kysely"

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env
  const kysely = getKysely(env)

  invariant(params.locationId)
  const locationId = params.locationId

  /**
   * DB select
   */
  try {
    const location = kysely
      .selectFrom("location")
      .selectAll()
      .where("id", "=", locationId)
      .executeTakeFirst()

    return defer({ location })
  } catch (e) {
    console.error(e, "db selet location error")
    return defer({ location: null })
  }
}
