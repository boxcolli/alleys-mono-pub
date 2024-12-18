import { ActionFunctionArgs } from "@remix-run/cloudflare"
import { put } from "./put";
import { del } from "./del";

export async function action({ params, request, context }: ActionFunctionArgs) {
  switch (request.method) {
    case "PUT":
      return put({ params, request, context })
    case "DELETE":
      return del({ params, request, context })
    default:
      return new Response("not found", { status: 404 })
  }
}

