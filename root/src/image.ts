import { Hono } from "hono"
import { hc } from "hono/client"

const app = new Hono<{ Bindings: Env }>()

type Options = {
	cf: {
		image: {
			format: "avif" | "webp" | "json" | "jpeg" | "png" | undefined
		}
	}
}

const cfR2Route = app.get("/images/cf-r2/:folder/:name", c => {
  const folder = c.req.param("folder")
  const name = c.req.param("name")
  const imageUrl = c.env.IMAGE_BUCKET_URL + "/" + folder + "/" + name
  console.log({ imageUrl })

  let options: Options = {
    cf: {
      image: {
        format: undefined,
      },
    },
  } satisfies RequestInit<RequestInitCfProperties>
  {
    /**
     * automatic format negotiation
     */
    const accept = c.req.header("Accept") ?? ""
    if (accept && /image\/avif/.test(accept)) {
      options.cf.image.format = "avif"
    } else if (accept && /image\/webp/.test(accept)) {
      options.cf.image.format = "webp"
    }
  }

  const imageRequest = new Request(
    imageUrl,
    { headers: c.req.header() },
  )

  return fetch(imageRequest, options)
})

const api = {
  cfR2: {
    route: (url: string) => hc<typeof cfR2Route>(url).images["cf-r2"][":folder"][":name"],
  }
}

export default { app, api }
