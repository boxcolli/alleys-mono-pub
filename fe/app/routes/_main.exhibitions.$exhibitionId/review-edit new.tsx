import styles from "./styles.module.css"

import { useFetcher, useLoaderData, useNavigate, useRevalidator } from "@remix-run/react"
import { loader } from "./loader"
import config from "./config"
import postApi from "../api.exhibitions.$exhibitionId.reviews/config"
import modApi from "../api.exhibitions.$exhibitionId.reviews.$reviewId/config"
import { useDebounce, usePersistedState } from "~/client"
import { z } from "zod"
import { $PATH, $STORAGE } from "~/config"
import { dateToString } from "~/lib/date"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export function ReviewEdit() {
  const { exhibition, myReview, myUniqueName } = useLoaderData<typeof loader>()
  if (!exhibition || !myUniqueName) return (
    null
  )

  /**
   * Render related
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
  
  /**
   * Store original/edit data
   */
  const [review, setReview] = useState(myReview)
  const [title, setTitle] = usePersistedState<string>(
    myReview?.title ?? "",
    $STORAGE.exhibitionDetail.reviewEdit.title.key,
    { use: "sessionStorage" },
  )
  const [content, setContent] = usePersistedState<string>(
    myReview?.content ?? "",
    $STORAGE.exhibitionDetail.reviewEdit.content.key,
    { use: "sessionStorage" },
  )
  const [isContentPublic, setIsContentPublic] = usePersistedState<boolean>(
    myReview?.is_content_public ?? true,
    $STORAGE.exhibitionDetail.reviewEdit.isPublic.key,
    { use: "sessionStorage" },
  )
  const [showEdit, setShowEdit] = useState<boolean>(review ? false : true)
  // textarea auto extend
  const handleContentInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target
    textarea.style.height = "auto" // Reset the height
    textarea.style.height = `${textarea.scrollHeight}px` // Set height to match content
    setContent(textarea.value)
  }

  /**
   * Handle POST
   */
  const postFetcher = useFetcher()
  const postSubmit = useDebounce(postFetcher.submit, 500)
  const isPostSubmitting = postFetcher.state !== "idle"
  const handlePost = () => {
    postSubmit(
      {
        title,
        content,
        is_content_public: isContentPublic,
      } satisfies z.input<typeof postApi.post.req.schema>,
      {
        method: "POST",
        action: $PATH.api.exhibitions.$eid_reviews(exhibition.id),
        encType: "application/json",
      },
    )
  }
  /**
   * Event: response from api
   * Action: update state values; hide edit component
   */
  useEffect(() => {
    if (postFetcher.state !== "idle") return

    const parsed = postApi.post.res.schema.safeParse(postFetcher.data)
    if (!parsed.success || !parsed.data) { return }

    const d = parsed.data
    setReview({
      id: d.id,
      title,
      content,
      is_content_public: isContentPublic,
      created_at: d.created_at,
    })
    setShowEdit(false)
    console.log("post success")
  }, [postFetcher.state, showEdit])
  
  /**
   * Handle PUT
   */
  const putFetcher = useFetcher()
  const putSubmit = useDebounce(putFetcher.submit, 500)
  const isPutSubmitting = putFetcher.state !== "idle"
  const handlePut = (reviewId: string) => {
    putSubmit(
      {
        title,
        content,
        is_content_public: isContentPublic,
      } satisfies z.input<typeof modApi.put.req.schema>,
      {
        method: "PUT",
        action: $PATH.api.exhibitions.$eid_reviews$rid(exhibition.id, reviewId),
        encType: "application/json",
      },
    )
  }
  /**
   * Event: response from api
   * Action: update state values
   */
  useEffect(() => {
    if (putFetcher.state !== "idle") return

    const parsed = modApi.put.res.schema.safeParse(putFetcher.data)
    if (!parsed.success || !parsed.data) { return }

    const d = parsed.data
    setReview({
      id: d.review_id,
      title,
      content,
      is_content_public: isContentPublic,
      created_at: d.created_at,
    })
    setShowEdit(false)
  }, [putFetcher.state, showEdit])

  /**
   * Handle DELETE
   */
  const deleteFetcher = useFetcher()
  const deleteSubmit = useDebounce(deleteFetcher.submit, 500)
  const isDeleteSubmitting = deleteFetcher.state !== "idle"
  const handleDelete = (reviewId: string) => {
    deleteSubmit(null, {
      method: "DELETE",
      action: $PATH.api.exhibitions.$eid_reviews$rid(exhibition.id, reviewId),
    })
  }
  useEffect(() => {
    const parsed = modApi.del.res.schema.safeParse(deleteFetcher.data)
    if (!parsed.success) { return }

    setReview(null)
    setShowEdit(true)
    setShowDeleteModal(false)
  }, [deleteFetcher.data, showEdit, showDeleteModal])

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
                  checked={isContentPublic}
                  onChange={e => setIsContentPublic(e.target.value === "true")}
                />
                <span>공개</span>
              </label>

              <label htmlFor="public" className="radio">
                <input id="public" type="radio" name="radio_"
                  value="false"
                  checked={!isContentPublic}
                  onChange={e => setIsContentPublic(e.target.value === "true")}
                />
                <span>한줄평만 공개</span>
              </label>

              <div className="max" />

              {review && <button
                className="surface-dim"
                onClick={() => setShowEdit(false)}
                type="button"
              >취소</button>}
              <button
                onClick={review ? () => handlePut(review.id) : handlePost
                }
                disabled={review ? isPutSubmitting : isPostSubmitting}
                type="button"
              >{isPutSubmitting ? <progress className="circle small" /> : "등록"}</button>
            </nav>
          </form>
        </fieldset>
      </div>

       {/* Display */}
      {review && !showEdit && <article className="border padding no-margin">          
          <h5 className="small">{review.title}</h5>
          <p>{review.content}</p>
          <p className="right-align">{dateToString(new Date(review.created_at), ".")} / {myUniqueName}</p>
          <nav>
            <p className="primary-text">
              <i>public</i>&nbsp;
              {review.is_content_public ? "공개" : "한줄평만 공개"}
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
                  onClick={review ? () => handleDelete(review.id) : undefined}
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