import type { WorkspaceLanguage } from '@/types/workspace'

export type GridSize = 'small' | 'medium' | 'large'
export type SortBy = 'name' | 'modifiedTime'
export type SortOrder = 'asc' | 'desc'
export type ImportMode = 'copy' | 'move'

export interface ClassifyShortcutBinding {
  key: string
  categoryName: string
}

export interface AppSettings {
  id: 'default'
  gridSize: GridSize
  sortBy: SortBy
  sortOrder: SortOrder
  defaultImportMode: ImportMode
  classifyShortcutKeys: string[]
  classifyCategoryShortcutMap: Record<string, string>
  classifyShortcutBindings: ClassifyShortcutBinding[]
  uiLanguage: WorkspaceLanguage
  updatedAt: number
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'default',
  gridSize: 'medium',
  sortBy: 'name',
  sortOrder: 'asc',
  defaultImportMode: 'copy',
  classifyShortcutKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  classifyCategoryShortcutMap: {},
  classifyShortcutBindings: [],
  uiLanguage: 'zh',
  updatedAt: Date.now(),
}
