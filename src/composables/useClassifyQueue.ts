import { computed, nextTick, ref, type ComputedRef } from 'vue'

import type { PhotoItem } from '@/types/photo'

interface UseClassifyQueueOptions {
  photos: ComputedRef<PhotoItem[]>
  confirmRestartSkipped: (skippedCount: number) => Promise<boolean>
  onSkippedDeclined: () => Promise<void> | void
  onQueueComplete: () => Promise<void> | void
}

export function useClassifyQueue(options: UseClassifyQueueOptions) {
  const currentIndex = ref(0)
  const skippedPhotoIds = ref<Set<string>>(new Set())

  const allUnsortedPhotos = computed(() => {
    return options.photos.value.filter((photo) => photo.parentType === 'unsorted')
  })

  const queuePhotos = computed(() => {
    return allUnsortedPhotos.value.filter((photo) => !skippedPhotoIds.value.has(photo.id))
  })

  const currentPhoto = computed<PhotoItem | null>(() => {
    return queuePhotos.value[currentIndex.value] ?? null
  })

  const progressText = computed(() => {
    const total = allUnsortedPhotos.value.length
    const current = Math.min(currentIndex.value + 1, queuePhotos.value.length)

    if (total === 0) {
      return '未分类：0 / 0'
    }

    return `未分类：${current} / ${queuePhotos.value.length}，跳过：${skippedPhotoIds.value.size}`
  })

  function normalizeCurrentIndex() {
    if (currentIndex.value < 0) {
      currentIndex.value = 0
    }

    if (currentIndex.value >= queuePhotos.value.length) {
      currentIndex.value = Math.max(queuePhotos.value.length - 1, 0)
    }
  }

  async function handleQueueEndIfNeeded() {
    await nextTick()
    normalizeCurrentIndex()

    if (queuePhotos.value.length > 0) {
      return
    }

    if (skippedPhotoIds.value.size > 0) {
      const shouldRestart = await options.confirmRestartSkipped(skippedPhotoIds.value.size)

      if (shouldRestart) {
        skippedPhotoIds.value = new Set()
        currentIndex.value = 0
        return
      }

      await options.onSkippedDeclined()
      return
    }

    await options.onQueueComplete()
  }

  async function handleSkipCurrentPhoto() {
    if (!currentPhoto.value) {
      return
    }

    const nextSkipped = new Set(skippedPhotoIds.value)
    nextSkipped.add(currentPhoto.value.id)
    skippedPhotoIds.value = nextSkipped

    normalizeCurrentIndex()
    await handleQueueEndIfNeeded()
  }

  return {
    currentIndex,
    skippedPhotoIds,
    allUnsortedPhotos,
    queuePhotos,
    currentPhoto,
    progressText,
    normalizeCurrentIndex,
    handleSkipCurrentPhoto,
    handleQueueEndIfNeeded,
  }
}
