import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { useWorkspaceStore } from '@/stores/workspaceStore'
import { getFolderNames } from '@/utils/folderNames'
import { scanWorkspacePhotos } from '@/services/photoScanService'
import type { PhotoItem, PhotoViewKey } from '@/types/photo'

export const usePhotoStore = defineStore('photo', () => {
  const photos = ref<PhotoItem[]>([])
  const categoryNames = ref<string[]>([])
  const currentView = ref<PhotoViewKey>('all')
  const searchKeyword = ref('')
  const sortBy = ref<'name' | 'modifiedTime'>('name')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  const gridSize = ref<'small' | 'medium' | 'large'>('medium')
  const loading = ref(false)

  const filteredPhotos = computed(() => {
    let result = [...photos.value]

    if (currentView.value === 'all') {
      result = result.filter((photo) => photo.parentType !== 'discarded')
    } else if (currentView.value === 'unsorted') {
      result = result.filter((photo) => photo.parentType === 'unsorted')
    } else if (currentView.value === 'discarded') {
      result = result.filter((photo) => photo.parentType === 'discarded')
    } else if (currentView.value.startsWith('category:')) {
      const categoryName = currentView.value.replace('category:', '')
      result = result.filter(
        (photo) => photo.parentType === 'category' && photo.categoryName === categoryName,
      )
    }

    const keyword = searchKeyword.value.trim().toLowerCase()

    if (keyword) {
      result = result.filter((photo) => photo.name.toLowerCase().includes(keyword))
    }

    result.sort((a, b) => {
      let compareResult = 0

      if (sortBy.value === 'name') {
        compareResult = a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      } else {
        compareResult = a.lastModified - b.lastModified
      }

      return sortOrder.value === 'asc' ? compareResult : -compareResult
    })

    return result
  })

  const totalNormalPhotos = computed(() => {
    return photos.value.filter((photo) => photo.parentType !== 'discarded').length
  })

  const totalUnsortedPhotos = computed(() => {
    return photos.value.filter((photo) => photo.parentType === 'unsorted').length
  })

  const totalDiscardedPhotos = computed(() => {
    return photos.value.filter((photo) => photo.parentType === 'discarded').length
  })

  const categoryPhotoCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}

    for (const categoryName of categoryNames.value) {
      counts[categoryName] = 0
    }

    for (const photo of photos.value) {
      if (photo.parentType === 'category' && photo.categoryName) {
        counts[photo.categoryName] = (counts[photo.categoryName] ?? 0) + 1
      }
    }

    return counts
  })

  async function scanPhotos() {
    const workspaceStore = useWorkspaceStore()
    const workspace = workspaceStore.currentWorkspace

    if (!workspace?.rootHandle) {
      throw new Error('请先选择工作区')
    }

    loading.value = true

    try {
      revokeObjectUrls()

      const folderNames = getFolderNames(workspace.language)
      const result = await scanWorkspacePhotos(workspace.rootHandle, folderNames)

      photos.value = result.photos
      categoryNames.value = result.categoryNames
    } finally {
      loading.value = false
    }
  }

  function setCurrentView(view: PhotoViewKey) {
    currentView.value = view
  }

  function revokeObjectUrls() {
    for (const photo of photos.value) {
      URL.revokeObjectURL(photo.objectUrl)
    }
  }

  function clearPhotos() {
    revokeObjectUrls()
    photos.value = []
    categoryNames.value = []
    currentView.value = 'all'
    searchKeyword.value = ''
  }

  return {
    photos,
    categoryNames,
    currentView,
    searchKeyword,
    sortBy,
    sortOrder,
    gridSize,
    loading,
    filteredPhotos,
    totalNormalPhotos,
    totalUnsortedPhotos,
    totalDiscardedPhotos,
    categoryPhotoCounts,
    scanPhotos,
    setCurrentView,
    revokeObjectUrls,
    clearPhotos,
  }
})
