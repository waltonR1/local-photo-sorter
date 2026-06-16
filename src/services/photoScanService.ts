import type { FolderNames } from '@/types/workspace'
import type { PhotoItem } from '@/types/photo'
import { getFileExtension, isSupportedImageFile } from '@/utils/image'
import { joinPath } from '@/utils/path'

export interface PhotoScanResult {
  photos: PhotoItem[]
  categoryNames: string[]
}

export async function scanWorkspacePhotos(
  rootHandle: FileSystemDirectoryHandle,
  folderNames: FolderNames,
): Promise<PhotoScanResult> {
  const photos: PhotoItem[] = []
  const categoryNames: string[] = []

  const unsortedHandle = await rootHandle.getDirectoryHandle(folderNames.unsorted)
  const sortedHandle = await rootHandle.getDirectoryHandle(folderNames.sorted)
  const discardedHandle = await rootHandle.getDirectoryHandle(folderNames.discarded)

  const unsortedPhotos = await scanFlatImageDirectory({
    directoryHandle: unsortedHandle,
    baseRelativePath: folderNames.unsorted,
    parentType: 'unsorted',
  })

  photos.push(...unsortedPhotos)

  for await (const handle of sortedHandle.values()) {
    if (handle.kind !== 'directory') {
      continue
    }

    const categoryHandle = handle as FileSystemDirectoryHandle
    const categoryName = categoryHandle.name

    categoryNames.push(categoryName)

    const categoryPhotos = await scanFlatImageDirectory({
      directoryHandle: categoryHandle,
      baseRelativePath: joinPath(folderNames.sorted, categoryName),
      parentType: 'category',
      categoryName,
    })

    photos.push(...categoryPhotos)
  }

  const discardedPhotos = await scanRecursiveImageDirectory({
    directoryHandle: discardedHandle,
    baseRelativePath: folderNames.discarded,
  })

  photos.push(...discardedPhotos)

  return {
    photos,
    categoryNames,
  }
}

async function scanFlatImageDirectory(options: {
  directoryHandle: FileSystemDirectoryHandle
  baseRelativePath: string
  parentType: 'unsorted' | 'category'
  categoryName?: string
}): Promise<PhotoItem[]> {
  const photos: PhotoItem[] = []

  for await (const handle of options.directoryHandle.values()) {
    if (handle.kind !== 'file') {
      continue
    }

    const fileHandle = handle as FileSystemFileHandle

    if (!isSupportedImageFile(fileHandle.name)) {
      continue
    }

    const photo = await buildPhotoItem({
      fileHandle,
      parentDirHandle: options.directoryHandle,
      relativePath: joinPath(options.baseRelativePath, fileHandle.name),
      parentType: options.parentType,
      categoryName: options.categoryName,
    })

    photos.push(photo)
  }

  return photos
}

async function scanRecursiveImageDirectory(options: {
  directoryHandle: FileSystemDirectoryHandle
  baseRelativePath: string
}): Promise<PhotoItem[]> {
  const photos: PhotoItem[] = []

  for await (const handle of options.directoryHandle.values()) {
    if (handle.kind === 'file') {
      const fileHandle = handle as FileSystemFileHandle

      if (!isSupportedImageFile(fileHandle.name)) {
        continue
      }

      const photo = await buildPhotoItem({
        fileHandle,
        parentDirHandle: options.directoryHandle,
        relativePath: joinPath(options.baseRelativePath, fileHandle.name),
        parentType: 'discarded',
      })

      photos.push(photo)
      continue
    }

    if (handle.kind === 'directory') {
      const directoryHandle = handle as FileSystemDirectoryHandle

      const childPhotos = await scanRecursiveImageDirectory({
        directoryHandle,
        baseRelativePath: joinPath(options.baseRelativePath, directoryHandle.name),
      })

      photos.push(...childPhotos)
    }
  }

  return photos
}

async function buildPhotoItem(options: {
  fileHandle: FileSystemFileHandle
  parentDirHandle: FileSystemDirectoryHandle
  relativePath: string
  parentType: 'unsorted' | 'category' | 'discarded'
  categoryName?: string
}): Promise<PhotoItem> {
  const file = await options.fileHandle.getFile()
  const objectUrl = URL.createObjectURL(file)

  return {
    id: options.relativePath,
    name: options.fileHandle.name,
    extension: getFileExtension(options.fileHandle.name),
    relativePath: options.relativePath,
    parentType: options.parentType,
    categoryName: options.categoryName,
    size: file.size,
    lastModified: file.lastModified,
    objectUrl,
    fileHandle: options.fileHandle,
    parentDirHandle: options.parentDirHandle,
  }
}
