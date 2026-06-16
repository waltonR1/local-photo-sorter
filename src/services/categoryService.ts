import type { FolderNames } from '@/types/workspace'
import type { PhotoItem } from '@/types/photo'
import { isSupportedImageFile } from '@/utils/image'
import { isValidCategoryName } from '@/utils/fileName'
import { moveFileToDirectory } from '@/services/fileSystemService'
import { joinPath } from '@/utils/path'

const SYSTEM_FOLDER_NAMES_ZH = ['未分类', '已分类', '已废弃']
const SYSTEM_FOLDER_NAMES_EN = ['Unsorted', 'Sorted', 'Discarded']

export function validateCategoryName(
  categoryName: string,
  existingCategoryNames: string[],
): string | null {
  const trimmedName = categoryName.trim()

  if (!trimmedName) {
    return '分类名不能为空'
  }

  if (!isValidCategoryName(trimmedName)) {
    return '分类名不能包含以下字符：\\ / : * ? " < > |'
  }

  const lowerName = trimmedName.toLowerCase()

  const exists = existingCategoryNames.some((name) => name.toLowerCase() === lowerName)

  if (exists) {
    return '分类名已存在'
  }

  const isSystemName = [...SYSTEM_FOLDER_NAMES_ZH, ...SYSTEM_FOLDER_NAMES_EN].some(
    (name) => name.toLowerCase() === lowerName,
  )

  if (isSystemName) {
    return '分类名不能和系统目录重名'
  }

  return null
}

export async function createCategoryFolder(options: {
  rootHandle: FileSystemDirectoryHandle
  folderNames: FolderNames
  categoryName: string
  existingCategoryNames: string[]
}): Promise<void> {
  const trimmedName = options.categoryName.trim()

  const errorMessage = validateCategoryName(trimmedName, options.existingCategoryNames)

  if (errorMessage) {
    throw new Error(errorMessage)
  }

  const sortedHandle = await options.rootHandle.getDirectoryHandle(options.folderNames.sorted)

  await sortedHandle.getDirectoryHandle(trimmedName, {
    create: true,
  })
}

export async function movePhotoToCategory(options: {
  rootHandle: FileSystemDirectoryHandle
  folderNames: FolderNames
  photo: PhotoItem
  categoryName: string
}): Promise<string> {
  if (options.photo.parentType === 'discarded') {
    throw new Error('已废弃图片不能直接移动到分类，请先恢复')
  }

  if (
    options.photo.parentType === 'category' &&
    options.photo.categoryName === options.categoryName
  ) {
    throw new Error('该图片已经在当前分类中')
  }

  const sortedHandle = await options.rootHandle.getDirectoryHandle(options.folderNames.sorted)

  const categoryHandle = await sortedHandle.getDirectoryHandle(options.categoryName, {
    create: true,
  })

  const finalFileName = await moveFileToDirectory({
    sourceFileHandle: options.photo.fileHandle,
    sourceDirectoryHandle: options.photo.parentDirHandle,
    targetDirectoryHandle: categoryHandle,
  })

  return joinPath(options.folderNames.sorted, options.categoryName, finalFileName)
}

export async function deleteCategoryFolder(options: {
  rootHandle: FileSystemDirectoryHandle
  folderNames: FolderNames
  categoryName: string
}): Promise<{
  movedCount: number
}> {
  const sortedHandle = await options.rootHandle.getDirectoryHandle(options.folderNames.sorted)

  const unsortedHandle = await options.rootHandle.getDirectoryHandle(options.folderNames.unsorted)

  const categoryHandle = await sortedHandle.getDirectoryHandle(options.categoryName)

  const fileHandles: FileSystemFileHandle[] = []

  for await (const handle of categoryHandle.values()) {
    if (handle.kind === 'directory') {
      throw new Error('该分类文件夹中包含子文件夹，第一版暂不支持自动删除。请先手动处理子文件夹。')
    }

    const fileHandle = handle as FileSystemFileHandle

    if (!isSupportedImageFile(fileHandle.name)) {
      throw new Error(
        `该分类文件夹中包含非支持图片文件：${fileHandle.name}。请先手动处理后再删除分类。`,
      )
    }

    fileHandles.push(fileHandle)
  }

  for (const fileHandle of fileHandles) {
    await moveFileToDirectory({
      sourceFileHandle: fileHandle,
      sourceDirectoryHandle: categoryHandle,
      targetDirectoryHandle: unsortedHandle,
    })
  }

  await sortedHandle.removeEntry(options.categoryName)

  return {
    movedCount: fileHandles.length,
  }
}
