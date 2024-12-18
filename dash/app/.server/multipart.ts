import {
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/cloudflare"
import image from "@alleys/lib/image"

type AllowedMultipartType = string | File | null | undefined

type ParseMultipartFormDataArgs<T extends AllowedMultipartType> = {
  request: Request
  fileInputName: string
  fileNameWithoutExt: string
  handleFile: (blob: Blob, contentType: string) => Promise<T>
}

/**
 * 
 * @param fileInputName Name property value of the file input component
 * @returns 
 */
export async function parseMultipartFormData<T extends AllowedMultipartType>({ request, fileInputName, fileNameWithoutExt, handleFile }: ParseMultipartFormDataArgs<T>) {
  const handler = unstable_composeUploadHandlers(
    async ({ name, contentType, data, filename }) => {
        if (name !== fileInputName) {
            return
        }

        const chunks: Uint8Array[] = []
        for await (const chunk of data) {
            chunks.push(chunk)
        }
        const blob = new Blob(chunks, { type: contentType })
        const result = await handleFile(blob, contentType)
        return result
    },
    unstable_createMemoryUploadHandler(),
  )
  return unstable_parseMultipartFormData(request, handler)
  // try {
  //     var formData = await unstable_parseMultipartFormData(request, uploadHandler)
  //     if (entry === undefined) {
  //         throw "image entry is undefined"
  //     }
  // } catch (e) {
  //     logger.error(e, "parseMultipartFormData")
  //     return validationError({ fieldErrors: { message: "parseMultipartFormData" } })
  // }
}

async function dataToFile(data: AsyncIterable<Uint8Array>, filename: string, mimeType: string) {
  const chunks: Uint8Array[] = []

  for await (const chunk of data) {
      chunks.push(chunk)
  }

  const blob = new Blob(chunks, { type: mimeType })
  const file = new File([blob], filename, { type: mimeType })
  return file
}
