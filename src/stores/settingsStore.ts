import { ref } from 'vue'
import { defineStore } from 'pinia'

import { db } from '@/db/indexedDb'
import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type ClassifyShortcutBinding,
  type GridSize,
  type ImportMode,
  type SortBy,
  type SortOrder,
} from '@/types/settings'
import type { WorkspaceLanguage } from '@/types/workspace'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_APP_SETTINGS })
  const loaded = ref(false)

  function createSerializableSettings(value: AppSettings): AppSettings {
    return JSON.parse(JSON.stringify(value)) as AppSettings
  }

  async function loadSettings() {
    const record = await db.settings.get('default')

    if (record) {
      settings.value = {
        ...DEFAULT_APP_SETTINGS,
        ...record,
      }
    } else {
      await db.settings.put(createSerializableSettings(settings.value))
    }

    loaded.value = true
  }

  async function updateSettings(patch: Partial<Omit<AppSettings, 'id'>>) {
    const nextSettings: AppSettings = {
      ...settings.value,
      ...patch,
      id: 'default',
      updatedAt: Date.now(),
    }

    settings.value = nextSettings
    await db.settings.put(createSerializableSettings(nextSettings))
  }

  async function setGridSize(gridSize: GridSize) {
    await updateSettings({ gridSize })
  }

  async function setSortBy(sortBy: SortBy) {
    await updateSettings({ sortBy })
  }

  async function setSortOrder(sortOrder: SortOrder) {
    await updateSettings({ sortOrder })
  }

  async function setDefaultImportMode(defaultImportMode: ImportMode) {
    await updateSettings({ defaultImportMode })
  }

  async function setClassifyShortcutKeys(classifyShortcutKeys: string[]) {
    await updateSettings({ classifyShortcutKeys })
  }

  async function setClassifyCategoryShortcutMap(
    classifyCategoryShortcutMap: Record<string, string>,
  ) {
    await updateSettings({ classifyCategoryShortcutMap })
  }

  async function setClassifyShortcutBindings(
    classifyShortcutBindings: ClassifyShortcutBinding[],
  ) {
    await updateSettings({ classifyShortcutBindings })
  }

  async function setUiLanguage(uiLanguage: WorkspaceLanguage) {
    await updateSettings({ uiLanguage })
  }

  return {
    settings,
    loaded,
    loadSettings,
    updateSettings,
    setGridSize,
    setSortBy,
    setSortOrder,
    setDefaultImportMode,
    setClassifyShortcutKeys,
    setClassifyCategoryShortcutMap,
    setClassifyShortcutBindings,
    setUiLanguage,
  }
})
