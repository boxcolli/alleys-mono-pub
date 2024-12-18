import { json, LoaderFunctionArgs } from "@remix-run/cloudflare"
import { useLoaderData } from "@remix-run/react"

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  return json({ WHICH_ENV: context.cloudflare.env.WHICH_ENV })
}

export default function Page() {
  const data = useLoaderData<typeof loader>()

  return (
    <>
      <pre>WHICH_ENV: {data.WHICH_ENV}</pre>
    </>
  )
}