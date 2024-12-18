import { ActionFunctionArgs, json } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import sessions from "~/.server/sessions"
import { z } from "zod"
import { alerts } from "../_main/alert"
import { getKysely } from "~/.server/kysely"
import config from "./config"

type Res = z.infer<typeof config.del.res.schema>

export async function del({ params, request, context }: ActionFunctionArgs) {
  invariant(params["folderId"])
  invariant(params["exhibitionId"])
  const folderId = params["folderId"]
  const exhibitionId = params["exhibitionId"]
  const env = context.cloudflare.env

  /**
   * Open session
   */
  try {
    var { getSession, commitSession } = sessions.init(env, "main")
    var session = await getSession(request.headers.get("Cookie"))
    if (session.id === "" || !session.data.user) {
      return respondError(403)
    }
  } catch (e) {
    console.error("session main error", e)
    return respondError(500)
  }
  const user = session.data.user

  /**
   * DB delete folder_exhibition
   */
  const kysely = getKysely(env)
  try {
    const result = await kysely
      .deleteFrom("folder_exhibition")
      .where("folder_exhibition.exhibition_id", "=", exhibitionId)
      .where("folder_exhibition.folder_id", "in", 
        kysely
          .selectFrom("folder")
          .select("folder.id")
          .where("folder.id", "=", folderId)
          .where("folder.user_id", "=", user.id)
      )
      .returning("folder_exhibition.folder_id")
      .executeTakeFirst()
    if (!result) {
      return respondError(404)
    }
  } catch (e) {
    console.error("db delete folder_exhibition error", e)
    return respondError(500)
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
        { status, headers: { "Set-Cookie": await commitSession(session)} },
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
