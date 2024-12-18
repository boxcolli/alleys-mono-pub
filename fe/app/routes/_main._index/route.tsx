import "swiper/css"
import classes from "./styles.module.css"

import { Await, Link, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import { Suspense, useRef } from "react"
import { HeadersFunction } from "@remix-run/cloudflare"
import { $PATH, $POLICY } from "~/config"
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
import format from "@stdlib/string-format"
import config from "./config"

export { loader }
export let headers: HeadersFunction = () => ({
  "Cache-Control": `max-age=${config.policy.maxAge}`
})

export default function Page() {
  const { exhibitions } = useLoaderData<typeof loader>()

  const swiperRef = useRef<null | SwiperClass>(null)
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  return (
    <div className="padding">
      <section id="land-0" className={`${classes["land-section"]} ${classes["land-0"]}`}>
        <article className="no-padding round">
          <img className={`responsive`} src="/images/white-egg.jpg" alt="banner image" />
          <div className="absolute middle left-align large-padding">
            <div className="max" />
            <h2 className="">전시회 플랫폼 <span className="logo">ALLEYS</span></h2>
            <h1 className="">내 인생 전시회를 소중한 추억으로 남겨보세요.</h1>
          </div>
        </article>
      </section>
      
      <section className={classes["land-section"]}>
        <article className="round">
          <nav className="wrap small-padding">
            <h3 className={classes["land-title"]}>새로운 전시회를 찾아보세요.</h3>
            <div className="max" />
            <div className="no-space">
              <button className="surface-container-highest left-round" ref={prevRef}>
                <i>chevron_backward</i>
              </button>
              <button className="surface-container-highest right-round" ref={nextRef}>
                <i>chevron_forward</i>
              </button>
            </div>
            
            <Link to={$PATH.main.exhibitions} className="m l">
              <button>
                더보기
              </button>
            </Link>
          </nav>
        
          <Suspense fallback={<progress />}>
            <Await resolve={exhibitions}>
              {exhibitions => exhibitions ? (
                <Swiper
                  spaceBetween={0}
                  slidesPerView={3}
                  direction="horizontal"
                  onSwiper={swiper => {
                    swiperRef.current = swiper
                    swiper.navigation.init()
                    swiper.navigation.update()
                  }}
                  modules={[Navigation]}
                  navigation={{
                    prevEl: prevRef.current,
                    nextEl: nextRef.current,
                  }}
                >
                  {exhibitions.map((e, i) => (
                    <SwiperSlide key={`exhibition-${i}`} className={classes["land-1-item"]}>
                      <Link to={$PATH.main.exhibitions$exhibitionId(e.id)}>
                        <article className="transparent">
                          <img className="responsive" src={e.image_link ?? ""} />
                        </article>
                      </Link>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : <p>Empty</p>}
            </Await>
          </Suspense>

          
        </article>
      </section>
      
      <section className={classes["land-section"]}>
        <article className="round">
          <header>
            <h3 className="small-padding">나의 감상을 남겨보세요.</h3>
          </header>
          <p>한줄평 | 긴 글</p>
        </article>
      </section>

      <section className={classes["land-section"]}>
        <article className="round">
          <header>
            <h3 className="small-padding">나만의 전시회 목록을 만들어보세요.</h3>
          </header>
          <p>직접 간 전시회, 최고의 전시회...</p>
        </article>
      </section>
    </div>
  )
}
