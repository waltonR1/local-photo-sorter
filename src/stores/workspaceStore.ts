import { markRaw } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/db/indexedDb'
import type { WorkspaceLanguage, WorkspaceState } from '@/types/workspace'
import { hasWorkspacePermission } from '@/services/workspaceService'

interface WorkspaceStoreState {
  currentWorkspace: WorkspaceState | null
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceStoreState => ({
    currentWorkspace: null,
  }),

  getters: {
    hasWorkspace: (state) => Boolean(state.currentWorkspace?.rootHandle),
  },

  actions: {
    async setWorkspace(payload: {
      rootHandle: FileSystemDirectoryHandle
      language: WorkspaceLanguage
    }) {
      const now = Date.now()

      const rootHandle = markRaw(payload.rootHandle)

      const workspace: WorkspaceState = {
        id: 'default',
        name: rootHandle.name,
        language: payload.language,
        uiLanguage: payload.language,
        rootHandle,
        createdAt: now,
        updatedAt: now,
      }

      this.currentWorkspace = workspace

      await db.workspaces.put({
        ...workspace,
        rootHandle: payload.rootHandle,
      })
    },

    async restoreLastWorkspace() {
      const workspace = await db.workspaces.get('default')

      if (!workspace) {
        return
      }

      const rootHandle = markRaw(workspace.rootHandle)

      const hasPermission = await hasWorkspacePermission(rootHandle)

      if (!hasPermission) {
        this.currentWorkspace = null
        return
      }

      this.currentWorkspace = {
        ...workspace,
        rootHandle,
      }
    },

    async clearWorkspace() {
      this.currentWorkspace = null
      await db.workspaces.delete('default')
    },
  },
})
