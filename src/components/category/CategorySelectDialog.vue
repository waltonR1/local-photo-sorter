<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  categories: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [categoryName: string]
}>()

const keyword = ref('')
const selectedCategory = ref('')

const filteredCategories = computed(() => {
  const value = keyword.value.trim().toLowerCase()

  if (!value) {
    return props.categories
  }

  return props.categories.filter((category) => category.toLowerCase().includes(value))
})

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      keyword.value = ''
      selectedCategory.value = props.categories[0] ?? ''
    }
  },
)

function handleClose() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!selectedCategory.value) {
    return
  }

  emit('confirm', selectedCategory.value)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="选择分类"
    width="460px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="dialog-body">
      <el-input v-model="keyword" clearable placeholder="搜索分类名" />

      <el-radio-group v-model="selectedCategory" class="category-list">
        <el-radio v-for="category in filteredCategories" :key="category" :label="category" border>
          {{ category }}
        </el-radio>
      </el-radio-group>

      <el-empty v-if="filteredCategories.length === 0" description="暂无匹配分类" />
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="!selectedCategory" @click="handleConfirm">
        移动
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  max-height: 300px;
  overflow: auto;
}

.category-list :deep(.el-radio) {
  margin-right: 0;
}
</style>
