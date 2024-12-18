import { defer, LoaderFunctionArgs } from "@remix-run/cloudflare"
import { $PATH } from "~/config"
import { z } from "zod"
import api from "~/routes/api.exhibitions/config"
import config from "./config"

export async function loader({ request }: LoaderFunctionArgs) {
  /**
   * URL & SearchParams
   */
  let url: URL
  {
    const now = new Date()
    const start_max = new Date()
    start_max.setDate(start_max.getDate() + config.policy.maxDaysFromStart)

    const req = {
      start_max,
      end_min: now,
      sort_by: "start_date",
    } satisfies z.output<typeof api.req.schema>

    const sp = new URLSearchParams(
      Object.fromEntries(
        Object.entries(req).map(
          ([k, v]) => [k, v instanceof Date ? v.toISOString() : v]
        )
      )
    )

    const baseUrl = new URL(request.url).origin
    url = new URL(`${$PATH.api.exhibitions.index}?${sp.toString()}`, baseUrl)
    console.debug("fetch url:", url.toString())
  }

  /**
   * Fetch
   */
  const exhibitionsPromise = new Promise<z.infer<typeof api.res.data>[] | null>(async resolve => {
    // Fetch
    try {
      var res = await fetch(url.toString())
    } catch (e) {
      console.error(e)
      resolve(null)
      return
    }
    if (!res.ok) {
      console.error("fetch failed:", res.status)
      resolve(null)
      return
    }

    // Parse
    const parsed = api.res.schema.safeParse(await res.json())
    if (parsed.error) {
      console.error("parse error:", parsed.error)
      resolve(null)
      return
    }
    const data = parsed.data
    if ("err" in data || "count" in data) {
      resolve(null)
      return
    }

    resolve(data.data)
  })
  
  return defer({ exhibitions: exhibitionsPromise })
}
