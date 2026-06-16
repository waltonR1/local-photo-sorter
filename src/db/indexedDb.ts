import Dexie, { type Table } from 'dexie'
import type { WorkspaceState } from '@/types/workspace'
import type { AppSettings } from '@/types/settings'

export interface WorkspaceRecord extends WorkspaceState {
  rootHandle: FileSystemDirectoryHandle
}

class LocalPhotoSorterDb extends Dexie {
  workspaces!: Table<WorkspaceRecord, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super('local-photo-sorter-db')

    this.version(1).stores({
      workspaces: 'id, name, language, uiLanguage, updatedAt',
    })

    this.version(2).stores({
      workspaces: 'id, name, language, uiLanguage, updatedAt',
      settings: 'id, updatedAt',
    })
  }
}

export const db = new LocalPhotoSorterDb()
