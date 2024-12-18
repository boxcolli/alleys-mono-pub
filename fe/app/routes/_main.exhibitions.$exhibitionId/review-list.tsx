import classes from "./styles.module.css"
import api from "../api.exhibitions.$exhibitionId.reviews/config"

import { useDebounce } from "~/client"
import { useFetcher, useParams } from "@remix-run/react"
import { useEffect, useState } from "react"
import { $PATH } from "~/config"
import { dateToString } from "~/lib/date"
import { Pagination } from "~/components"

const config = {
  paginationSize: 10,
  paginationRadius: 2,
}

type ReviewListProps = {
  reviewCount: number
}

export function ReviewList({ reviewCount }: ReviewListProps) {
  const params = useParams()
  const exhibitionId = params["exhibitionId"]
  if (!exhibitionId) {
    return <p>Something went wrong.</p>
  }

  const fetcher = useFetcher()
  const load = useDebounce(fetcher.load, 300)
  const [page, setPage] = useState(1)

  /**
   * Event: page state change
   * Action: request data
   */
  useEffect(() => {
    const path = $PATH.api.exhibitions.$eid_reviews(exhibitionId)
    const sp = new URLSearchParams({
      page: String(page),
      size: String(config.paginationSize)
    })
    const url = `${path}?${sp.toString()}`
    load(url)
  }, [page])

  if (fetcher.state !== "idle") return (
    <progress />
  )

  const parsed = api.get.res.schema.safeParse(fetcher.data)
  if (!parsed.success) return (
    null
  )
  const reviews = parsed.data.reviews

  return (
    <>
      {reviews.map((review, index) => (
        <article key={`review-list-item-${index}`} id={`review-${index}`} className="border padding">
          <h5 className="small">{review.title}</h5>
          <p>{review.content}</p>
          <p className="right-align">{dateToString(review.created_at, ".")} / {review.unique_name}</p>
        </article>
      ))}

      <article className="surface-container-high">
        <Pagination
          page={page}
          setPage={setPage}
          size={config.paginationSize}
          total={reviewCount}
          r={config.paginationRadius}
        />
      </article>
    </>
  )
}
