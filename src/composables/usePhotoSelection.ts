import { computed, ref, type ComputedRef } from 'vue'

import type { PhotoItem } from '@/types/photo'

interface UsePhotoSelectionOptions {
  photos: ComputedRef<PhotoItem[]>
  rangePhotos: ComputedRef<PhotoItem[]>
}

export function usePhotoSelection(options: UsePhotoSelectionOptions) {
  const selectedPhotoIds = ref<Set<string>>(new Set())
  const lastSelectedPhotoId = ref<string | null>(null)

  const selectedPhotos = computed(() => {
    return options.photos.value.filter((photo) => selectedPhotoIds.value.has(photo.id))
  })

  const singleSelectedPhoto = computed<PhotoItem | null>(() => {
    if (selectedPhotos.value.length !== 1) {
      return null
    }

    return selectedPhotos.value[0] ?? null
  })

  const selectedNormalPhotos = computed(() => {
    return selectedPhotos.value.filter((photo) => photo.parentType !== 'discarded')
  })

  const selectedDiscardedPhotos = computed(() => {
    return selectedPhotos.value.filter((photo) => photo.parentType === 'discarded')
  })

  function clearSelection() {
    selectedPhotoIds.value = new Set()
    lastSelectedPhotoId.value = null
  }

  function setSingleSelection(photo: PhotoItem) {
    selectedPhotoIds.value = new Set([photo.id])
    lastSelectedPhotoId.value = photo.id
  }

  function toggleSelection(photo: PhotoItem) {
    const next = new Set(selectedPhotoIds.value)

    if (next.has(photo.id)) {
      next.delete(photo.id)
    } else {
      next.add(photo.id)
    }

    selectedPhotoIds.value = next
    lastSelectedPhotoId.value = photo.id
  }

  function selectRange(photo: PhotoItem) {
    if (!lastSelectedPhotoId.value) {
      setSingleSelection(photo)
      return
    }

    const list = options.rangePhotos.value
    const startIndex = list.findIndex((item) => item.id === lastSelectedPhotoId.value)
    const endIndex = list.findIndex((item) => item.id === photo.id)

    if (startIndex === -1 || endIndex === -1) {
      setSingleSelection(photo)
      return
    }

    const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
    const next = new Set(selectedPhotoIds.value)

    for (const item of list.slice(start, end + 1)) {
      next.add(item.id)
    }

    selectedPhotoIds.value = next
  }

  function handleSelectPhoto(photo: PhotoItem, event: MouseEvent) {
    if (event.shiftKey) {
      selectRange(photo)
      return
    }

    if (event.ctrlKey || event.metaKey) {
      toggleSelection(photo)
      return
    }

    setSingleSelection(photo)
  }

  return {
    selectedPhotoIds,
    lastSelectedPhotoId,
    selectedPhotos,
    singleSelectedPhoto,
    selectedNormalPhotos,
    selectedDiscardedPhotos,
    clearSelection,
    setSingleSelection,
    toggleSelection,
    selectRange,
    handleSelectPhoto,
  }
}
