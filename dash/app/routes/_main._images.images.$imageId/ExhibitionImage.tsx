import { Await, useLoaderData } from "@remix-run/react";
import { loader } from "./loader";
import { Suspense } from "react";
import { $PATH } from "~/config";

export function ExhibitionImage() {
  const { exhibitionImages } = useLoaderData<typeof loader>()
  if (!exhibitionImages) return (
    <p>Something went wrong.</p>
  )

  return (
    <>
      <h3>Exhibition Image</h3>
      <Suspense fallback={<progress />}>
        <Await resolve={exhibitionImages}>
          {exhibitionImages => exhibitionImages && (
            <table>
              <thead>
                <th>exhibition_id</th>
                <th>order</th>
                <th>created_at</th>
              </thead>
              <tbody>
                {exhibitionImages.map((ex, index) => (
                  <tr key={`exhibition-image-${index}`}>
                    <td>{ex.exhibition_id}</td>
                    <td>{ex.order}</td>
                    <td>{new Date(ex.created_at).toLocaleDateString()}</td>
                    <td>
                      <a href={$PATH.main.exhibitions$exhibitionId(ex.exhibition_id)}>
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