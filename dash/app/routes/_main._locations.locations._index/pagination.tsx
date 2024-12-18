import config from "./config"
import { Await, useLoaderData, useSearchParams } from "@remix-run/react"
import { loader } from "./loader"
import { Suspense } from "react"

export function Pagination() {
  const { total } = useLoaderData<typeof loader>()
  if (!total) return (
    <p>There was an error.</p>
  )

  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <>
      <Suspense fallback={<progress />}>
        <Await resolve={total}>
          {total => {
            if (!total) return (
              <p>There was an error.</p>
            )

            const rad = 3

            const here = Number(searchParams.get(config.spNames.page) ?? 1)
            const maxPage = Math.floor(total.total / config.policy.pageSize + 1)
            
            const lo = Math.max(1, here - rad)
            const hi = Math.min(maxPage, here + rad)
            const range = Array.from({ length: hi - lo + 1 }, (_, idx) => lo + idx)

            const Go = ({ to }: { to: Number }) => (
              <button onClick={() => {
                const sp = new URLSearchParams(searchParams)
                sp.set(config.spNames.page, String(to))
                setSearchParams(sp, { preventScrollReset: true })
              }}>
                {to == here
                  ? <strong>{String(to)}</strong>
                  : String(to)
                }
              </button>
            )

            return (
              <div>
                {lo == 1 ? null : <Go to={1} />}
                {lo <= rad ? null : <span>...</span>}
                {range.map(v => <Go key={`pagination-btn-${v}`} to={v} />)}
                {hi > maxPage - rad ? null : <span>...</span>}
                {hi == maxPage ? null : <Go to={maxPage} />}
              </div>
            )
          }}
        </Await>
      </Suspense>
    </>
  )
}