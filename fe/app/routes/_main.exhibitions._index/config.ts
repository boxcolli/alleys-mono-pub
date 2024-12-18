import { string, z } from "zod"
import api from "../api.exhibitions/config"
import { Util } from "@alleys/util"


export type Req = z.infer<typeof api.req.schema>
const policy = {
  defaultSize: 12,
  pageDisplayWidth: 5, // odd number
}
const key = {
  dataFetcher: "fetcher-data",
  countFetcher: "fetcher-count",
}

/**
 * Preset
 */
export type Preset = "past" | "current" | "future"
const presetNames: Util.KeyAsValue<Preset> = {
  past: "past",
  current: "current",
  future: "future"
}
function getPastConstants() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return {
    size: policy.defaultSize,
    end_max: yesterday,
    sort_by: "end_date",
    sort_to: "desc",
  } satisfies Req
}
function getCurrentConstants() {
  const today = new Date()
  return {
    size: policy.defaultSize,
    start_max: today,
    end_min: today,
    sort_by: "start_date",
    sort_to: "asc",
  } satisfies Req
}
function getFutureConstants() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    size: policy.defaultSize,
    start_min: tomorrow,
    sort_by: "start_date",
    sort_to: "asc",
  } satisfies Req
}
function getConstants(preset: Preset) {
  switch (preset) {
    case "past": return getPastConstants()
    case "future": return getFutureConstants()
    case "current":
    default:
      return getCurrentConstants()
  }
}

/**
 * Util function 
 */
function loadSearchParams(sp: URLSearchParams, req: Req) {
  Object.entries(req).forEach(([k, v]) => {
    if (typeof v === "number" || typeof v === "boolean") {
      sp.set(k, String(v))
    } else if (v instanceof Date) {
      sp.set(k, v.toISOString())
    } else if (Array.isArray(v)) {
      sp.set(k, v.toString())
    } else {
      sp.set(k, v)
    }
  })
}

/**
 * Option
 */
type OptionKeys = Util.KPick<Req, "location_ids" | "price_min" | "price_max">
export type Option = Pick<Req, OptionKeys>
const optionNames: Util.KeyAsValue<OptionKeys> = {
  location_ids: "location_ids",
  price_min: "price_min",
  price_max: "price_max"
}
const optionSchema = z.object({
  location_ids: z.array(z.string()).optional(),
  price_min:    z.coerce.number().optional(),
  price_max:    z.coerce.number().optional(),
}) satisfies Util.KeyAsZod<OptionKeys>

export default {
  policy, key, api, getConstants, loadSearchParams,
  preset: {
    name: "preset",
    names: presetNames,
  },
  option: {
    names: optionNames,
    schema: optionSchema,
  },
  page: {
    name: "page",
  },
}
