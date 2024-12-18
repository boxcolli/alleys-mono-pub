import { AlertType } from "~/config"

type AlertKey =
  "error" |
  "login-success" |
  "signup-success" |
  "logout-success" |
  "folder-create-success" |
  "folder-update-success" |
  "folder-delete-success" |
  "review-error" |
  "review-create-success" |
  "review-create-error" |
  "review-update-success" |
  "review-update-error" |
  "review-delete-success"

type AlertValue<K> = {
  name: K
  type: AlertType
  msg: string
}
type AlertObject = { [K in AlertKey]: AlertValue<K> }

export const alerts: AlertObject = {
  "error": {
    name: "error",
    type: "error",
    msg: "오류가 발생했습니다.",
  },
  "login-success": {
    name: "login-success",
    type: "success",
    msg: "로그인했습니다."
  },
  "signup-success": {
    name: "signup-success",
    type: "success",
    msg: "회원가입했습니다.",
  },
  "logout-success": {
    name: "logout-success",
    type: "success",
    msg: "로그아웃했습니다.",
  },
  "folder-create-success": {
    name: "folder-create-success",
    type: "success",
    msg: "폴더를 만들었습니다."
  },
  "folder-update-success": {
    name: "folder-update-success",
    type: "success",
    msg: "폴더를 수정했습니다."
  },
  "folder-delete-success": {
    name: "folder-delete-success",
    type: "success",
    msg: "폴더를 삭제했습니다."
  },
  "review-error": {
    name: "review-error",
    type: "error",
    msg: "오류가 발생했습니다.",
  },
  "review-create-success": {
    name: "review-create-success",
    type: "success",
    msg: "리뷰를 작성했습니다."
  },
  "review-create-error": {
    name: "review-create-error",
    type: "error",
    msg: "오류가 발생했습니다. 잠시후 다시 시도해주세요.",
  },
  "review-update-success": {
    name: "review-update-success",
    type: "success",
    msg: "리뷰를 수정했습니다.",
  },
  "review-update-error": {
    name: "review-update-error",
    type: "error",
    msg: "오류가 발생했습니다. 잠시후 다시 시도해주세요.",
  },
  "review-delete-success": {
    name: "review-delete-success",
    type: "success",
    msg: "리뷰를 삭제했습니다.",
  },
}
