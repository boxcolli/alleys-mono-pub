import { json, LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env
  return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY })
}
