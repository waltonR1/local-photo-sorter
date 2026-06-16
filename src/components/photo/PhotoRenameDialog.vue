<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PhotoItem } from '@/types/photo'
import { splitFileName } from '@/utils/fileName'

const props = defineProps<{
  modelValue: boolean
  photo: PhotoItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [newName: string]
}>()

const newName = ref('')

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible || !props.photo) {
      newName.value = ''
      return
    }

    newName.value = splitFileName(props.photo.name).baseName
  },
)

function handleClose() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  emit('confirm', newName.value)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="重命名照片"
    width="460px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="photo">
      <el-form label-width="90px" @submit.prevent>
        <el-form-item label="原文件名">
          <span>{{ photo.name }}</span>
        </el-form-item>

        <el-form-item label="新文件名">
          <el-input
            v-model="newName"
            placeholder="请输入新文件名"
            autofocus
            @keyup.enter="handleConfirm"
          />
        </el-form-item>

        <el-alert
          title="扩展名会自动保留，例如原文件是 .jpg，重命名后仍然是 .jpg。"
          type="info"
          show-icon
          :closable="false"
        />
      </el-form>
    </template>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认重命名</el-button>
    </template>
  </el-dialog>
</template>
