import { ActionFunctionArgs, json } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import sessions from "~/.server/sessions"
import { alerts } from "../_main/alert"
import api from "./config"
import { getKysely } from "~/.server/kysely"
import config from "./config"
import { z } from "zod"

type Res = z.infer<typeof config.post.res.schema>

export async function post({ params, request, context }: ActionFunctionArgs) {
  invariant(params["folderId"])
  const folderId = params["folderId"]
  const env = context.cloudflare.env

  /**
   * Open session
   */
  try {
    var { getSession, commitSession } = sessions.init(env, "main")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "" || !session.data.user) {
      return await respondError(403)
    }
  } catch (e) {
    console.error("session main error", e)
    return await respondError(500)
  }
  const user = session.data.user

  /**
   * FormData
   */
  const parsed = api.post.req.schema.safeParse(await request.json())
  if (parsed.error) {
    return await respondError(400)
  }
  const { id: exhibitionId } = parsed.data

  /**
   * DB select folder
   */
  const kysely = getKysely(env)
  try {
    const result = await kysely
      .selectFrom("folder")
      .select("id")
      .where("folder.id", "=", folderId)
      .where("folder.user_id", "=", user.id)
      .executeTakeFirst()
    if (!result) {
      return await respondError(404)
    }
  } catch (e) {
    console.error("db select folder error", e)
    return await respondError(500)
  }

  /**
   * DB insert
   */
  try {
    const result = await kysely
      .insertInto("folder_exhibition")
      .values({
        folder_id: folderId,
        exhibition_id: exhibitionId,
        created_at: new Date(),
      })
      .onConflict(oc => oc
        .columns(["folder_id", "exhibition_id"])
        .doNothing()
      )
      .returning("folder_exhibition.folder_id")
      .executeTakeFirst()
    if (!result) {
      return await respondError(500)
    }
  } catch (e) {
    console.error(e, "db insert folder_exhibition error")
    return await respondError(500)
  }

  return respond()

  // helper function
  async function respondError(status: number) {
    const obj = {
      ok: false,
      folder_id: folderId,
      exhibition_id: exhibitionId,
    } satisfies Res
    try {
      session.flash("alert", alerts["error"].name)
      return Response.json(
        obj,
        { status, headers: { "Set-Cookie": await commitSession(session)}},
      )
    } catch (e) {
      console.error("session main error", e)
      return Response.json(obj, { status })
    }
  }
  function respond() {
    return Response.json({
      ok: true,
      folder_id: folderId,
      exhibition_id: exhibitionId,
    } satisfies Res)
  }
}
