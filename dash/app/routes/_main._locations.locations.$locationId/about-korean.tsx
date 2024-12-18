import config from "./config"
import { Await, Form, useFetcher, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import { MarkdownEditor } from "~/components/MarkdownEditor"

const fetcherKey = "fetcher-about-korean"

export function AboutKorean() {
  const { location } = useLoaderData<typeof loader>()

  if (!location) return (
    null
  )

  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== "idle"

  return (
    <>
      <h3>About Korean</h3>
      <Await resolve={location}>
        {location => location && (
          <Form
            method="post"
            fetcherKey={fetcherKey}
          >
            <input
                name={config.actionName}
                value={config.actionNames.about_korean}
                hidden
                readOnly
              />
            <MarkdownEditor
              name={config.aboutKorean.aboutKoreanNames.about_korean}
              defaultValue={location.about_korean ?? ""}
            />
            <button
              type="submit"
              disabled={isSubmitting}
            >Update</button>
          </Form>
        )}
      </Await>
    </>
  )
}
