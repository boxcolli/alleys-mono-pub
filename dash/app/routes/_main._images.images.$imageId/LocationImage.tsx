import { Await, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import { Suspense } from "react"
import { $PATH } from "~/config"

export function LocationImage() {
  const { locationImages } = useLoaderData<typeof loader>()
  if (!locationImages) return (
    <p>Something went wrong.</p>
  )

  return (
    <>
      <h3>Location Image</h3>
      <Suspense fallback={<progress />}>
        <Await resolve={locationImages}>
          {locationImages => locationImages && (
            <table>
              <thead>
                <th>#</th>
                <th>name_korean</th>
              </thead>
              <tbody>
                {locationImages.map((lo, index) => (
                  <tr>
                    <td>{index}</td>
                    <td>{lo.name_korean}</td>
                    <td>
                      <a href={$PATH.main.locations$locationId(lo.id)}>
                        <button>Go</button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Await>
      </Suspense>
    </>
  )
}