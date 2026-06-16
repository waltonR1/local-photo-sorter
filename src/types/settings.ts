import type { WorkspaceLanguage } from '@/types/workspace'

export type GridSize = 'small' | 'medium' | 'large'
export type SortBy = 'name' | 'modifiedTime'
export type SortOrder = 'asc' | 'desc'
export type ImportMode = 'copy' | 'move'

export interface AppSettings {
  id: 'default'
  gridSize: GridSize
  sortBy: SortBy
  sortOrder: SortOrder
  defaultImportMode: ImportMode
  uiLanguage: WorkspaceLanguage
  updatedAt: number
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'default',
  gridSize: 'medium',
  sortBy: 'name',
  sortOrder: 'asc',
  defaultImportMode: 'copy',
  uiLanguage: 'zh',
  updatedAt: Date.now(),
}
