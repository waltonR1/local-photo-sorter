import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { ActionRecord } from '@/types/action'
import { moveFileByRelativePath } from '@/services/fileSystemService'

export const useHistoryStore = defineStore('history', () => {
  const actions = ref<ActionRecord[]>([])

  const canUndo = computed(() => {
    return actions.value.length > 0
  })

  function createActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  function pushMoveAction(payload: { fromPath: string; toPath: string }) {
    actions.value.push({
      id: createActionId(),
      type: 'move',
      fromPath: payload.fromPath,
      toPath: payload.toPath,
      timestamp: Date.now(),
    })
  }

  function pushRenameAction(payload: { fromPath: string; toPath: string }) {
    actions.value.push({
      id: createActionId(),
      type: 'rename',
      fromPath: payload.fromPath,
      toPath: payload.toPath,
      timestamp: Date.now(),
    })
  }

  async function undoLastAction(options: {
    rootHandle: FileSystemDirectoryHandle
  }): Promise<ActionRecord | null> {
    const action = actions.value.pop()

    if (!action) {
      return null
    }

    await moveFileByRelativePath({
      rootHandle: options.rootHandle,
      fromPath: action.toPath,
      toPath: action.fromPath,
    })

    return action
  }

  function clearHistory() {
    actions.value = []
  }

  return {
    actions,
    canUndo,
    pushMoveAction,
    pushRenameAction,
    undoLastAction,
    clearHistory,
  }
})
