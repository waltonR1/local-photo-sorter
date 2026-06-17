<script setup lang="ts">
import type { PhotoItem } from '@/types/photo'

defineProps<{
  photo: PhotoItem
  gridSize: 'small' | 'medium' | 'large'
  selected: boolean
}>()

defineEmits<{
  select: [photo: PhotoItem, event: MouseEvent]
  preview: [photo: PhotoItem]
}>()
</script>

<template>
  <div
    class="photo-card"
    :class="[gridSize, { selected }]"
    @click="$emit('select', photo, $event)"
    @dblclick="$emit('preview', photo)"
  >
    <div class="image-wrapper">
      <img
        :src="photo.thumbnailUrl || photo.objectUrl"
        :alt="photo.name"
        loading="lazy"
        decoding="async"
        draggable="false"
      />

      <span v-if="photo.thumbnailLoading" class="thumbnail-status">缓存中</span>
    </div>

    <div class="photo-name" :title="photo.name">
      {{ photo.name }}
    </div>
  </div>
</template>

<style scoped>
.photo-card {
  overflow: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  contain: layout paint;
  transition:
    box-shadow 0.15s,
    transform 0.15s,
    border-color 0.15s;
}

.photo-card:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
  transform: translateY(-1px);
}

.photo-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgb(64 158 255 / 28%);
}

.image-wrapper {
  position: relative;
  width: 100%;
  background: #f0f2f5;
}

.image-wrapper img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-card.small .image-wrapper {
  height: 100px;
}

.photo-card.medium .image-wrapper {
  height: 150px;
}

.photo-card.large .image-wrapper {
  height: 220px;
}

.photo-name {
  padding: 8px;
  color: #303133;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thumbnail-status {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgb(0 0 0 / 48%);
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
}
</style>
