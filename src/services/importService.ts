import type { FolderNames } from '@/types/workspace'
import { copyFileToDirectory } from '@/services/fileSystemService'
import { isSupportedImageFile } from '@/utils/image'

export async function selectImportImageFiles(): Promise<FileSystemFileHandle[]> {
  if (!window.showOpenFilePicker) {
    throw new Error('当前浏览器不支持文件选择功能，请使用 Chrome 或 Edge。')
  }

  const fileHandles = await window.showOpenFilePicker({
    multiple: true,
    excludeAcceptAllOption: false,
    types: [
      {
        description: 'Images',
        accept: {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
        },
      },
    ],
  })

  return fileHandles.filter((fileHandle) => isSupportedImageFile(fileHandle.name))
}

export async function importFilesToUnsorted(options: {
  rootHandle: FileSystemDirectoryHandle
  folderNames: FolderNames
  fileHandles: FileSystemFileHandle[]
}): Promise<{
  importedCount: number
}> {
  const unsortedHandle = await options.rootHandle.getDirectoryHandle(options.folderNames.unsorted)

  let importedCount = 0

  for (const fileHandle of options.fileHandles) {
    if (!isSupportedImageFile(fileHandle.name)) {
      continue
    }

    await copyFileToDirectory({
      sourceFileHandle: fileHandle,
      targetDirectoryHandle: unsortedHandle,
    })

    importedCount += 1
  }

  return {
    importedCount,
  }
}
