<script setup lang="ts">
import type { ShortcutCategory } from '@/types/category'

defineProps<{
  currentCategoryName: string
  shortcutCategories: ShortcutCategory[]
  hasMoreCategories: boolean
  hasCurrentPhoto: boolean
  categoryNames: string[]
}>()

const emit = defineEmits<{
  selectCategory: [categoryName: string]
  classifyCurrent: []
  classifyToCategory: [categoryName: string]
  openOtherCategory: []
  createCategory: []
  skip: []
  discard: []
  rename: []
}>()
</script>

<template>
  <div class="classify-actions">
    <div class="current-category">当前分类：{{ currentCategoryName || '暂无' }}</div>

    <template v-if="categoryNames.length === 0">
      <div class="empty-category-tip">暂无分类，请先创建分类。</div>

      <div class="category-buttons">
        <el-button type="primary" @click="emit('createCategory')"> + 新分类 N </el-button>

        <el-button :disabled="!hasCurrentPhoto" @click="emit('skip')"> 跳过 Space </el-button>

        <el-button type="danger" plain :disabled="!hasCurrentPhoto" @click="emit('discard')">
          废弃 Delete
        </el-button>
      </div>
    </template>

    <template v-else>
      <div class="section-label">快捷分类</div>

      <div class="category-buttons">
        <el-button
          v-for="category in shortcutCategories"
          :key="category.name"
          :type="currentCategoryName === category.name ? 'primary' : 'default'"
          @click="emit('selectCategory', category.name)"
          @dblclick="emit('classifyToCategory', category.name)"
        >
          {{ category.key }} {{ category.name }}
        </el-button>

        <el-button v-if="hasMoreCategories" @click="emit('openOtherCategory')">
          选择其他分类
        </el-button>

        <el-button type="primary" plain @click="emit('createCategory')"> + 新分类 N </el-button>
      </div>

      <div class="main-actions">
        <el-button
          type="primary"
          :disabled="!hasCurrentPhoto || !currentCategoryName"
          @click="emit('classifyCurrent')"
        >
          Enter 放入当前分类
        </el-button>

        <el-button :disabled="!hasCurrentPhoto" @click="emit('skip')"> Space 跳过 </el-button>

        <el-button type="danger" plain :disabled="!hasCurrentPhoto" @click="emit('discard')">
          Delete 废弃
        </el-button>

        <el-button :disabled="!hasCurrentPhoto" @click="emit('rename')"> R 重命名 </el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.classify-actions {
  padding: 24px 32px 28px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}

.current-category {
  margin-bottom: 18px;
  font-weight: 600;
}

.empty-category-tip {
  margin-bottom: 12px;
  color: #909399;
}

.section-label {
  margin-bottom: 8px;
  color: #606266;
  font-size: 13px;
}

.category-buttons,
.main-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.main-actions {
  margin-top: 20px;
}
</style>
