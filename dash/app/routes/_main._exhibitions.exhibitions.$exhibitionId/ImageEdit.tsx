import { Await, Form, useFetcher, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import { DragAndDropList } from "~/components/DragAndDropList"
import { Suspense, useEffect, useState } from "react"
import { Util } from "@alleys/util"
import config, { ImageRowData } from "./config"
import { z } from "zod"
import { Dialog } from "~/components/Dialog"
import { $PATH } from "~/config"

const editFetcherKey = "fetcher-image-edit"
const delFetcherKey = "fetcher-image-del"

export function ImageEdit() {
  const { images } = useLoaderData<typeof loader>()
  if (!images) return null

  return (
    <>
      <h3>Image Edit</h3>
      <Suspense fallback={<progress />}>
        <Await resolve={images}>
          {images => images && (
            <RenderImageList images={images} />
          )}
        </Await>
      </Suspense>
    </>
  )
}

function RenderImageList({ images }: { images: ImageRowData[] }) {
  const fetcherKey = editFetcherKey
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== "idle"
  const [state, setState] = useState(images)

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <DragAndDropList
          state={state}
          setState={setState}
          Render={RenderImage}
        />
      </div>
      <fetcher.Form method="PUT">
        <input type="text" name={config.action.name} value={config.action.names.image_edit} hidden readOnly />
        <input type="text" name={config.imageEdit.names.image_ids} value={state.map(v => v.image_id)} hidden readOnly />
        <button
          type="submit"
          disabled={isSubmitting}
        >Update</button>
      </fetcher.Form>      
    </>
  )
}

function RenderImage({ data, isDraggedOver }: { data: ImageRowData; isDraggedOver: boolean }) {
  const fetcherKey = delFetcherKey
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== "idle"

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <figure style={{ border: isDraggedOver ? "1px dashed black" : undefined }}>
        <figcaption>{data.order}</figcaption>
        <div style={{ display: "flex" }}>
          <img
            src={data.link ?? ""}
            style={{ maxWidth: 200, maxHeight: 200 }}
          />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <button onClick={() => setIsDialogOpen(true)}>
              <i className="material-symbols-outlined">delete</i>
            </button>
            <a href={$PATH.main.images$imageId(data.image_id)}>
              <button type="button">Go</button>
            </a>
          </div>
        </div>
      </figure>
      
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <>
          <h3>Delete image #{data.order}?</h3>
          <fetcher.Form method="DELETE">
            <input type="text" name={config.action.name} value={config.action.names.image_delete} hidden readOnly />
            <input type="text" name={config.imageDelete.names.image_id} value={data.image_id} hidden readOnly />
            <button
              type="submit"
              disabled={isSubmitting}
            >Delete</button>
          </fetcher.Form>
        </>
      </Dialog>
    </>
  )
}
