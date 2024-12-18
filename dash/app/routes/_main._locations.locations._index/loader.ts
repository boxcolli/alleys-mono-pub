
import names from "@alleys/lib/names";
import config from "./config"
import { defer, json, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getKysely } from "~/.server/kysely";
import { getLogger } from "~/.server/logger";

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const sp = new URL(request.url).searchParams
  const page = Number(sp.get(config.spNames.page) ?? 1)
  const find = sp.get(config.spNames.find)

  const env = context.cloudflare.env
  const logger = getLogger(env, request)
  const kysely = getKysely(env)

  /**
   * Build query
   */
  let lq = kysely
    .selectFrom("location")
    .selectAll()

  let tq = kysely
    .selectFrom("location")
    .select(eb => eb.fn.countAll<number>().as("total"))
  
  if (find) {
    const x = `%${names.getCleanSum(find)}%`
    console.info({ x })
    lq = lq.where("name_sum_clean", "like", x)
    tq = tq.where("name_sum_clean", "like", x)
  }

  /**
   * Select locations
   */
  try {
    const locations = lq
    .limit(config.policy.pageSize)
    .offset((page - 1) * config.policy.pageSize)
    .execute()

    const total = tq
      .executeTakeFirst()

    return defer({ locations, total })
  } catch (e) {
    logger.error(e, "db select location error")
    return defer({ locations: null, total: null })
  }
}
