import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { useWorkspaceStore } from '@/stores/workspaceStore'
import { getFolderNames } from '@/utils/folderNames'
import { scanWorkspacePhotos } from '@/services/photoScanService'
import {
  cleanupMissingThumbnails,
  getOrCreateThumbnail,
} from '@/services/thumbnailService'
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
  const thumbnailGenerating = ref(false)
  const thumbnailTotal = ref(0)
  const thumbnailDone = ref(0)
  const thumbnailFailed = ref(0)
  let thumbnailGenerationToken = 0

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

  async function scanPhotos(options: { generateThumbnails?: boolean } = {}) {
    const workspaceStore = useWorkspaceStore()
    const workspace = workspaceStore.currentWorkspace
    const shouldGenerateThumbnails = options.generateThumbnails ?? true

    if (!workspace?.rootHandle) {
      throw new Error('请先选择工作区')
    }

    loading.value = true

    try {
      cancelThumbnailGeneration()
      revokeObjectUrls()

      const folderNames = getFolderNames(workspace.language)
      const result = await scanWorkspacePhotos(workspace.rootHandle, folderNames)

      photos.value = result.photos
      categoryNames.value = result.categoryNames

      void cleanupMissingThumbnails(result.photos.map((photo) => photo.id))

      if (shouldGenerateThumbnails) {
        void generateThumbnailsForPhotos(result.photos)
      }
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

      if (photo.thumbnailUrl && photo.thumbnailUrl !== photo.objectUrl) {
        URL.revokeObjectURL(photo.thumbnailUrl)
      }
    }
  }

  function revokePhotoThumbnailUrl(photo: PhotoItem) {
    if (photo.thumbnailUrl && photo.thumbnailUrl !== photo.objectUrl) {
      URL.revokeObjectURL(photo.thumbnailUrl)
    }
  }

  function updatePhotoThumbnail(
    photoId: string,
    patch: Pick<PhotoItem, 'thumbnailLoading' | 'thumbnailError'> & {
      thumbnailUrl?: string
    },
  ) {
    const targetPhoto = photos.value.find((photo) => photo.id === photoId)

    if (!targetPhoto) {
      return
    }

    if (patch.thumbnailUrl && targetPhoto.thumbnailUrl !== patch.thumbnailUrl) {
      revokePhotoThumbnailUrl(targetPhoto)
    }

    targetPhoto.thumbnailUrl = patch.thumbnailUrl ?? targetPhoto.thumbnailUrl
    targetPhoto.thumbnailLoading = patch.thumbnailLoading
    targetPhoto.thumbnailError = patch.thumbnailError
  }

  function cancelThumbnailGeneration() {
    thumbnailGenerationToken += 1
    thumbnailGenerating.value = false
    thumbnailTotal.value = 0
    thumbnailDone.value = 0
    thumbnailFailed.value = 0
  }

  async function waitForNextThumbnailTask() {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0)
    })
  }

  async function generateThumbnailsForPhotos(targetPhotos: PhotoItem[]) {
    const generationToken = ++thumbnailGenerationToken
    const concurrency = 3
    let nextIndex = 0

    thumbnailGenerating.value = targetPhotos.length > 0
    thumbnailTotal.value = targetPhotos.length
    thumbnailDone.value = 0
    thumbnailFailed.value = 0

    async function worker() {
      while (generationToken === thumbnailGenerationToken) {
        const photo = targetPhotos[nextIndex]
        nextIndex += 1

        if (!photo) {
          return
        }

        updatePhotoThumbnail(photo.id, {
          thumbnailLoading: true,
          thumbnailError: false,
        })

        try {
          await waitForNextThumbnailTask()
          const result = await getOrCreateThumbnail(photo)

          if (generationToken !== thumbnailGenerationToken) {
            URL.revokeObjectURL(result.thumbnailUrl)
            return
          }

          updatePhotoThumbnail(photo.id, {
            thumbnailUrl: result.thumbnailUrl,
            thumbnailLoading: false,
            thumbnailError: false,
          })
        } catch (error) {
          if (generationToken !== thumbnailGenerationToken) {
            return
          }

          console.warn('Failed to generate thumbnail', photo.relativePath, error)
          thumbnailFailed.value += 1

          updatePhotoThumbnail(photo.id, {
            thumbnailLoading: false,
            thumbnailError: true,
          })
        } finally {
          if (generationToken === thumbnailGenerationToken) {
            thumbnailDone.value += 1
          }
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, targetPhotos.length) }, worker))

    if (generationToken === thumbnailGenerationToken) {
      thumbnailGenerating.value = false
    }
  }

  function clearPhotos() {
    cancelThumbnailGeneration()
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
    thumbnailGenerating,
    thumbnailTotal,
    thumbnailDone,
    thumbnailFailed,
    filteredPhotos,
    totalNormalPhotos,
    totalUnsortedPhotos,
    totalDiscardedPhotos,
    categoryPhotoCounts,
    scanPhotos,
    setCurrentView,
    revokeObjectUrls,
    generateThumbnailsForPhotos,
    clearPhotos,
  }
})
