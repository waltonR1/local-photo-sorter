<script setup lang="ts">
import type { ImportMode } from '@/types/settings'

const props = defineProps<{
  modelValue: boolean
  selectedCount: number
  importing: boolean
  importMode: ImportMode
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:importMode': [value: ImportMode]
  selectFiles: []
  startImport: []
}>()

function handleClose() {
  emit('update:modelValue', false)
}

function handleImportModeChange(value: ImportMode) {
  emit('update:importMode', value)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="导入照片"
    width="560px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="import-dialog">
      <p class="description">选择本地图片后，程序会将图片导入到当前工作区的“未分类”文件夹中。</p>

      <el-alert
        title="当前网页版本优先支持复制导入，原文件会保留。"
        type="info"
        show-icon
        :closable="false"
      />

      <div class="section">
        <div class="section-title">导入方式</div>

        <el-radio-group :model-value="props.importMode" @change="handleImportModeChange">
          <el-radio label="copy"> 复制导入，保留原文件 </el-radio>

          <el-radio label="move" disabled> 移动导入，暂未开放 </el-radio>
        </el-radio-group>

        <div class="support-text">由于浏览器权限限制，移动导入需要后续单独实现。</div>
      </div>

      <div class="section">
        <div class="section-title">选择图片</div>

        <div class="select-row">
          <el-button @click="emit('selectFiles')"> 选择图片 </el-button>

          <span class="selected-count"> 已选择 {{ selectedCount }} 张 </span>
        </div>

        <div class="support-text">支持格式：jpg / jpeg / png / webp</div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose"> 取消 </el-button>

      <el-button
        type="primary"
        :loading="importing"
        :disabled="selectedCount === 0"
        @click="emit('startImport')"
      >
        开始导入
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.import-dialog {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.description {
  margin: 0;
  color: #606266;
  line-height: 1.7;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-weight: 600;
}

.select-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  color: #606266;
}

.support-text {
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}
</style>
