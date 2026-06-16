import { createRouter, createWebHistory } from 'vue-router'

import SetupView from '@/views/SetupView.vue'
import BrowseView from '@/views/BrowseView.vue'
import ClassifyView from '@/views/ClassifyView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/browse',
    },
    {
      path: '/setup',
      name: 'setup',
      component: SetupView,
    },
    {
      path: '/browse',
      name: 'browse',
      component: BrowseView,
    },
    {
      path: '/classify',
      name: 'classify',
      component: ClassifyView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
})

router.beforeEach(async (to) => {
  const publicPages = ['/setup']

  if (publicPages.includes(to.path)) {
    return true
  }

  const { useWorkspaceStore } = await import('@/stores/workspaceStore')
  const workspaceStore = useWorkspaceStore()

  if (!workspaceStore.hasWorkspace) {
    await workspaceStore.restoreLastWorkspace()
  }

  if (!workspaceStore.hasWorkspace) {
    return '/setup'
  }

  return true
})

export default router
