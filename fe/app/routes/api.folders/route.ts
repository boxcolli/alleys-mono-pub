import { ActionFunctionArgs } from "@remix-run/cloudflare"
import { post } from "./post"

export async function action({ params, request, context }: ActionFunctionArgs) {
  switch (request.method) {
    case "POST": return post({ params, request, context })
    default:
      return new Response("method not allowed", { status: 409 })
  }
}
