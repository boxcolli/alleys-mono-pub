import { Location } from "@alleys/kysely"
import { defer, LoaderFunctionArgs } from "@remix-run/cloudflare"
import { getKyselyHyperdrive } from "~/.server/kysely"

type LocationData = Pick<Location, "id" | "name_korean">

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env
  const kysely = getKyselyHyperdrive(env)

  // Location list
  const listPromise = new Promise<LocationData[] | null>(async resolve => {
    try {
      const result = await kysely
        .selectFrom("location")
        .select(["id", "name_korean"])
        .execute()
      resolve(result)
      return
    } catch (e) {
      console.error("db location error", e)
      resolve(null)
    }
  })
  
  // Location record
  const recordPromise = new Promise<Record<string, string>>(async resolve => {
    const list = await listPromise
    if (list === null) {
      resolve({})
      return
    }

    const record = list.reduce((prev, v) => {
      prev[v.id] = v.name_korean
      return prev
    }, {} as Record<string, string>)

    resolve(record)
  })

  return defer({ locationList: listPromise, locationRecord: recordPromise })
}

function getDateStrings() {
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const todayString = today.toISOString().split("T")[0]
  const yesterdayString = yesterday.toISOString().split("T")[0]
  const tomorrowString = tomorrow.toISOString().split("T")[0]

  return {
    today: todayString,
    yesterday: yesterdayString,
    tomorrow: tomorrowString,
  }
}
