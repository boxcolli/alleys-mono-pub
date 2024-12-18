import styles from "./styles.module.css"

import { useFetcher, useLoaderData, useNavigate, useRevalidator } from "@remix-run/react"
import { loader } from "./loader"
import config from "./config"
import api from "../api.exhibitions.$exhibitionId.reviews/config"
import { useDebounce, usePersistedState } from "~/client"
import { z } from "zod"
import { $PATH, $STORAGE } from "~/config"
import { dateToString } from "~/lib/date"
import { useEffect, useRef, useState } from "react"
import { useForm } from "@rvf/remix"
import format from "@stdlib/string-format"
import { createPortal } from "react-dom"

export function ReviewEdit() {
  const { exhibition, my_review, unique_name } = useLoaderData<typeof loader>()
  if (!exhibition || !unique_name) return (
    null
  )

  /**
   * Store original/edit data
   */
  const [myReview, setMyReview] = useState(my_review)
  const [title, setTitle] = usePersistedState<string>(
    my_review?.title ?? "",
    $STORAGE.exhibitionDetail.reviewEdit.title.key,
    { use: "sessionStorage" },
  )
  const [content, setContent] = usePersistedState<string>(
    my_review?.content ?? "",
    $STORAGE.exhibitionDetail.reviewEdit.content.key,
    { use: "sessionStorage" },
  )
  const [isPublic, setIsPublic] = usePersistedState<boolean>(
    my_review?.is_public ?? true,
    $STORAGE.exhibitionDetail.reviewEdit.isPublic.key,
    { use: "sessionStorage" },
  )

  // textarea auto extend
  const handleContentInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target
    textarea.style.height = "auto" // Reset the height
    textarea.style.height = `${textarea.scrollHeight}px` // Set height to match content
    setContent(textarea.value)
  }

  const putFetcher = useFetcher()
  const putSubmit = useDebounce(putFetcher.submit, 500)
  const isPutSubmitting = putFetcher.state !== "idle"
  const [showEdit, setShowEdit] = useState<boolean>(my_review ? false : true)
  const handleSubmit = () => {
    putSubmit(
      {
        id: my_review?.id ?? null,
        title,
        content,
        is_public: isPublic,
      } satisfies z.input<typeof api.put.req>,
      {
        method: "put",
        action: format($PATH.api.exhibitionsReviews, exhibition.id),
        encType: "application/json",
      },
    )
  }

  /**
   * Event: response from api
   * Action: update state values; hide edit component
   */
  useEffect(() => {
    const parsed = api.put.res.safeParse(putFetcher.data)
    if (!parsed.success || !parsed.data) { return }

    const d = parsed.data
    setMyReview({
      id: d.id,
      title: title,
      content: content,
      is_public: isPublic,
      created_at: d.created_at.toString(),
      unique_name: unique_name,
    })
    setShowEdit(false)
  }, [putFetcher.data])

  const deleteFetcher = useFetcher()
  const deleteSubmit = useDebounce(deleteFetcher.submit, 500)
  const isDeleteSubmitting = deleteFetcher.state !== "idle"
  const handleDelete = () => {
    deleteSubmit(null, {
      method: "delete",
      action: format($PATH.api.exhibitionsReviews, exhibition.id),
    })
  }
  useEffect(() => {
    const parsed = api.del.res.safeParse(deleteFetcher.data)
    if (!parsed.success) { return }

    setMyReview(null)
    setShowEdit(true)
    setShowDeleteModal(false)
  }, [deleteFetcher.data])

  /**
   * Review dropdown menu
   */
  const [showReviewMenu, setShowReviewMenu] = useState(false)
  const reviewMenuRef = useRef<HTMLElement>(null)
  const reviewMenuButtonRef = useRef<HTMLButtonElement>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const handleClickOutside = (e: MouseEvent) => {
    // Ignore clicks on the button itself
    if (
      reviewMenuButtonRef.current &&
      reviewMenuButtonRef.current.contains(e.target as Node)
    ) { return }

    if (
      e.target &&
      reviewMenuRef.current &&
      !reviewMenuRef.current.contains(e.target as Node)
    ) {
      setShowReviewMenu(false)
    }
  }
  useEffect(() => {
    document.addEventListener("pointerdown", handleClickOutside)
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside)
    }
  }, [])

  return (
    <>
      {/* Edit */}
      <div className={styles["review-edit"]} hidden={!showEdit}>
        <fieldset className="small-round border padding">
          <legend>리뷰 {myReview ? "편집" : "쓰기"}</legend>
          <form action="">
            {/* title */}
            <div className="field label no-margin">
              <input id="title" type="text" placeholder="한줄평"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* content */}
            <div className={`field label textarea ${styles["textarea-div"]}`}>
              <textarea name="" id="content" placeholder="본문" value={content}
                onChange={handleContentInput}
              />
            </div>

            <nav>
              <label htmlFor="private" className="radio">
                <input id="private" type="radio" name="radio_"
                  value="true"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.value === "true")}
                />
                <span>공개</span>
              </label>

              <label htmlFor="public" className="radio">
                <input id="public" type="radio" name="radio_"
                  value="false"
                  checked={!isPublic}
                  onChange={e => setIsPublic(e.target.value === "true")}
                />
                <span>한줄평만 공개</span>
              </label>

              <div className="max" />

              {my_review && <button
                className="surface-dim"
                onClick={() => setShowEdit(false)}
                type="button"
              >취소</button>}
              <button
                onClick={handleSubmit}
                disabled={isPutSubmitting}
                type="button"
              >{isPutSubmitting ? <progress className="circle small" /> : "등록"}</button>
            </nav>
          </form>
        </fieldset>
      </div>

       {/* Display */}
      {myReview && !showEdit && <article className="border padding no-margin">          
          <h5 className="small">{myReview.title}</h5>
          <p>{myReview.content}</p>
          <p className="right-align">{dateToString(new Date(myReview.created_at), ".")} / {myReview.unique_name}</p>
          <nav>
            <p className="primary-text">
              <i>public</i>&nbsp;
              {myReview.is_public ? "공개" : "한줄평만 공개"}
            </p>
            <div className="max" />
            <button className="transparent circle">
              <i>more_vert</i>
              <menu className="left no-wrap">
                <a className="row" onClick={() => setShowEdit(true)}>
                  <i>edit</i>
                  <span>편집</span>
                </a>
                <a className="row" onClick={() => setShowDeleteModal(true)}>
                  <i>delete</i>
                  <span>삭제</span>
                </a>
              </menu>
            </button>
          </nav>
        </article>}

        {/* Delete confirm modal */}
        {showDeleteModal ? createPortal(
          <>
            <div
              className={`overlay ${showDeleteModal ? "active" : ""}`}
              onClick={_ => setShowDeleteModal(false)}
            />
            <dialog className={`${showDeleteModal ? "active" : ""}`}>
              <h5>정말 리뷰를 삭제할까요?</h5>
              <nav>
                <button className="border" onClick={() => setShowDeleteModal(false)}>취소</button>
                <button
                  className="error"
                  onClick={handleDelete}
                  disabled={isDeleteSubmitting}
                >
                  {isDeleteSubmitting
                    ? <progress className="circle small" />
                    : "네, 리뷰를 삭제하겠습니댜."
                  }
                </button>
              </nav>
            </dialog>
          </>,
          document.body,
        ) : null}
    </>
  )
}
