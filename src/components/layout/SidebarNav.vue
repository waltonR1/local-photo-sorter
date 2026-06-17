<script setup lang="ts">
import type { PhotoViewKey } from '@/types/photo'

defineProps<{
  currentView: PhotoViewKey
  totalNormalPhotos: number
  totalUnsortedPhotos: number
  totalDiscardedPhotos: number
  categoryNames: string[]
  categoryPhotoCounts: Record<string, number>
}>()

const emit = defineEmits<{
  selectView: [view: PhotoViewKey]
}>()

function handleMenuSelect(index: string) {
  emit('selectView', index as PhotoViewKey)
}
</script>

<template>
  <el-aside width="220px" class="sidebar">
    <el-menu :default-active="currentView" @select="handleMenuSelect">
      <el-menu-item index="all">
        全部照片
        <span class="menu-count">{{ totalNormalPhotos }}</span>
      </el-menu-item>

      <el-menu-item index="unsorted">
        未分类
        <span class="menu-count">{{ totalUnsortedPhotos }}</span>
      </el-menu-item>

      <el-sub-menu index="categories">
        <template #title>已分类</template>

        <el-menu-item
          v-for="categoryName in categoryNames"
          :key="categoryName"
          :index="`category:${categoryName}`"
        >
          {{ categoryName }}
          <span class="menu-count">
            {{ categoryPhotoCounts[categoryName] ?? 0 }}
          </span>
        </el-menu-item>

        <el-menu-item v-if="categoryNames.length === 0" index="category-empty" disabled>
          暂无分类
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item index="discarded">
        已废弃
        <span class="menu-count">{{ totalDiscardedPhotos }}</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<style scoped>
.sidebar {
  border-right: 1px solid #e4e7ed;
  background: #fff;
  overflow: auto;
}

.menu-count {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}
</style>
