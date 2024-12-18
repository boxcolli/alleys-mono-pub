import { Await, useFetcher, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import createFolderApi from "../api.folders/config"
import addFolderApi from "../api.folders.$folderId.exhibitions/config"
import deleteFolderApi from "../api.folders.$folderId.exhibitions.$exhibitionId/config"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useForm } from "@rvf/remix"
import { z } from "zod"
import { $PATH } from "~/config"

type FolderData = {
  id: string
  name: string
  isPublic: boolean
  isAdded: boolean
}

export function Folder() {
  const { exhibition, myFolders, addedFolderIds, } = useLoaderData<typeof loader>()
  if (!exhibition || !myFolders || !addedFolderIds) return (
    null
  )
  
  if (myFolders == null || addedFolderIds == null) return (
    null
  )
  
  const [folders, setFolders] = useState(() => {
    let reducedFolders: Record<string, FolderData> = {}
    for (let v of myFolders) {
      reducedFolders[v.id] = {
        id: v.id,
        name: v.name,
        isPublic: v.is_public,
        isAdded: addedFolderIds[v.id] ?? false,
      }
    }
    return reducedFolders
  })
  const[opencreateFolderModal, setOpencreateFolderModal] = useState(false)
  const isAdded = Object.values(folders).some(v => v.isAdded === true)

  /**
   * Create folder
   */
  const createFolderForm = useForm({
    validator: createFolderApi.post.req.validator,
    method: "post",
    action: $PATH.api.folders.index,
  })
  const isCreateFolderSubmitting = createFolderForm.formState.isSubmitting

  /**
   * Add to folder
   */
  const addFolderFetcher = useFetcher()
  const addFolderSubmit = (folderId: string) => {
    addFolderFetcher.submit(
      { id: exhibition.id } satisfies z.infer<typeof addFolderApi.post.req.schema>,
      {
        method: "post",
        action: $PATH.api.folders.$fid_exhibitions(folderId),
        encType: "application/json",
      },
    )

    // optimistic  ui
    setFolders(prev => ({
      ...prev,
      [folderId]: { ...prev[folderId], isAdded: true },
    }))
  }
  useEffect(() => {
    if (addFolderFetcher.state !== "idle") { return }

    const parsed = addFolderApi.post.res.schema.safeParse(addFolderFetcher.data)
    if (parsed.error) { return }

    const data = parsed.data
    if (!data.ok) {
      // request failed.
      setFolders(prev => ({
        ...prev,
        [data.folder_id]: { ...prev[data.folder_id], isAdded: false },
      }))
    }
  }, [addFolderFetcher])


  /**
   * Delete from folder
   */
  const deleteFolderFetcher = useFetcher()
  const deleteFolderSubmit = (folderId: string) => {
    deleteFolderFetcher.submit(null, {
      method: "delete",
      action: $PATH.api.folders.$fid_exhibitions$eid(folderId, exhibition.id),
      encType: "application/json",
    })

    // optimistic  ui
    setFolders(prev => ({
      ...prev,
      [folderId]: { ...prev[folderId], isAdded: false },
    }))
  }
  useEffect(() => {
    if (deleteFolderFetcher.state !== "idle") { return }

    const parsed = deleteFolderApi.del.res.schema.safeParse(deleteFolderFetcher.data)
    if (parsed.error) { return }

    const data = parsed.data
    if (!data.ok) {
      setFolders(prev => ({
        ...prev,
        [data.folder_id]: { ...prev[data.folder_id], isAdded: true },
      }))
    }
  }, [deleteFolderFetcher])

  return (
    <>
      <button className="surface-dim">
        {isAdded ? <i>bookmark_added</i> : <i>bookmark</i>}
        저장<i>arrow_drop_down</i>
        <menu className="left no-wrap">
          {Object.entries(folders).map(([folderId, v]) => (
            <a key={`folder-item-${folderId}`} className="row" onClick={() => {
              if (v.isAdded) {
                deleteFolderSubmit(folderId)
              } else {
                addFolderSubmit(folderId)
              }
            }} >
              {v.isAdded ? <i>check_box</i> : <i>check_box_outline_blank</i>}
              {v.name}
              {v.isPublic ? <i>public</i> : null}
            </a>
          ))}
          <hr />
          <a className="row" onClick={() => setOpencreateFolderModal(true)}>
            <i>create_new_folder</i>
            폴더 추가
          </a>
        </menu>
      </button>

      {/* Create folder modal */}
      {opencreateFolderModal && createPortal(
        <>
          <div
            className={`overlay ${opencreateFolderModal ? "active" : ""}`}
            onClick={() => setOpencreateFolderModal(false)}
          />
          <dialog className={`${opencreateFolderModal ? "active" : ""}`}>
            <form {...createFolderForm.getFormProps()}>
              <div className="row">
                <div className="field label border">
                  <input type="text" placeholder=" " name={createFolderApi.post.req.names.name} />
                  <label>폴더 이름</label>
                </div>
              </div>

              <div className="field middle-align">
                <nav>
                  <label className="radio">
                    <input type="radio" name={createFolderApi.post.req.names.is_public} value="true" defaultChecked />
                    <span>공개</span>
                  </label>
                  <label className="radio">
                    <input type="radio" name={createFolderApi.post.req.names.is_public} value="false" />
                    <span>비공개</span>
                  </label>
                </nav>
              </div>

              <button type="submit" disabled={isCreateFolderSubmitting}>폴더 추가</button>
            </form>
          </dialog>
        </>,
        document.body,
      )}
    </>
  )
}
