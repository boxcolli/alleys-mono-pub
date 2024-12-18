import { getKysely } from "~/.server/kysely"
import config from "./config"
import { ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import invariant from "tiny-invariant"
import names from "@alleys/lib/names"
import { z } from "zod"

export async function action({ params, request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env
  invariant(params.imageId)
  const imageId = params.imageId
  
  // Parse formData
  const formData = await request.formData()
  const parsed = config.req.schema.safeParse(Object.fromEntries(formData.entries()))
  if (parsed.error) {
    console.info(parsed.error.message)
    return new Response("invalid formData", { status: 400 })
  }

  const action = parsed.data.action
  console.debug("received action:", action)

  switch (action) {
    case "edit":
      return handleEdit(env, imageId, parsed.data, request.url)

    default: {
      return new Response("wrong action", { status: 400 })
    }
  }
}

async function handleEdit(
  env: Env,
  imageId: string,
  d: z.infer<typeof config.edit.schema>,
  myUrl: string,
) {
  const kysely = getKysely(env)
  try {
    const result = await kysely
      .updateTable("image")
      .set("source", d.source)
      .set("source_link", d.source_link)
      .set("description", d.description)
      .set("updated_at", new Date())
      .where("id", "=", imageId)
      .returning("id")
      .executeTakeFirst()

    if (!result) {
      return new Response("db update failed", { status: 500 })
    }
  } catch (e) {
    console.error(e, "db update location error")
    return new Response("db update location error", { status: 500 })
  }

  console.info("db update location success")
  return redirect(myUrl)
}
