import { db } from '@/db/indexedDb'
import type { PhotoItem } from '@/types/photo'
import type { ThumbnailRecord } from '@/types/thumbnail'

const DEFAULT_MAX_SIZE = 320
const DEFAULT_MIME_TYPE = 'image/webp'
const DEFAULT_QUALITY = 0.82

function calculateThumbnailSize(width: number, height: number, maxSize: number) {
  if (width <= 0 || height <= 0) {
    throw new Error('Invalid image size')
  }

  if (width <= maxSize && height <= maxSize) {
    return {
      width,
      height,
    }
  }

  const scale = maxSize / Math.max(width, height)

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create thumbnail blob'))
          return
        }

        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = objectUrl

    await image.decode()

    return image
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function drawImageToThumbnail(options: {
  image: ImageBitmap | HTMLImageElement
  width: number
  height: number
  mimeType: string
  quality: number
}): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas is not supported')
  }

  context.drawImage(options.image, 0, 0, options.width, options.height)

  return await canvasToBlob(canvas, options.mimeType, options.quality)
}

export async function generateThumbnailBlob(options: {
  file: File
  maxSize?: number
  mimeType?: string
  quality?: number
}): Promise<{
  blob: Blob
  width: number
  height: number
}> {
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE
  const mimeType = options.mimeType ?? DEFAULT_MIME_TYPE
  const quality = options.quality ?? DEFAULT_QUALITY

  if ('createImageBitmap' in window) {
    let bitmap: ImageBitmap | null = null

    try {
      bitmap = await createImageBitmap(options.file)
      const size = calculateThumbnailSize(bitmap.width, bitmap.height, maxSize)
      const blob = await drawImageToThumbnail({
        image: bitmap,
        width: size.width,
        height: size.height,
        mimeType,
        quality,
      })

      return {
        blob,
        width: size.width,
        height: size.height,
      }
    } catch {
      // Fall back to HTMLImageElement below.
    } finally {
      bitmap?.close()
    }
  }

  const image = await loadImageElement(options.file)
  const size = calculateThumbnailSize(image.naturalWidth, image.naturalHeight, maxSize)
  const blob = await drawImageToThumbnail({
    image,
    width: size.width,
    height: size.height,
    mimeType,
    quality,
  })

  return {
    blob,
    width: size.width,
    height: size.height,
  }
}

export async function getCachedThumbnail(photo: PhotoItem): Promise<ThumbnailRecord | null> {
  const record = await db.thumbnails.get(photo.id)

  if (!record) {
    return null
  }

  if (
    record.fileSize !== photo.size ||
    record.lastModified !== photo.lastModified ||
    record.relativePath !== photo.relativePath
  ) {
    await db.thumbnails.delete(photo.id)
    return null
  }

  return record
}

export async function getOrCreateThumbnail(photo: PhotoItem): Promise<{
  thumbnailUrl: string
  fromCache: boolean
}> {
  const cachedThumbnail = await getCachedThumbnail(photo)

  if (cachedThumbnail) {
    return {
      thumbnailUrl: URL.createObjectURL(cachedThumbnail.blob),
      fromCache: true,
    }
  }

  const file = await photo.fileHandle.getFile()
  const generatedThumbnail = await generateThumbnailBlob({
    file,
  })

  const now = Date.now()
  const record: ThumbnailRecord = {
    id: photo.id,
    photoId: photo.id,
    relativePath: photo.relativePath,
    fileSize: photo.size,
    lastModified: photo.lastModified,
    blob: generatedThumbnail.blob,
    width: generatedThumbnail.width,
    height: generatedThumbnail.height,
    createdAt: now,
    updatedAt: now,
  }

  await db.thumbnails.put(record)

  return {
    thumbnailUrl: URL.createObjectURL(generatedThumbnail.blob),
    fromCache: false,
  }
}

export async function cleanupMissingThumbnails(validPhotoIds: string[]): Promise<void> {
  const validPhotoIdSet = new Set(validPhotoIds)
  const thumbnailIds = await db.thumbnails.toCollection().primaryKeys()
  const missingThumbnailIds = thumbnailIds.filter((id) => {
    return typeof id === 'string' && !validPhotoIdSet.has(id)
  })

  if (missingThumbnailIds.length > 0) {
    await db.thumbnails.bulkDelete(missingThumbnailIds as string[])
  }
}
