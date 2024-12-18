import { defer, LoaderFunctionArgs } from "@remix-run/cloudflare"
import config from "./config"
import { getKysely } from "~/.server/kysely"
import names from "@alleys/lib/names"

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const sp = new URL(request.url).searchParams
  const page = Number(sp.get(config.spNames.page) ?? 1)
  const find = sp.get(config.spNames.find)

  const env = context.cloudflare.env
  const logger = console
  const kysely = getKysely(env)

  /**
   * Build query
   */
  // list query
  let lq = kysely
    .selectFrom("image")
    .selectAll()
  // total query
  let tq = kysely
    .selectFrom("image")
    .select(eb => eb.fn.countAll<number>().as("total"))
  
  if (find) {
    const x = `%${(names.cleanString(find))}%`
    // console.info({ x })
    lq = lq.where("source", "like", x)
    tq = tq.where("source", "like", x)
  }

  /**
   * Select images
   */
  try {
    const images = lq
    .limit(config.policy.pageSize)
    .offset((page - 1) * config.policy.pageSize)
    .execute()

    const total = tq
      .executeTakeFirst()

    return defer({ images, total })
  } catch (e) {
    logger.error(e, "db select location error")
    return defer({ images: null, total: null })
  }
}
