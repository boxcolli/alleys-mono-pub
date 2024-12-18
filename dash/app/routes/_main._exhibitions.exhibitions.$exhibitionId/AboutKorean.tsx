import config from "./config"
import { Await, Form, useFetcher, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import { MarkdownEditor } from "~/components/MarkdownEditor"
import { Suspense } from "react"

const fetcherKey = "fetcher-about-korean"

export function AboutKorean() {
  const { exhibition } = useLoaderData<typeof loader>()
  if (!exhibition) return null

  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== "idle"

  return (
    <>
      <h3>About Korean</h3>
      <Suspense fallback={<progress />}>
        <Await resolve={exhibition}>
          {exhibition => exhibition && (
            <Form
              method="post"
              fetcherKey={fetcherKey}
            >
              <input
                  name={config.action.name}
                  value={config.action.names.about_korean}
                  hidden
                  readOnly
                />
              <MarkdownEditor
                name={config.aboutKorean.names.about_korean}
                defaultValue={exhibition.about_korean ?? ""}
              />
              <button
                type="submit"
                disabled={isSubmitting}
              >Update</button>
            </Form>
          )}
        </Await>
      </Suspense>
    </>
  )
}
