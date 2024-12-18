import { Util } from "@alleys/util"

const policy = {
  pageSize: 20,
}

type SearchParamsKey = "find" | "page"
const spNames: Util.KeyAsValue<SearchParamsKey> = {
  find: "find",
  page: "page"
}

export default { policy, spNames }