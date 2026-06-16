import type { PhotoItem } from '@/types/photo'
import { moveFileToDirectory } from '@/services/fileSystemService'
import { buildPhotoFileNameWithOriginalExtension } from '@/utils/fileName'
import { getDirectoryPathFromPath, joinPath } from '@/utils/path'

export async function renamePhoto(options: { photo: PhotoItem; newName: string }): Promise<string> {
  const targetFileName = buildPhotoFileNameWithOriginalExtension({
    inputName: options.newName,
    originalFileName: options.photo.name,
  })

  if (targetFileName === options.photo.name) {
    throw new Error('新文件名和原文件名相同')
  }

  const finalFileName = await moveFileToDirectory({
    sourceFileHandle: options.photo.fileHandle,
    sourceDirectoryHandle: options.photo.parentDirHandle,
    targetDirectoryHandle: options.photo.parentDirHandle,
    targetFileName,
  })

  const directoryPath = getDirectoryPathFromPath(options.photo.relativePath)

  return joinPath(directoryPath, finalFileName)
}
