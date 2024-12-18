import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import sessions from "~/.server/sessions"
import { $PATH } from "~/config"
import config from "./config"

export async function action({ params, request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env

  /**
   * Session
   */
  try {
    const { getSession, commitSession, destroySession } = sessions.init(env, "auth")
    const session = await getSession(request.headers.get("Cookie"))
    if (session.id === "") {
      return redirect($PATH.auth)
    }

    switch (request.method) {
      case "PUT":
        const prev = session.get("expire_at")
        if (!prev) return redirect($PATH.auth)

        session.set("expire_at", new Date(
          prev.getTime() + (config.extendMin * 1000 * 60)
        ))
        return redirect(
          request.url,
          { headers: { "Set-Cookie": await commitSession(session) } },
        )
    
      case "DELETE":
        return redirect(
          $PATH.auth,
          { headers: { "Set-Cookie": await destroySession(session) } },
        )
      
      default:
        return new Response("unexpected http method", { status: 404 })
    }
  } catch (e) {
    console.error("session fail:", e)
    return new Response("internal", { status: 500 })
  }
}
