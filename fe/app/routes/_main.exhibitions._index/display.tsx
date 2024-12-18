import { Await, Link, useFetcher, useLoaderData, useLocation, useNavigate } from "@remix-run/react"
import { $PATH } from "~/config"
import classes from "./styles.module.css"
import { z } from "zod"
import { useIsMount } from "~/client"
import config from "./config"
import { loader } from "./loader"
import { Suspense } from "react"

export function Display() {
  const { locationRecord } = useLoaderData<typeof loader>()
  const isMount = useIsMount()
  const fetcher = useFetcher({ key: config.key.dataFetcher })
  const navigate = useNavigate()

  if (isMount || fetcher.state !== "idle") return (
    <progress />
  )

  if (!fetcher.data) return (
    <DisplayMessage text={"이런, 새로고침을 해주세요."} />
  )

  // Parse
  let exhibitions: z.infer<typeof config.api.res.data>[]
  {
    const parsed = config.api.res.schema.safeParse(fetcher.data)
    if (parsed.success == false) return (
      <DisplayMessage text={"이런, 새로고침을 해주세요."} />
    )
    const data = parsed.data
    if ("data" in data == false) return (
      <DisplayMessage text={"이런, 새로고침을 해주세요."} />
    )
    
    exhibitions = data.data
    if (exhibitions.length == 0) return (
      <DisplayMessage text={"아직 소식이 들어오지 않았어요."}/>
    )
  }
  
  return (
    <div className={classes["display"]}>
      <Suspense fallback={<progress />}>
        <Await resolve={locationRecord}>
          {locationRecord => exhibitions.map((ex, i) => {
            let locationName: string = ""
            if (locationRecord == null || !ex.location_id) {
              locationName = ""
            } else {
              const v = locationRecord[ex.location_id]
              if (!v) {
                locationName = ""
              } else {
                locationName = v
              }
            }
            
            return (
              <div
                key={`display-item-${i}`}
                className={classes["display-item"]}
              >
                <Link to={$PATH.main.exhibitions$exhibitionId(ex.id)}>
                  <article className={`surface-container`}>
                    <img src={ex.image_link ?? ""} />
                    <div className={classes["display-info"]}>
                      <p className={`small ${classes["location"]}`}>{locationName}</p>
                      <h6 className={`small ${classes["title"]}`}><strong>{ex.name_korean}</strong></h6>
                      {/* <code className={`${classes["dates"]}`}>{getDateFormat(e.start_date)} - {getDateFormat(e.end_date)}</code> */}
                      <div className={classes["dates"]}>
                        <p className="left-align">{getDateFormat(ex.start_date)}</p>
                        <p className="center-align">/</p>
                        <p className="right-align">{ex.end_date ? getDateFormat(ex.end_date) : ""}</p>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            )
          })}
        </Await>
      </Suspense>
    </div>
  )
}

function DisplayMessage({ text }: { text: string }) {
  return (
    <>
      <i>sentiment_stressed</i>
      <h5>{text}</h5>
    </>
  )
}

function getDateFormat(d: Date) {
  const year = d.getFullYear().toString().substring(2)
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const date = d.getDate().toString().padStart(2, "0")
  return `${year}.${month}.${date}`
}
