<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { InputInstance } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [categoryName: string]
}>()

const categoryName = ref('')
const categoryNameInputRef = ref<InputInstance>()

function focusCategoryNameInput() {
  nextTick(() => {
    categoryNameInputRef.value?.focus()
  })
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      categoryName.value = ''
      focusCategoryNameInput()
    }
  },
)

function handleClose() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  emit('confirm', categoryName.value)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="新建分类"
    width="420px"
    @update:model-value="emit('update:modelValue', $event)"
    @opened="focusCategoryNameInput"
  >
    <el-form label-width="80px" @submit.prevent>
      <el-form-item label="分类名">
        <el-input
          ref="categoryNameInputRef"
          v-model="categoryName"
          placeholder="例如：产品图、参考图、截图"
          autofocus
          @keyup.enter="handleConfirm"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">创建</el-button>
    </template>
  </el-dialog>
</template>
