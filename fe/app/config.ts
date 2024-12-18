import { z } from "zod"

export const $PATH = {
  home: "/",
  main: {
    exhibitions: "/exhibitions",
    exhibitions$exhibitionId: (eid: string) => `/exhibitions/${eid}`,
  },
  auth: {
    auth:         "/auth",
    login:        "/auth",
    signup:       "/auth/signup",
    signupVerify: "/auth/signup-verify",
    signupData:   "/auth/signup-data",
    reset:        "/auth/reset",
    resetVerify:  "/auth/reset-verify",
  },
  api: {
    exhibitions: {
      index: "/api/exhibitions",
      $eid_reviews: (eid: string) => `/api/exhibitions/${eid}/reviews`,
      $eid_reviews$rid: (eid: string, rid: string) => `/api/exhibitions/${eid}/reviews/${rid}`,
    },
    auth: {
      logout:           "/api/auth/logout",
      signup: {
        resendEmail:    "/api/signup/resend-email"
      },
    },
    folders: {
      index:            "/api/folders",
      $fid: (fid: string) => `/api/folders/${fid}`,
      $fid_exhibitions: (fid: string) => `/api/folders/${fid}/exhibitions`,
      $fid_exhibitions$eid: (fid: string, eid: string) => `/api/folders/${fid}/exhibitions/${eid}`,
    },
  },
}

export const $POLICY = {
  main: {
    index: {
      updateUserLastLoginAtThresholdHours: 24,
    },
    home: {
      exhibitionMaxDays: 10,
      // maxAge: 3600,
    },
    exhibition: {
      defaultSize: 12,
      pageDisplayWidth: 5, // odd number
    },
    exhibitionDetail: {
      artistStringMaxLength: 24,
    },
  },
  api: {
    exhibition: {
      defaultSize: 10,
      maxSize: 20,
      maxAge: 3600,
    },
    exhibitionSearch: {
      defaultSize: 10,
      maxSize: 20,
      maxAge: 3600,
    },
  },
  auth: {
    signup: {
      emailVerifyCodeCharSet: "0123456789",
      emailVerifyCodeLength: 8,
      emailVerifyCodeExpireSeconds: 600,  // 10m
      passwordMinLength: 8,
      passwordMaxLength: 64,
      uniqueNameMinLength: 2,
      uniqueNameMaxLength: 12,
      uniqueNameRegexWithoutLength: /^[A-Za-z0-9가-힣\-_]+$/,
    },
    reset: {
      emailVerifyCodeCharSet: "0123456789",
      emailVerifyCodeLength: 8,
      emailVerifyCodeExpireSeconds: 600,  // 10m
    },
    login: {
      sessionExpiresInDays: 60,
    }
  },
}

export const $REGEX = {
  digit:        /^\d+$/,
  alpha:        /^[\p{Script=Latin}]+$/u,
  alphanumeric: /^[\p{Script=Latin}\p{Number}]+$/u,
}

export const $STORAGE = {
  exhibition: {
    preset: {
      key: "exhibition-preset",
      schema: z.string(),
    },
    option: {
      key: "exhibition-option",
      schema: z.record(z.string()),
    },
    page: {
      key: "exhibition-page",
      schema: z.number(),
    },
    count: {
      key: "exhibition-count",
      schema: z.number(),
    }
  },
  exhibitionDetail: {
    reviewEdit: {
      title: { key: "review-edit-title" },
      content: { key: "review-edit-content" },
      isPublic: { key: "review-edit-is-public" },
    },
  },
  signupVerify: {
    key: "signup-verify",
    schema: (
      z.object({
        email: z.string(),
        sendTime: z.coerce.date(),
      })
    ),
  },
}

export type AlertType = "success" | "info" | "warning" | "error" | "promote"

export const $URL = {
  api: "https://api.alleys.app"
}
