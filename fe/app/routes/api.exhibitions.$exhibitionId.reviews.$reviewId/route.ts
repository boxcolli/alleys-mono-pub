import { ActionFunctionArgs } from "@remix-run/cloudflare"
import { put } from "./put"
import { del } from "./del"

export async function action({ params, request, context }: ActionFunctionArgs) {
  switch (request.method) {
    case "PUT":
      return await put({ params, request, context })
    case "DELETE":
      return await del({ params, request, context })

    default:
      return new Response("method unavailable", { status: 405 })
  }
}
