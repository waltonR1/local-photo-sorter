export type WorkspaceLanguage = 'zh' | 'en'

export interface FolderNames {
  unsorted: string
  sorted: string
  discarded: string
}

export interface WorkspaceState {
  id: string
  name: string
  language: WorkspaceLanguage
  uiLanguage: WorkspaceLanguage
  createdAt: number
  updatedAt: number
  rootHandle?: FileSystemDirectoryHandle
}
