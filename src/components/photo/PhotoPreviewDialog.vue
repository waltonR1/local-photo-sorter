<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PhotoItem } from '@/types/photo'

const props = defineProps<{
  modelValue: boolean
  photo: PhotoItem | null
  hasPrevious: boolean
  hasNext: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  previous: []
  next: []
  moveToCategory: []
  moveToDiscarded: []
  restore: []
}>()

const scale = ref(1)

const scaleText = computed(() => {
  return `${Math.round(scale.value * 100)}%`
})

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      scale.value = 1
    }
  },
)

watch(
  () => props.photo?.id,
  () => {
    scale.value = 1
  },
)

function handleClose() {
  emit('update:modelValue', false)
}

function zoomIn() {
  scale.value = Math.min(scale.value + 0.25, 3)
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.25, 0.25)
}

function resetZoom() {
  scale.value = 1
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="90vw"
    top="4vh"
    class="preview-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="preview-header">
        <div class="file-name">
          {{ photo?.name ?? '预览' }}
        </div>

        <div class="path">
          {{ photo?.relativePath }}
        </div>
      </div>
    </template>

    <div v-if="photo" class="preview-body">
      <div class="image-stage">
        <img
          class="preview-image"
          :src="photo.objectUrl"
          :alt="photo.name"
          :style="{ transform: `scale(${scale})` }"
          draggable="false"
        />
      </div>
    </div>

    <el-empty v-else description="暂无图片" />

    <template #footer>
      <div class="preview-footer">
        <div class="left-actions">
          <el-button :disabled="!hasPrevious" @click="emit('previous')"> 上一张 </el-button>

          <el-button :disabled="!hasNext" @click="emit('next')"> 下一张 </el-button>
        </div>

        <div class="center-actions">
          <el-button @click="zoomOut">缩小</el-button>
          <el-button @click="resetZoom">重置 {{ scaleText }}</el-button>
          <el-button @click="zoomIn">放大</el-button>
        </div>

        <div class="right-actions">
          <template v-if="photo?.parentType !== 'discarded'">
            <el-button type="primary" @click="emit('moveToCategory')"> 移动到分类 </el-button>

            <el-button type="danger" plain @click="emit('moveToDiscarded')">
              移动到已废弃
            </el-button>
          </template>

          <template v-else>
            <el-button type="success" @click="emit('restore')"> 恢复到原位置 </el-button>
          </template>

          <el-button @click="handleClose">关闭</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.preview-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 700;
  font-size: 16px;
}

.path {
  color: #909399;
  font-size: 12px;
  word-break: break-all;
}

.preview-body {
  height: 72vh;
  overflow: hidden;
  background: #f5f7fa;
  border-radius: 8px;
}

.image-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.15s ease;
  transform-origin: center center;
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.left-actions,
.center-actions,
.right-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
