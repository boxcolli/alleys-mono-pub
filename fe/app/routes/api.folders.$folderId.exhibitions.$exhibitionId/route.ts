import { ActionFunctionArgs } from "@remix-run/cloudflare"
import { del } from "./del"

export async function action({ params, request, context }: ActionFunctionArgs) {
  switch (request.method) {
    case "DELETE": return del({ params, request, context })
    default:
      return new Response("method not allowed", { status: 409 })
  }
}
