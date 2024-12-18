import classes from "./styles.module.css"

import { Await, Link, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react"
import { loader } from "./loader"
import Markdown from "react-markdown"
import { $POLICY } from "~/config"
import { Suspense, useState } from "react"
import config from "./config"
import { ReviewList } from "./review-list"
import { ReviewEdit } from "./review-edit"
import { Folder } from "./folder"

export { loader }

export default function Page() {
  const { exhibition, reviewCount } = useLoaderData<typeof loader>()
  if (exhibition == null) return (
    <>
      <p>일시적인 오류가 발생했거나 비공개된 정보입니다.</p>
    </>
  )

  /**
   * Params: from
   */
  // const [params] = useSearchParams()
  // const paramResult = config.param.schema.safeParse(Object.fromEntries(params.entries()))
  // let paramData = paramResult.data
  // let from = paramData ? paramData.from : undefined

  /**
   * Artist display handle
   */
  const artistsTooMany = (
    exhibition.artists_string
      ? exhibition.artists_string.length >= $POLICY.main.exhibitionDetail.artistStringMaxLength
      : false
  )
  const [showArtists, setShowArtists] = useState<boolean>(false)

  return (
    <>
      <header className="surface transparent fixed">
        <nav>
          {/* {from && (
            <button
              className="circle transparent"
              onClick={_ => navigate(from)}
            >
              <i>arrow_back</i>
            </button>
          )} */}

          <div className="max" />

          <Folder />

          <button className="transparent">
            <i>share</i>
            <span>링크</span>
          </button>
        </nav>
      </header>

      <h2 className="small padding no-margin">
        <strong>{exhibition.name_korean}</strong>
      </h2>

      <div className="small-padding no-margin">
        <hr />
      </div>

      <div className={classes["layout"]}>
        <section className={classes["section-info"]}>
          <img className="" src={exhibition.image_link ?? ""} />
          <table className="medium-space">
            <tbody>
              <tr>
                <td className="min">
                  <button className="chip">
                    <i>brush</i>
                    <span>작가</span>
                  </button>
                </td>
                <td>
                  {artistsTooMany ? (
                    <>
                      <button
                        className="surface-dim small-round vertical"
                        onClick={_ => setShowArtists(true)}
                      >
                        <span>{
                          exhibition.artists_string
                            ? exhibition.artists_string.substring(0, $POLICY.main.exhibitionDetail.artistStringMaxLength + 1)
                            : ""
                        }</span>
                        <i>more_horiz</i>
                      </button>
                      <div
                        className={`overlay ${showArtists ? "active" : ""}`}
                        onClick={_ => setShowArtists(false)}
                      />
                      <dialog className={` ${showArtists ? "active" : ""}`}>
                        {exhibition.artists_string}
                      </dialog>
                    </>
                  ) : (
                    exhibition.artists_string
                  )}
                </td>
              </tr>
              <tr>
                <td className="min">
                  <button className="chip">
                    <i>line_start_diamond</i>
                    <span>시작</span>
                  </button>
                </td>
                <td>{getDate(new Date(exhibition.start_date))}</td>
              </tr>
              <tr className="min">
                <td>
                  <button className="chip">
                    <i>line_end_diamond</i>
                    <span>종료</span>
                  </button>
                </td>
                <td>{exhibition.end_date ? getDate(new Date(exhibition.end_date)) : null}</td>
              </tr>
              <tr>
                <td>
                  <button className="chip">
                    <i>flag</i>
                    <span>장소</span>
                  </button>
                </td>
                <td>
                  <button className="small-round surface-dim">
                    {exhibition.location_korean}
                    <i>arrow_outward</i>
                  </button>
                </td>
              </tr>
              <tr>
                <td className="min">
                  <button className="chip">
                    <i>wall_art</i>
                    <span>전시실</span>
                  </button>
                </td>
                <td>{exhibition.location_korean}</td>
              </tr>
              <tr>
                <td>
                  <button className="chip">
                    <i>payments</i>
                    <span>관람료</span>
                  </button>
                </td>
                <td>{exhibition.price == 0 ? "무료" : exhibition.price}</td>
              </tr>
              <tr>
                <td>
                  <button className="chip">
                    <i>link</i>
                    <span>링크</span>
                  </button>
                </td>
                <td>
                  {exhibition.link_korean
                    ? (
                      <a
                        href={exhibition.link_korean}
                        target="_blank"
                      >
                        <button className="chip surface-dim">
                          <span>새 탭</span>
                          <i>arrow_outward</i>
                        </button>
                      </a>
                    )
                    : "-"
                  }
                </td>
              </tr>
            </tbody>
          </table>
          
        </section>

        <div className={classes["column-main"]}>
          <section className={classes["section-intro"]}>
            <article>
              <h3>전시 소개</h3>
              <div className="small-padding" />
              {exhibition.about_korean === ""
                ? (
                  <>
                    <button className="chip">
                      <i>help</i>
                      <span>정보를 찾을 수 없습니다.</span>
                      <div className="tooltip max right">
                        <p>오류가 발생하여 정보를 찾을 수 없었습니다. 전시회 링크에서 직접 확인해주세요.</p>
                      </div>
                    </button>
                  </>
                )
                : <Markdown>{exhibition.about_korean}</Markdown>
                // : <p>Debugging...</p>
              }
            </article>
          </section>

          <section className={classes["section-review"]}>
            <Suspense fallback={<progress />}>
              <Await resolve={reviewCount}>{reviewCount => (
                <article>
                  <nav>
                    <h3>리뷰</h3>
                    {reviewCount != 0 && (
                      <h5>{reviewCount}</h5>
                    )}
                  </nav>
                  <div className="small-padding" />
                  <ReviewEdit />
                  <ReviewList reviewCount={reviewCount ?? 0} />
                </article>
              )}</Await>
            </Suspense>
          </section>
        </div>
      </div>
    </>
  )
}

function getDate(d: Date) {
  return d.toISOString().split('T')[0].replace(/-/g, '.')
}
