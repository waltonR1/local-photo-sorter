import type { FolderNames } from '@/types/workspace'
import type { PhotoItem } from '@/types/photo'
import {
  getDirectoryPathFromPath,
  getFileNameFromPath,
  joinPath,
  removeFirstPathSegment,
} from '@/utils/path'
import {
  getOrCreateDirectoryByPath,
  moveFileToDirectory,
  removeEmptyDirectoriesUpTo,
} from '@/services/fileSystemService'

export async function movePhotoToDiscarded(options: {
  rootHandle: FileSystemDirectoryHandle
  folderNames: FolderNames
  photo: PhotoItem
}): Promise<string> {
  if (options.photo.parentType === 'discarded') {
    throw new Error('该图片已经在已废弃中')
  }

  const originalRelativePath = options.photo.relativePath
  const originalDirectoryPath = getDirectoryPathFromPath(originalRelativePath)

  const targetDirectoryPath = joinPath(options.folderNames.discarded, originalDirectoryPath)

  const targetDirectoryHandle = await getOrCreateDirectoryByPath(
    options.rootHandle,
    targetDirectoryPath,
  )

  const finalFileName = await moveFileToDirectory({
    sourceFileHandle: options.photo.fileHandle,
    sourceDirectoryHandle: options.photo.parentDirHandle,
    targetDirectoryHandle,
  })

  return joinPath(targetDirectoryPath, finalFileName)
}

export async function restorePhotoFromDiscarded(options: {
  rootHandle: FileSystemDirectoryHandle
  folderNames: FolderNames
  photo: PhotoItem
}): Promise<string> {
  if (options.photo.parentType !== 'discarded') {
    throw new Error('只有已废弃图片可以恢复')
  }

  const pathAfterDiscarded = removeFirstPathSegment(options.photo.relativePath)

  if (!pathAfterDiscarded) {
    throw new Error('无法识别原始路径')
  }

  const restoreDirectoryPath = getDirectoryPathFromPath(pathAfterDiscarded)
  const originalFileName = getFileNameFromPath(pathAfterDiscarded)

  const targetDirectoryHandle = await getOrCreateDirectoryByPath(
    options.rootHandle,
    restoreDirectoryPath,
  )

  const finalFileName = await moveFileToDirectory({
    sourceFileHandle: options.photo.fileHandle,
    sourceDirectoryHandle: options.photo.parentDirHandle,
    targetDirectoryHandle,
    targetFileName: originalFileName,
  })

  await removeEmptyDirectoriesUpTo({
    rootHandle: options.rootHandle,
    directoryPath: getDirectoryPathFromPath(options.photo.relativePath),
    stopAtPath: options.folderNames.discarded,
  })

  return joinPath(restoreDirectoryPath, finalFileName)
}
