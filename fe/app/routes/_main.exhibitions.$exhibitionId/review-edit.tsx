import styles from "./styles.module.css"

import { useFetcher, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import config from "./config"
import postApi from "../api.exhibitions.$exhibitionId.reviews/config"
import modApi from "../api.exhibitions.$exhibitionId.reviews.$reviewId/config"
import { useDebounce, useIsMount, usePersistedState } from "~/client"
import { z } from "zod"
import { $PATH, $STORAGE } from "~/config"
import { dateToString } from "~/lib/date"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type Review = z.infer<typeof config.get.myReviewSchema>

const fetcherKey = {
  post: "fetcher-post",
  put: "fetcher-put",
  del: "fetcher-del",
}

export function ReviewEdit() {
  const { exhibition, myReview, myUniqueName } = useLoaderData<typeof loader>()
  if (!exhibition || !myUniqueName) return (
    null
  )

  /**
   * Render related
   */
  const [review, setReview] = useState<Review | null>(() => {
    if (!myReview) return null
    return {
      id: myReview.id,
      title: myReview.title,
      content: myReview.content,
      is_content_public: myReview.is_content_public,
      created_at: new Date(myReview.created_at),
    }
  })
  const [showEdit, setShowEdit] = useState<boolean>(myReview ? false : true)
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
    setReview(null)
    setShowEdit(true)
    setShowDeleteModal(false)
  }
  useEffect(() => {
    const parsed = modApi.del.res.schema.safeParse(deleteFetcher.data)
    if (!parsed.success) { return }
    console.debug("delete parsed.data:", parsed.data)
  }, [deleteFetcher])

  return (
    <>
      {/* Edit */}
      {showEdit && (
        <Edit
          type={review ? "put" : "post"}
          exhibitionId={exhibition.id}
          review={review}
          reviewId={review ? review.id : null}
          setReview={setReview}
          showEdit={showEdit}
          setShowEdit={setShowEdit}
        />
      )}
 
       {/* Display */}
      {review && !showEdit && (
        <Display
          review={review}
          showReviewMenu={showReviewMenu}
          setShowReviewMenu={setShowReviewMenu}
          setShowEdit={setShowEdit}
          setShowDeleteModal={setShowDeleteModal}
        />
      )}

      {/* Delete confirm modal */}
      {showDeleteModal ? createPortal(
        <>
          <div
            className={`overlay ${showDeleteModal ? "active" : ""}`}
            onClick={_ => setShowDeleteModal(false)}
          />
          <dialog className={`active`}>
            <h5>정말 리뷰를 삭제할까요?</h5>
            <nav>
              <button className="border" onClick={() => setShowDeleteModal(false)}>취소</button>
              <button
                className="error"
                onClick={() => { if (review) handleDelete(review.id) }}
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

type DisplayProps = {
  review: {
      title: string;
      id: string;
      content: string;
      is_content_public: boolean;
      created_at: Date;
  }
  showReviewMenu: boolean
  setShowReviewMenu: Dispatch<SetStateAction<boolean>>
  setShowEdit: Dispatch<SetStateAction<boolean>>
  setShowDeleteModal: Dispatch<SetStateAction<boolean>>
}
function Display({ review, showReviewMenu, setShowReviewMenu, setShowEdit, setShowDeleteModal }: DisplayProps) {
  const { myUniqueName } = useLoaderData<typeof loader>()
  
  return (
    <article className="border padding no-margin">          
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
    </article>
  )
}

type EditProps = {
  type: "post" | "put"
  exhibitionId: string
  review: Review | null
  reviewId: string | null
  setReview: Dispatch<SetStateAction<Review | null>>
  showEdit: boolean
  setShowEdit: Dispatch<SetStateAction<boolean>>
}
function Edit({ type, exhibitionId, review, reviewId, setReview, showEdit, setShowEdit }: EditProps) {
  const isPostType = type === "post"
  const isPutType = type === "put"
  /**
   * Store original/edit data
   */
  const [title, setTitle] = usePersistedState<string>(
    review?.title ?? "",
    $STORAGE.exhibitionDetail.reviewEdit.title.key,
    { use: "sessionStorage" },
  )
  const [content, setContent] = usePersistedState<string>(
    review?.content ?? "",
    $STORAGE.exhibitionDetail.reviewEdit.content.key,
    { use: "sessionStorage" },
  )
  const [isContentPublic, setIsContentPublic] = usePersistedState<boolean>(
    review?.is_content_public ?? true,
    $STORAGE.exhibitionDetail.reviewEdit.isPublic.key,
    { use: "sessionStorage" },
  )
  // const [title, setTitle] = useState<string>(review?.title ?? "")
  // const [content, setContent] = useState<string>(review?.content ?? "")
  // const [isContentPublic, setIsContentPublic] = useState<boolean>(review?.is_content_public ?? true)
  // textarea auto extend
  const handleContentInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target
    textarea.style.height = "auto" // Reset the height
    textarea.style.height = `${textarea.scrollHeight}px` // Set height to match content
    setContent(textarea.value)
  }

  /**
   * Handle request
   */
  const fetcher = useFetcher()
  const submit = useDebounce(fetcher.submit, 200)
  const isSubmitting = fetcher.state !== "idle"
  const handleRequest = () => {
    switch (type) {
      case "post":
        submit(
          {
            title,
            content,
            is_content_public: isContentPublic,
          } satisfies z.input<typeof postApi.post.req.schema>,
          {
            method: "POST",
            action: $PATH.api.exhibitions.$eid_reviews(exhibitionId),
            encType: "application/json",
          },
        )
        return
      case "put":
        if (!reviewId) return
        submit(
          {
            title,
            content,
            is_content_public: isContentPublic,
          } satisfies z.input<typeof modApi.put.req.schema>,
          {
            method: "PUT",
            action: $PATH.api.exhibitions.$eid_reviews$rid(exhibitionId, reviewId),
            encType: "application/json",
          },
        )
        return
      default:
        return
    }
  }

  useEffect(() => {
    if (fetcher.state !== "idle") return
    if (isPostType) {
      const parsed = postApi.post.res.schema.safeParse(fetcher.data)
      if (parsed.error) { return }
      console.debug("post parsed.data:", parsed.data)
      const d = parsed.data
      setReview({
        id: d.id,
        title,
        content,
        is_content_public: isContentPublic,
        created_at: d.created_at,
      })
      setShowEdit(false)
    }
    if (isPutType) {
      const parsed = modApi.put.res.schema.safeParse(fetcher.data)
      if (!parsed.success || !parsed.data) { return }
      console.debug("put parsed.data:", parsed.data)
      const d = parsed.data
      setReview({
        id: d.review_id,
        title,
        content,
        is_content_public: isContentPublic,
        created_at: d.created_at,
      })
      setShowEdit(false)
    }
  }, [fetcher])

  return (
    <div className={styles["review-edit"]}>
      <fieldset className="small-round border padding">
        <legend>리뷰 편집</legend>
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
            {/* is_content_public */}
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

            {isPutType && <button
              className="surface-dim"
              onClick={() => setShowEdit(false)}
              type="button"
            >취소</button>}

            <button
              onClick={() => handleRequest()}
              // disabled={isSubmitting}
              disabled={fetcher.state !== "idle"}
              type="button"
            >{fetcher.state !== "idle" ? <progress className="circle small" /> : "등록"}</button>
          </nav>
        </form>
      </fieldset>
    </div>
  )
}
