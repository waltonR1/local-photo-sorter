<script setup lang="ts">
import type { PhotoItem } from '@/types/photo'

defineProps<{
  selectedPhotos: PhotoItem[]
  singleSelectedPhoto: PhotoItem | null
  selectedNormalPhotos: PhotoItem[]
  selectedCategoryPhotos: PhotoItem[]
  selectedDiscardedPhotos: PhotoItem[]
  getPhotoStatusLabel: (status: PhotoItem['parentType']) => string
  getDisplayPath: (photo: PhotoItem) => string
  formatFileSize: (size: number) => string
  formatTime: (timestamp: number) => string
}>()

const emit = defineEmits<{
  moveToCategory: []
  moveToUnsorted: []
  moveToDiscarded: []
  restore: []
  rename: []
  clearSelection: []
}>()
</script>

<template>
  <el-aside width="280px" class="right-panel">
    <template v-if="selectedPhotos.length > 1">
      <h3>批量操作</h3>

      <p class="empty-detail">已选择 {{ selectedPhotos.length }} 张图片</p>

      <el-descriptions :column="1" size="small" border>
        <el-descriptions-item label="未废弃">
          {{ selectedNormalPhotos.length }} 张
        </el-descriptions-item>

        <el-descriptions-item label="已分类">
          {{ selectedCategoryPhotos.length }} 张
        </el-descriptions-item>

        <el-descriptions-item label="已废弃">
          {{ selectedDiscardedPhotos.length }} 张
        </el-descriptions-item>
      </el-descriptions>

      <div class="detail-actions">
        <el-button
          type="primary"
          :disabled="selectedNormalPhotos.length === 0"
          @click="emit('moveToCategory')"
        >
          批量移动到分类
        </el-button>

        <el-button :disabled="selectedCategoryPhotos.length === 0" @click="emit('moveToUnsorted')">
          批量移回未分类
        </el-button>

        <el-button
          type="danger"
          plain
          :disabled="selectedNormalPhotos.length === 0"
          @click="emit('moveToDiscarded')"
        >
          批量移动到已废弃
        </el-button>

        <el-button
          type="success"
          :disabled="selectedDiscardedPhotos.length === 0"
          @click="emit('restore')"
        >
          批量恢复
        </el-button>

        <el-button @click="emit('clearSelection')">取消选择</el-button>
      </div>
    </template>

    <template v-else-if="singleSelectedPhoto">
      <h3>详情</h3>

      <div class="detail-preview">
        <img :src="singleSelectedPhoto.objectUrl" :alt="singleSelectedPhoto.name" />
      </div>

      <el-descriptions :column="1" size="small" border>
        <el-descriptions-item label="文件名">
          {{ singleSelectedPhoto.name }}
        </el-descriptions-item>

        <el-descriptions-item label="路径">
          {{ getDisplayPath(singleSelectedPhoto) }}
        </el-descriptions-item>

        <el-descriptions-item label="大小">
          {{ formatFileSize(singleSelectedPhoto.size) }}
        </el-descriptions-item>

        <el-descriptions-item label="修改时间">
          {{ formatTime(singleSelectedPhoto.lastModified) }}
        </el-descriptions-item>

        <el-descriptions-item label="状态">
          {{ getPhotoStatusLabel(singleSelectedPhoto.parentType) }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="detail-actions">
        <template v-if="singleSelectedPhoto.parentType !== 'discarded'">
          <el-button type="primary" @click="emit('moveToCategory')">移动到分类</el-button>

          <el-button
            v-if="singleSelectedPhoto.parentType === 'category'"
            @click="emit('moveToUnsorted')"
          >
            移回未分类
          </el-button>

          <el-button type="danger" plain @click="emit('moveToDiscarded')">
            移动到已废弃
          </el-button>
        </template>

        <template v-else>
          <el-button type="success" @click="emit('restore')">恢复到原位置</el-button>
        </template>

        <el-button @click="emit('rename')">重命名</el-button>

        <el-button @click="emit('clearSelection')">取消选择</el-button>
      </div>
    </template>

    <template v-else>
      <h3>详情</h3>
      <p class="empty-detail">请选择图片</p>
    </template>
  </el-aside>
</template>

<style scoped>
.right-panel {
  border-left: 1px solid #e4e7ed;
  padding: 16px;
  background: #fff;
  overflow: auto;
}

.empty-detail {
  color: #909399;
}

.detail-preview {
  width: 100%;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f2f5;
}

.detail-preview img {
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: contain;
}

.detail-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.detail-actions :deep(.el-button) {
  width: min(212px, 100%) !important;
  margin-left: 0 !important;
}
</style>
