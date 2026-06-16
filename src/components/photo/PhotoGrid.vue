<script setup lang="ts">
import type { PhotoItem } from '@/types/photo'
import PhotoCard from '@/components/photo/PhotoCard.vue'

defineProps<{
  photos: PhotoItem[]
  gridSize: 'small' | 'medium' | 'large'
  selectedPhotoIds: Set<string>
}>()

const emit = defineEmits<{
  selectPhoto: [photo: PhotoItem, event: MouseEvent]
  previewPhoto: [photo: PhotoItem]
}>()

function handleSelectPhoto(photo: PhotoItem, event: MouseEvent) {
  emit('selectPhoto', photo, event)
}

function handlePreviewPhoto(photo: PhotoItem) {
  emit('previewPhoto', photo)
}
</script>

<template>
  <div class="photo-grid" :class="gridSize">
    <PhotoCard
      v-for="photo in photos"
      :key="photo.id"
      :photo="photo"
      :grid-size="gridSize"
      :selected="selectedPhotoIds.has(photo.id)"
      @select="handleSelectPhoto"
      @preview="handlePreviewPhoto"
    />
  </div>
</template>

<style scoped>
.photo-grid {
  display: grid;
  gap: 16px;
}

.photo-grid.small {
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}

.photo-grid.medium {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.photo-grid.large {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
</style>
