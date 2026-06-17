<script setup lang="ts">
defineProps<{
  workspaceName: string
  loading: boolean
  canUndo: boolean
  isCategoryView: boolean
}>()

const emit = defineEmits<{
  import: []
  refresh: []
  undo: []
  createCategory: []
  manageCategories: []
  deleteCategory: []
  goToClassify: []
  goToSettings: []
}>()
</script>

<template>
  <el-header class="header">
    <div>
      <div class="title">Local Photo Sorter</div>
      <div class="workspace-name">当前工作区：{{ workspaceName }}</div>
    </div>

    <div class="actions">
      <el-button @click="emit('import')"> 导入 </el-button>

      <el-button :loading="loading" @click="emit('refresh')"> 刷新 </el-button>

      <el-button :disabled="!canUndo" @click="emit('undo')"> 撤销 Ctrl+Z </el-button>

      <el-button @click="emit('createCategory')"> 新建分类 </el-button>

      <el-button @click="emit('manageCategories')"> 管理分类 </el-button>

      <el-button v-if="isCategoryView" type="danger" plain @click="emit('deleteCategory')">
        删除分类
      </el-button>

      <el-button type="primary" @click="emit('goToClassify')"> 进入分类模式 </el-button>

      <el-button @click="emit('goToSettings')">设置</el-button>
    </div>
  </el-header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.title {
  font-weight: 700;
  font-size: 18px;
}

.workspace-name {
  margin-top: 2px;
  color: #909399;
  font-size: 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.actions :deep(.el-button) {
  min-width: 112px;
  margin-left: 0;
}
</style>
