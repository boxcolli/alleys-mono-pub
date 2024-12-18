import config from "../api.exhibitions.$exhibitionId.images/config"

import { Await, Form, useFetcher, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import { $PATH } from "~/config"
import React, { Suspense, useState } from "react"

const fetcherKey = "fetcher-image-add"

export function ImageAdd() {
  const { exhibition } = useLoaderData<typeof loader>()
  if (!exhibition) return null

  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== "idle"

  const [preview, setPreview] = useState<string | null>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    }
  }

  return (
    <>
      <h3>Image Add</h3>
      <Suspense fallback={<progress />}>
        <Await resolve={exhibition}>
          {exhibition => exhibition && (
            <fetcher.Form
              method="post"
              encType="multipart/form-data"
              action={$PATH.api.exhibitions$exhibitionIdImages(exhibition.id)}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}
            >
              <input type="file" name={config.post.names.image} onChange={handleFileChange} />
              {preview && <img src={preview} alt="File preview" style={{ maxWidth: 200 }} />}
              <input type="text" name={config.post.names.source} placeholder={config.post.names.source} />
              <input type="text" name={config.post.names.source_link} placeholder={config.post.names.source_link} />
              <input type="text" name={config.post.names.description} placeholder={config.post.names.description} />

              <button disabled={isSubmitting}>Add</button>
            </fetcher.Form>
          )}
        </Await>
      </Suspense>
    </>
  )
}
