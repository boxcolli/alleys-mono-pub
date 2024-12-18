import config from "./config"

import date from "@alleys/lib/date"
import { Await, useLoaderData, useSearchParams } from "@remix-run/react"
import { loader } from "./loader"
import { Suspense } from "react"
import { useDebounce } from "@alleys/lib/client/use-debounce"
import { Pagination } from "./pagination"
import { $PATH } from "~/config"

export { loader }

export default function Index() {
  const { exhibitions, total } = useLoaderData<typeof loader>()
  if (!exhibitions || !total) return (
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
        <Await resolve={exhibitions}>
          {exhibitions => (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>id</th>
                  <th>name</th>
                  <th>visibility</th>
                  <th>created_at</th>
                </tr>
              </thead>
              <tbody>
                {exhibitions.map((ex, num) => (
                  <tr
                    key={`exhibition-row-${num}`}
                    onClick={() => window.location.href = $PATH.main.exhibitions$exhibitionId(ex.id)}
                    title={`Go to ${ex.name_korean}`}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{num + 1}</td>
                    <td>{ex.id}</td>
                    <td>{ex.name_korean}</td>
                    <td>
                      {ex.is_visible
                        ? <i className="material-symbols-outlined">visibility</i>
                        : <i className="material-symbols-outlined">visibility_off</i>
                      }
                    </td>
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
