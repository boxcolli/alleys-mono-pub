import classes from "./styles.module.css"
import { useFetcher } from "@remix-run/react"
import config from "./config"
import { useEffect, useState } from "react"
import { $POLICY } from "~/config"

type PaginationProps = {
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
}

export function Pagination({ page, setPage }: PaginationProps) {
  const fetcher = useFetcher({ key: config.key.countFetcher })
  const [count, setCount] = useState<number>(1)

  /**
   * Event:   fetcher update
   * Action:  update count state
   */
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) { return }

    // Parse
    const parsed = config.api.res.schema.safeParse(fetcher.data)
    if (!parsed.success) { return }
    const data = parsed.data
    if ("count" in data == false) { return }
    console.debug("count", data.count)
    // Update
    setCount(data.count)
  }, [fetcher.state, fetcher.data])

  if (fetcher.state !== "idle" || !fetcher.data) return (
    <Progress />
  )
  
  // init
  const size = config.policy.defaultSize

  // calculate
  const maxPage = Math.ceil(count / size)
  const rad = Math.floor($POLICY.main.exhibition.pageDisplayWidth / 2)
  const lo = Math.max(1, page - rad)
  const hi = Math.min(maxPage, page + rad)

  // button component
  function Go({ to }: { to: number }) {
    const here = (page === to)
    return (
      <button
        className={`chip ${here ? "primary" : "fill"}`}
        onClick={here ? undefined : _ => setPage(to)}
      >
        {here ? <strong>{to}</strong> : (to)}
      </button>
    )
  }

  return (
    <div className={`center-align ${classes["pagination"]}`}>
      {1 < lo && <Go to={1} />}
      {2 < lo && <i>more_horiz</i>}

      {Array.from({ length: hi - lo + 1 }).map((_, i) => (
        <Go key={`pagination-btn-${lo + i}`} to={lo + i} />
      ))}

      {hi < maxPage - 1 && <i>more_horiz</i>}
      {hi < maxPage && <Go to={maxPage} />}
    </div>
  )
}

function Progress() {
  return (
    <progress className="circle"></progress>
  )
}
