import { Await, useLoaderData } from "@remix-run/react"
import { Edit } from "./Edit"
import { loader } from "./loader"
import { action } from "./action"
import { AboutKorean } from "./AboutKorean"
import { ImageAdd } from "./ImageAdd"
import { ImageEdit } from "./ImageEdit"
import { Suspense } from "react"

export { loader, action }

const gotos = [ "edit", "about-korean", "image-add", "image-edit" ]

export default function Index() {
  const { exhibitionId, exhibition } = useLoaderData<typeof loader>()

  return (
    <>
      <h2>{exhibitionId}</h2>
      <Suspense fallback={<progress />}>
        <Await resolve={exhibition}>
          {exhibition => exhibition && (
            <>
              <h3>{exhibition.name_korean}</h3>
              {exhibition.link_korean && (
                <a href={exhibition.link_korean} target="_blank"><i className="material-symbols-outlined">link</i></a>
              )}
            </>
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
        <AboutKorean />
      </section>

      <section id={gotos[2]}>
        <ImageAdd />
      </section>

      <section id={gotos[3]}>
        <ImageEdit />
      </section>
    </>
  )
}
