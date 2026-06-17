import { buildDuplicateFileName } from '@/utils/fileName'
import { getDirectoryPathFromPath, getFileNameFromPath, splitPath } from '@/utils/path'

export async function fileExists(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string,
): Promise<boolean> {
  try {
    await directoryHandle.getFileHandle(fileName)
    return true
  } catch {
    return false
  }
}

export async function resolveDuplicateFileName(
  directoryHandle: FileSystemDirectoryHandle,
  originalFileName: string,
): Promise<string> {
  if (!(await fileExists(directoryHandle, originalFileName))) {
    return originalFileName
  }

  let index = 1

  while (true) {
    const nextFileName = buildDuplicateFileName(originalFileName, index)

    if (!(await fileExists(directoryHandle, nextFileName))) {
      return nextFileName
    }

    index += 1
  }
}

export async function copyFileToDirectory(options: {
  sourceFileHandle: FileSystemFileHandle
  targetDirectoryHandle: FileSystemDirectoryHandle
  targetFileName?: string
}): Promise<string> {
  const sourceFile = await options.sourceFileHandle.getFile()
  const finalFileName = await resolveDuplicateFileName(
    options.targetDirectoryHandle,
    options.targetFileName ?? sourceFile.name,
  )

  const targetFileHandle = await options.targetDirectoryHandle.getFileHandle(finalFileName, {
    create: true,
  })

  const writable = await targetFileHandle.createWritable()
  await writable.write(sourceFile)
  await writable.close()

  return finalFileName
}

export async function moveFileToDirectory(options: {
  sourceFileHandle: FileSystemFileHandle
  sourceDirectoryHandle: FileSystemDirectoryHandle
  targetDirectoryHandle: FileSystemDirectoryHandle
  targetFileName?: string
}): Promise<string> {
  const finalFileName = await copyFileToDirectory({
    sourceFileHandle: options.sourceFileHandle,
    targetDirectoryHandle: options.targetDirectoryHandle,
    targetFileName: options.targetFileName,
  })

  await options.sourceDirectoryHandle.removeEntry(options.sourceFileHandle.name)

  return finalFileName
}

export async function isDirectoryEmpty(
  directoryHandle: FileSystemDirectoryHandle,
): Promise<boolean> {
  for await (const _handle of directoryHandle.values()) {
    return false
  }

  return true
}

export async function getOrCreateDirectoryByPath(
  rootHandle: FileSystemDirectoryHandle,
  directoryPath: string,
): Promise<FileSystemDirectoryHandle> {
  const parts = splitPath(directoryPath)

  let currentHandle = rootHandle

  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part, {
      create: true,
    })
  }

  return currentHandle
}

export async function getDirectoryByPath(
  rootHandle: FileSystemDirectoryHandle,
  directoryPath: string,
): Promise<FileSystemDirectoryHandle> {
  const parts = splitPath(directoryPath)

  let currentHandle = rootHandle

  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part)
  }

  return currentHandle
}

export async function removeEmptyDirectoriesUpTo(options: {
  rootHandle: FileSystemDirectoryHandle
  directoryPath: string
  stopAtPath: string
}): Promise<void> {
  const directoryParts = splitPath(options.directoryPath)
  const stopParts = splitPath(options.stopAtPath)

  for (let length = directoryParts.length; length > stopParts.length; length -= 1) {
    const currentPath = directoryParts.slice(0, length).join('/')
    const parentPath = directoryParts.slice(0, length - 1).join('/')
    const directoryName = directoryParts[length - 1]

    if (!directoryName) {
      return
    }

    const currentHandle = await getDirectoryByPath(options.rootHandle, currentPath)

    if (!(await isDirectoryEmpty(currentHandle))) {
      return
    }

    const parentHandle = parentPath
      ? await getDirectoryByPath(options.rootHandle, parentPath)
      : options.rootHandle

    await parentHandle.removeEntry(directoryName)
  }
}

export async function getFileHandleByPath(
  rootHandle: FileSystemDirectoryHandle,
  filePath: string,
): Promise<{
  fileHandle: FileSystemFileHandle
  parentDirectoryHandle: FileSystemDirectoryHandle
}> {
  const directoryPath = getDirectoryPathFromPath(filePath)
  const fileName = getFileNameFromPath(filePath)

  const parentDirectoryHandle = await getDirectoryByPath(rootHandle, directoryPath)

  const fileHandle = await parentDirectoryHandle.getFileHandle(fileName)

  return {
    fileHandle,
    parentDirectoryHandle,
  }
}

export async function moveFileByRelativePath(options: {
  rootHandle: FileSystemDirectoryHandle
  fromPath: string
  toPath: string
}): Promise<string> {
  const { fileHandle, parentDirectoryHandle } = await getFileHandleByPath(
    options.rootHandle,
    options.fromPath,
  )

  const targetDirectoryPath = getDirectoryPathFromPath(options.toPath)
  const targetFileName = getFileNameFromPath(options.toPath)

  const targetDirectoryHandle = await getOrCreateDirectoryByPath(
    options.rootHandle,
    targetDirectoryPath,
  )

  const finalFileName = await moveFileToDirectory({
    sourceFileHandle: fileHandle,
    sourceDirectoryHandle: parentDirectoryHandle,
    targetDirectoryHandle,
    targetFileName,
  })

  return targetDirectoryPath ? `${targetDirectoryPath}/${finalFileName}` : finalFileName
}
