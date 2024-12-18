import { LoaderFunctionArgs } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import { z } from "zod"
import { getKysely } from "~/.server/kysely"
import sessions from "~/.server/sessions"
import config from "./config"

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  invariant(params.folderId)
  const folderId = params.folderId
  const env = context.cloudflare.env
  const kysely = getKysely(env)

  /**
   * DB select folder
   */
  try {
    var folder = await kysely
      .selectFrom("folder")
      .selectAll()
      .where("folder.id", "=", folderId)
      .executeTakeFirst()
    if (!folder) {
      return new Response("not found", { status: 404 })
    }
  } catch (e) {
    console.error("db select folder error", e)
    return new Response("internal", { status: 500 })
  }

  /**
   * Authorize user
   */
  if (!folder.is_public) {
    try {
      const { getSession } = sessions.init(env, "main")
      const session = await getSession(await request.headers.get("Cookie"))
      var user = session.get("user")
      if (!user || user.id !== folder.user_id) {
        return new Response("not found", { status: 404 })
      }
    } catch (e) {
      console.error("session main error", e)
      return new Response("internal", { status: 500 })
    }
  }

  /**
   * DB select exhibition
   */
  try {
    const exhibitions = await kysely
      .selectFrom("folder_exhibition")
      .select("exhibition_id")
      .where("folder_id", "=", folderId)
      .execute()
    return respond({ data: exhibitions.map(v => v.exhibition_id) })
  } catch (e) {
    console.error("db select folder_exhibition error", e)
    return new Response("internal", { status: 500 })
  }

  function respond(obj: z.infer<typeof config.get.res.schema>) {
    return Response.json(obj)
  }
}