export const $PATH = {
  home: "/",
  main: {
    exhibitions: "/exhibitions",
    exhibitions$exhibitionId: (exhibitionId: string) => `/exhibitions/${exhibitionId}`,
    locations: "/locations",
    locations$locationId: (locationId: string) => `/locations/${locationId}`,
    images: "/images",
    images$imageId: (imageId: string) => `/images/${imageId}`,
    users: "/users",
  },
  api: {
    exhibitions$exhibitionIdImages: (exhibitionId: string) => `/api/exhibitions/${exhibitionId}/images`,
  },
  auth: "/auth",
}
