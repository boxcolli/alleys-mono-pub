import { Await, useLoaderData } from "@remix-run/react"
import { Edit } from "./edit"
import { loader } from "./loader"
import { action } from "./action"
import { AboutKorean } from "./about-korean"

export { loader, action }

const gotos = [
  "edit", "about-korean"
]

export default function Index() {
  const { location } = useLoaderData<typeof loader>()

  return (
    <>
      <Await resolve={location}>
        {location => location && (
          <>
            <h2>{location.name_korean} {location.id}</h2>
            {location.link_korean && (
              <a href={location.link_korean}><i className="material-symbols-outlined">link</i></a>
            )}
          </>
        )}
      </Await>
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
    </>
  )
}
