import type { PhotoItem } from '@/types/photo'
import type { FolderNames } from '@/types/workspace'
import { moveFileToDirectory } from '@/services/fileSystemService'
import { isValidCategoryName } from '@/utils/fileName'
import { isSupportedImageFile } from '@/utils/image'
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

async function getCategoryImageFileHandles(
  categoryHandle: FileSystemDirectoryHandle,
): Promise<FileSystemFileHandle[]> {
  const fileHandles: FileSystemFileHandle[] = []

  for await (const handle of categoryHandle.values()) {
    if (handle.kind === 'directory') {
      throw new Error('该分类文件夹中包含子文件夹，请先手动处理子文件夹后再继续。')
    }

    const fileHandle = handle as FileSystemFileHandle

    if (!isSupportedImageFile(fileHandle.name)) {
      throw new Error(
        `该分类文件夹中包含非支持图片文件：${fileHandle.name}。请先手动处理后再继续。`,
      )
    }

    fileHandles.push(fileHandle)
  }

  return fileHandles
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

export async function renameCategoryFolder(options: {
  rootHandle: FileSystemDirectoryHandle
  folderNames: FolderNames
  categoryName: string
  nextCategoryName: string
  existingCategoryNames: string[]
}): Promise<{
  movedCount: number
}> {
  const trimmedCurrentName = options.categoryName.trim()
  const trimmedNextName = options.nextCategoryName.trim()

  if (trimmedCurrentName.toLowerCase() === trimmedNextName.toLowerCase()) {
    throw new Error('新分类名不能和当前分类名相同')
  }

  const existingNames = options.existingCategoryNames.filter((name) => {
    return name.toLowerCase() !== trimmedCurrentName.toLowerCase()
  })
  const errorMessage = validateCategoryName(trimmedNextName, existingNames)

  if (errorMessage) {
    throw new Error(errorMessage)
  }

  const sortedHandle = await options.rootHandle.getDirectoryHandle(options.folderNames.sorted)
  const currentCategoryHandle = await sortedHandle.getDirectoryHandle(trimmedCurrentName)
  const fileHandles = await getCategoryImageFileHandles(currentCategoryHandle)
  const nextCategoryHandle = await sortedHandle.getDirectoryHandle(trimmedNextName, {
    create: true,
  })

  for (const fileHandle of fileHandles) {
    await moveFileToDirectory({
      sourceFileHandle: fileHandle,
      sourceDirectoryHandle: currentCategoryHandle,
      targetDirectoryHandle: nextCategoryHandle,
    })
  }

  await sortedHandle.removeEntry(trimmedCurrentName)

  return {
    movedCount: fileHandles.length,
  }
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

export async function movePhotoToUnsorted(options: {
  rootHandle: FileSystemDirectoryHandle
  folderNames: FolderNames
  photo: PhotoItem
}): Promise<string> {
  if (options.photo.parentType !== 'category') {
    throw new Error('只有已分类图片可以移回未分类')
  }

  const unsortedHandle = await options.rootHandle.getDirectoryHandle(options.folderNames.unsorted)

  const finalFileName = await moveFileToDirectory({
    sourceFileHandle: options.photo.fileHandle,
    sourceDirectoryHandle: options.photo.parentDirHandle,
    targetDirectoryHandle: unsortedHandle,
  })

  return joinPath(options.folderNames.unsorted, finalFileName)
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
  const fileHandles = await getCategoryImageFileHandles(categoryHandle)

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
