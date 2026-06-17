import { getFolderNames } from '@/utils/folderNames'
import type { FolderNames, WorkspaceLanguage } from '@/types/workspace'

export interface WorkspaceCheckResult {
  exists: boolean
  missingFolders: string[]
  folderNames: FolderNames
}

export async function selectWorkspaceDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!window.showDirectoryPicker) {
    throw new Error('当前浏览器不支持 File System Access API，请使用 Chrome 或 Edge。')
  }

  return await window.showDirectoryPicker({
    mode: 'readwrite',
  })
}

export async function checkWorkspaceStructure(
  rootHandle: FileSystemDirectoryHandle,
  language: WorkspaceLanguage,
): Promise<WorkspaceCheckResult> {
  const folderNames = getFolderNames(language)

  const requiredFolders = [folderNames.unsorted, folderNames.sorted, folderNames.discarded]

  const missingFolders: string[] = []

  for (const folderName of requiredFolders) {
    try {
      await rootHandle.getDirectoryHandle(folderName)
    } catch {
      missingFolders.push(folderName)
    }
  }

  return {
    exists: missingFolders.length === 0,
    missingFolders,
    folderNames,
  }
}

export async function createWorkspaceFolders(
  rootHandle: FileSystemDirectoryHandle,
  language: WorkspaceLanguage,
): Promise<void> {
  const folderNames = getFolderNames(language)

  await rootHandle.getDirectoryHandle(folderNames.unsorted, { create: true })
  await rootHandle.getDirectoryHandle(folderNames.sorted, { create: true })
  await rootHandle.getDirectoryHandle(folderNames.discarded, { create: true })
}

export async function ensureWorkspacePermission(
  rootHandle: FileSystemDirectoryHandle,
): Promise<boolean> {
  if (!rootHandle.queryPermission) {
    return true
  }

  const queryResult = await rootHandle.queryPermission({
    mode: 'readwrite',
  })

  if (queryResult === 'granted') {
    return true
  }

  if (!rootHandle.requestPermission) {
    return false
  }

  const requestResult = await rootHandle.requestPermission({
    mode: 'readwrite',
  })

  return requestResult === 'granted'
}

export async function hasWorkspacePermission(
  rootHandle: FileSystemDirectoryHandle,
): Promise<boolean> {
  if (!rootHandle.queryPermission) {
    return true
  }

  const queryResult = await rootHandle.queryPermission({
    mode: 'readwrite',
  })

  return queryResult === 'granted'
}
