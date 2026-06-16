import type { FolderNames, WorkspaceLanguage } from '@/types/workspace.ts'

export function getFolderNames(language: WorkspaceLanguage): FolderNames {
  if (language === 'en') {
    return {
      unsorted: 'Unsorted',
      sorted: 'Sorted',
      discarded: 'Discarded',
    }
  }

  return {
    unsorted: '未分类',
    sorted: '已分类',
    discarded: '已废弃',
  }
}
