import config from "./config"

import date from "@alleys/lib/date"
import { Await, useLoaderData, useSearchParams } from "@remix-run/react"
import { loader } from "./loader"
import { Suspense } from "react"
import { useDebounce } from "@alleys/lib/client/use-debounce"
import { Pagination } from "./Pagination"
import { $PATH } from "~/config"

export { loader }

export default function Index() {
  const { images, total } = useLoaderData<typeof loader>()
  if (!images || !total) return (
    <p>There was an error.</p>
  )

  const [searchParams, _setSearchParams] = useSearchParams()
  const setSearchParams = useDebounce(_setSearchParams, 100)

  return (
    <>
      {/* Find input */}
      <input type="text" placeholder="Search by name" onChange={e => {
        const sp = new URLSearchParams(searchParams)
        sp.set(config.spNames.find, e.currentTarget.value)
        setSearchParams(sp, { preventScrollReset: true })
      }} />

      {/* # of result */}
      <Suspense fallback={<progress />}>
        <Await resolve={total}>
          {total => (
            <p>
              <output>{total?.total ?? "error"}</output> results
            </p>
          )}
        </Await>
      </Suspense>

      {/* Table */}
      <Suspense fallback={<progress />}>
        <Await resolve={images}>
          {images => (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>id</th>
                  <th>provider</th>
                  <th>bucket</th>
                  <th>entry</th>
                  <th>source</th>
                  <th>created_at</th>
                </tr>
              </thead>
              <tbody>
                {images.map((ex, num) => (
                  <tr
                    key={`exhibition-row-${num}`}
                    onClick={() => window.location.href = $PATH.main.images$imageId(ex.id)}
                    title={`Go to ${ex.id}`}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{num + 1}</td>
                    <td>{ex.id}</td>
                    <td>{ex.provider}</td>
                    <td>{ex.bucket}</td>
                    <td><pre>{ex.entry}</pre></td>
                    <td>{ex.source}</td>
                    <td>{date.dateToString(new Date(ex.created_at), ".")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}  
        </Await>
      </Suspense>

      <Pagination />
    </>
  )
}
