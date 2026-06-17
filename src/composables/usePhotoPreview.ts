import { computed, ref, type ComputedRef } from 'vue'

import type { PhotoItem } from '@/types/photo'

interface UsePhotoPreviewOptions {
  photos: ComputedRef<PhotoItem[]>
  setSingleSelection: (photo: PhotoItem) => void
}

export function usePhotoPreview(options: UsePhotoPreviewOptions) {
  const previewDialogVisible = ref(false)
  const previewPhotoId = ref<string | null>(null)

  const previewPhoto = computed<PhotoItem | null>(() => {
    if (!previewPhotoId.value) {
      return null
    }

    return options.photos.value.find((photo) => photo.id === previewPhotoId.value) ?? null
  })

  const previewPhotoIndex = computed(() => {
    if (!previewPhotoId.value) {
      return -1
    }

    return options.photos.value.findIndex((photo) => photo.id === previewPhotoId.value)
  })

  const hasPreviousPreviewPhoto = computed(() => {
    return previewPhotoIndex.value > 0
  })

  const hasNextPreviewPhoto = computed(() => {
    return previewPhotoIndex.value >= 0 && previewPhotoIndex.value < options.photos.value.length - 1
  })

  function handlePreviewPhoto(photo: PhotoItem) {
    options.setSingleSelection(photo)
    previewPhotoId.value = photo.id
    previewDialogVisible.value = true
  }

  function showPreviousPreviewPhoto() {
    const index = previewPhotoIndex.value

    if (index <= 0) {
      return
    }

    const previousPhoto = options.photos.value[index - 1]

    if (!previousPhoto) {
      return
    }

    previewPhotoId.value = previousPhoto.id
    options.setSingleSelection(previousPhoto)
  }

  function showNextPreviewPhoto() {
    const index = previewPhotoIndex.value

    if (index < 0 || index >= options.photos.value.length - 1) {
      return
    }

    const nextPhoto = options.photos.value[index + 1]

    if (!nextPhoto) {
      return
    }

    previewPhotoId.value = nextPhoto.id
    options.setSingleSelection(nextPhoto)
  }

  function closePreview() {
    previewDialogVisible.value = false
    previewPhotoId.value = null
  }

  return {
    previewDialogVisible,
    previewPhotoId,
    previewPhoto,
    previewPhotoIndex,
    hasPreviousPreviewPhoto,
    hasNextPreviewPhoto,
    handlePreviewPhoto,
    showPreviousPreviewPhoto,
    showNextPreviewPhoto,
    closePreview,
  }
}
