import { Await, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import { Suspense } from "react"
import { Edit } from "./Edit"
import { ExhibitionImage } from "./ExhibitionImage"
import { LocationImage } from "./LocationImage"

export { loader }

const gotos = [ "edit", "exhibition_image", "location_image" ]

export default function Index() {
  const { imageId, image } = useLoaderData<typeof loader>()

  return (
    <>
      <h2>{imageId}</h2>
      <Suspense fallback={<progress />}>
        <Await resolve={image}>
          {image => image && (
            <div style={{ display: "flex" }}>
              <img src={image.link} width={200} height={200} />
              <table>
                <tbody>
                  <tr>
                    <td>provider</td>
                    <td><pre>{image.provider}</pre></td>
                  </tr>
                  <tr>
                    <td>bucket</td>
                    <td><pre>{image.bucket}</pre></td>
                  </tr>
                  <tr>
                    <td>entry</td>
                    <td><pre>{image.entry}</pre></td>
                  </tr>
                  <tr>
                    <td>link</td>
                    <td><a href={image.link}><pre>{image.link}</pre></a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Await>
      </Suspense>
      <nav>
        <ul>
          {gotos.map(v => (
            <li key={`anchor-${v}`}>
              <a href={"#" + v}>{v}</a>
            </li>
          ))}
        </ul>
      </nav>

      <section id={gotos[0]}>
        <Edit />
      </section>
      <section id={gotos[1]}>
        <ExhibitionImage />
      </section>
      <section id={gotos[2]}>
        <LocationImage />
      </section>
    </>
  )
}
