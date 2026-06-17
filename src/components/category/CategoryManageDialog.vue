<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { deleteCategoryFolder, renameCategoryFolder } from '@/services/categoryService'
import { usePhotoStore } from '@/stores/photoStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { WorkspaceLanguage } from '@/types/workspace'
import { getFolderNames } from '@/utils/folderNames'

interface CategoryRow {
  name: string
  photoCount: number
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  changed: []
}>()

const photoStore = usePhotoStore()
const settingsStore = useSettingsStore()
const workspaceStore = useWorkspaceStore()
const selectedCategoryNames = ref<string[]>([])

const categoryRows = computed<CategoryRow[]>(() => {
  return photoStore.categoryNames.map((name) => ({
    name,
    photoCount: photoStore.categoryPhotoCounts[name] ?? 0,
  }))
})

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      selectedCategoryNames.value = []
    }
  },
)

function getCurrentWorkspaceOrThrow(): {
  rootHandle: FileSystemDirectoryHandle
  language: WorkspaceLanguage
} {
  const workspace = workspaceStore.currentWorkspace

  if (!workspace?.rootHandle) {
    throw new Error('请先选择工作区')
  }

  return {
    rootHandle: workspace.rootHandle as unknown as FileSystemDirectoryHandle,
    language: workspace.language,
  }
}

function handleCategorySelectionChange(rows: CategoryRow[]) {
  selectedCategoryNames.value = rows.map((row) => row.name)
}

async function removeCategoriesFromShortcutBindings(categoryNames: string[]) {
  const removingNames = new Set(categoryNames)
  const nextBindings = settingsStore.settings.classifyShortcutBindings.filter((binding) => {
    return !removingNames.has(binding.categoryName)
  })

  await settingsStore.setClassifyShortcutBindings(nextBindings)
}

async function renameCategoryInShortcutBindings(categoryName: string, nextCategoryName: string) {
  const nextBindings = settingsStore.settings.classifyShortcutBindings.map((binding) => {
    if (binding.categoryName !== categoryName) {
      return binding
    }

    return {
      ...binding,
      categoryName: nextCategoryName,
    }
  })

  await settingsStore.setClassifyShortcutBindings(nextBindings)
}

async function handleRenameCategory(categoryName: string) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的分类名', '重命名分类', {
      inputValue: categoryName,
      inputPlaceholder: '新的分类名',
      confirmButtonText: '确认重命名',
      cancelButtonText: '取消',
    })

    const nextCategoryName = value.trim()
    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)

    const result = await renameCategoryFolder({
      rootHandle: workspace.rootHandle,
      folderNames,
      categoryName,
      nextCategoryName,
      existingCategoryNames: photoStore.categoryNames,
    })

    await renameCategoryInShortcutBindings(categoryName, nextCategoryName)
    selectedCategoryNames.value = selectedCategoryNames.value.map((name) => {
      return name === categoryName ? nextCategoryName : name
    })

    if (photoStore.currentView === `category:${categoryName}`) {
      photoStore.setCurrentView(`category:${nextCategoryName}`)
    }

    await photoStore.scanPhotos({ generateThumbnails: false })
    emit('changed')

    ElMessage.success(`分类已重命名，${result.movedCount} 张图片已保留在新分类中`)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'cancel') {
        return
      }

      ElMessage.error(error.message)
      return
    }

    ElMessage.error('重命名分类失败')
  }
}

async function handleDeleteCategories(categoryNames: string[]) {
  if (categoryNames.length === 0) {
    ElMessage.warning('请先选择分类')
    return
  }

  const totalPhotoCount = categoryNames.reduce((count, categoryName) => {
    return count + (photoStore.categoryPhotoCounts[categoryName] ?? 0)
  }, 0)

  try {
    await ElMessageBox.confirm(
      `确定要删除 ${categoryNames.length} 个分类吗？\n\n这些分类中的 ${totalPhotoCount} 张图片会移动回“未分类”。\n图片不会被删除，分类删除本身暂不支持撤销。`,
      '删除分类',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)
    let movedCount = 0

    for (const categoryName of categoryNames) {
      const result = await deleteCategoryFolder({
        rootHandle: workspace.rootHandle,
        folderNames,
        categoryName,
      })

      movedCount += result.movedCount
    }

    await removeCategoriesFromShortcutBindings(categoryNames)

    if (
      photoStore.currentView.startsWith('category:') &&
      categoryNames.includes(photoStore.currentView.replace('category:', ''))
    ) {
      photoStore.setCurrentView('unsorted')
    }

    selectedCategoryNames.value = []
    await photoStore.scanPhotos({ generateThumbnails: false })
    emit('changed')

    ElMessage.success(`已删除 ${categoryNames.length} 个分类，${movedCount} 张图片已移回未分类`)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'cancel') {
        return
      }

      ElMessage.error(error.message)
      return
    }

    ElMessage.error('删除分类失败')
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="管理分类"
    width="720px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="dialog-body">
      <div class="dialog-toolbar">
        <div class="dialog-tip">
          重命名分类会移动原分类中的图片到新分类；删除分类会把图片移回“未分类”。
        </div>

        <el-button
          type="danger"
          plain
          :disabled="selectedCategoryNames.length === 0"
          @click="handleDeleteCategories(selectedCategoryNames)"
        >
          删除选中分类
        </el-button>
      </div>

      <el-table
        :data="categoryRows"
        empty-text="暂无分类"
        max-height="420"
        @selection-change="handleCategorySelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="name" label="分类名" min-width="220" />
        <el-table-column prop="photoCount" label="图片数" width="100" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }: { row: CategoryRow }">
            <el-button link type="primary" @click="handleRenameCategory(row.name)">
              重命名
            </el-button>
            <el-button link type="danger" @click="handleDeleteCategories([row.name])">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dialog-tip {
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}
</style>
