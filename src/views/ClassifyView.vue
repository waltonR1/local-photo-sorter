<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import ClassifyActionPanel from '@/components/category/ClassifyActionPanel.vue'
import CategoryCreateDialog from '@/components/category/CategoryCreateDialog.vue'
import CategorySelectDialog from '@/components/category/CategorySelectDialog.vue'
import PhotoRenameDialog from '@/components/photo/PhotoRenameDialog.vue'
import { useClassifyQueue } from '@/composables/useClassifyQueue'
import { useClassifyShortcuts } from '@/composables/useClassifyShortcuts'
import { createCategoryFolder, movePhotoToCategory } from '@/services/categoryService'
import { renamePhoto } from '@/services/renameService'
import { movePhotoToDiscarded } from '@/services/trashService'
import { useHistoryStore } from '@/stores/historyStore'
import { usePhotoStore } from '@/stores/photoStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { ShortcutCategory } from '@/types/category'
import type { WorkspaceLanguage } from '@/types/workspace'
import { buildClassifyShortcutBindings } from '@/utils/classifyShortcuts'
import { getFolderNames } from '@/utils/folderNames'

const router = useRouter()
const photoStore = usePhotoStore()
const workspaceStore = useWorkspaceStore()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()

const currentCategoryName = ref('')
const createCategoryDialogVisible = ref(false)
const selectCategoryDialogVisible = ref(false)
const handling = ref(false)
const renameDialogVisible = ref(false)

const allPhotos = computed(() => photoStore.photos)

async function goBackToBrowse() {
  await router.push('/browse')
}

async function confirmRestartSkipped(skippedCount: number): Promise<boolean> {
  try {
    await ElMessageBox.confirm(
      `本轮分类完成。\n\n还有 ${skippedCount} 张跳过的照片，是否重新处理？`,
      '分类完成',
      {
        confirmButtonText: '重新处理',
        cancelButtonText: '返回浏览',
        type: 'info',
      },
    )

    return true
  } catch {
    return false
  }
}

const {
  currentPhoto,
  progressText,
  normalizeCurrentIndex,
  handleSkipCurrentPhoto,
  handleQueueEndIfNeeded,
} = useClassifyQueue({
  photos: allPhotos,
  confirmRestartSkipped,
  onSkippedDeclined: goBackToBrowse,
  async onQueueComplete() {
    ElMessage.success('未分类照片已处理完成')
    await goBackToBrowse()
  },
})

const shortcutCategories = computed<ShortcutCategory[]>(() => {
  return buildClassifyShortcutBindings(photoStore.categoryNames, settingsStore.settings).map((binding) => {
    return {
      name: binding.categoryName,
      key: binding.key,
    }
  })
})

const hasMoreCategories = computed(() => {
  return photoStore.categoryNames.length > 10
})

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

function getCategoryByShortcutKey(key: string): string | null {
  const normalizedKey = key.toLowerCase()
  const item = shortcutCategories.value.find((category) => {
    return category.key.toLowerCase() === normalizedKey
  })

  return item?.name ?? null
}

function setCurrentCategory(categoryName: string) {
  currentCategoryName.value = categoryName
}

async function refreshAfterAction() {
  await photoStore.scanPhotos()
  normalizeCurrentIndex()
  await handleQueueEndIfNeeded()
}

async function handleCreateCategory(categoryName: string) {
  try {
    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)

    await createCategoryFolder({
      rootHandle: workspace.rootHandle,
      folderNames,
      categoryName,
      existingCategoryNames: photoStore.categoryNames,
    })

    createCategoryDialogVisible.value = false

    await photoStore.scanPhotos()

    currentCategoryName.value = categoryName.trim()

    ElMessage.success('分类创建成功')
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('创建分类失败')
  }
}

async function classifyCurrentPhotoTo(categoryName: string) {
  if (handling.value || !currentPhoto.value) {
    return
  }

  try {
    handling.value = true

    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)
    const photo = currentPhoto.value

    const toPath = await movePhotoToCategory({
      rootHandle: workspace.rootHandle,
      folderNames,
      photo,
      categoryName,
    })

    historyStore.pushMoveAction({
      fromPath: photo.relativePath,
      toPath,
    })

    await refreshAfterAction()
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('分类失败')
  } finally {
    handling.value = false
  }
}

async function classifyToCurrentCategory() {
  if (!currentCategoryName.value) {
    ElMessage.warning('请先选择或创建分类')
    return
  }

  await classifyCurrentPhotoTo(currentCategoryName.value)
}

async function handleMoveCurrentPhotoToDiscarded() {
  if (handling.value || !currentPhoto.value) {
    return
  }

  try {
    handling.value = true

    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)
    const photo = currentPhoto.value

    const toPath = await movePhotoToDiscarded({
      rootHandle: workspace.rootHandle,
      folderNames,
      photo,
    })

    historyStore.pushMoveAction({
      fromPath: photo.relativePath,
      toPath,
    })

    await refreshAfterAction()
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('移动到已废弃失败')
  } finally {
    handling.value = false
  }
}

function openOtherCategoryDialog() {
  if (photoStore.categoryNames.length === 0) {
    ElMessage.warning('请先创建分类')
    return
  }

  selectCategoryDialogVisible.value = true
}

async function handleSelectOtherCategory(categoryName: string) {
  selectCategoryDialogVisible.value = false
  currentCategoryName.value = categoryName

  await classifyCurrentPhotoTo(categoryName)
}

function handleRenameCurrentPhoto() {
  if (!currentPhoto.value) {
    return
  }

  renameDialogVisible.value = true
}

async function handleRenameConfirm(newName: string) {
  if (!currentPhoto.value) {
    return
  }

  try {
    const photo = currentPhoto.value

    const toPath = await renamePhoto({
      photo,
      newName,
    })

    historyStore.pushRenameAction({
      fromPath: photo.relativePath,
      toPath,
    })

    renameDialogVisible.value = false

    await photoStore.scanPhotos()

    ElMessage.success('重命名成功')
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('重命名失败')
  }
}

async function handleUndo() {
  if (!historyStore.canUndo) {
    ElMessage.info('没有可撤销的操作')
    return
  }

  try {
    const workspace = getCurrentWorkspaceOrThrow()

    const action = await historyStore.undoLastAction({
      rootHandle: workspace.rootHandle,
    })

    await photoStore.scanPhotos()
    normalizeCurrentIndex()

    if (action?.type === 'rename') {
      ElMessage.success('已撤销重命名')
    } else {
      ElMessage.success('已撤销上一步操作')
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(`撤销失败：${error.message}`)
      return
    }

    ElMessage.error('撤销失败')
  }
}

const { handleKeydown } = useClassifyShortcuts({
  isDisabled: () => {
    return (
      createCategoryDialogVisible.value ||
      selectCategoryDialogVisible.value ||
      renameDialogVisible.value
    )
  },
  getCategoryByShortcutKey,
  classifyToCategory: classifyCurrentPhotoTo,
  classifyToCurrentCategory,
  skip: handleSkipCurrentPhoto,
  discard: handleMoveCurrentPhotoToDiscarded,
  createCategory: () => {
    createCategoryDialogVisible.value = true
  },
  rename: handleRenameCurrentPhoto,
  undo: handleUndo,
  goBack: goBackToBrowse,
})

watch(
  () => photoStore.categoryNames,
  (categoryNames) => {
    if (!currentCategoryName.value && categoryNames.length > 0) {
      currentCategoryName.value = categoryNames[0] ?? ''
    }

    if (currentCategoryName.value && !categoryNames.includes(currentCategoryName.value)) {
      currentCategoryName.value = categoryNames[0] ?? ''
    }
  },
  {
    immediate: true,
  },
)

onMounted(async () => {
  await settingsStore.loadSettings()

  if (photoStore.photos.length === 0) {
    await photoStore.scanPhotos()
  }

  normalizeCurrentIndex()
  await handleQueueEndIfNeeded()

  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="page">
    <el-container class="layout" direction="vertical">
      <el-header class="header">
        <div>
          <div class="title">分类模式</div>
          <div class="progress">{{ progressText }}</div>
        </div>

        <div class="header-actions">
          <el-button :disabled="!historyStore.canUndo" @click="handleUndo"> 撤销 Ctrl+Z </el-button>

          <el-button type="primary" @click="goBackToBrowse"> 返回浏览 </el-button>
        </div>
      </el-header>

      <el-main class="main">
        <div v-loading="photoStore.loading || handling" class="photo-area">
          <template v-if="currentPhoto">
            <img
              class="current-photo"
              :src="currentPhoto.objectUrl"
              :alt="currentPhoto.name"
              draggable="false"
            />

            <div class="photo-name">
              {{ currentPhoto.name }}
            </div>
          </template>

          <el-empty v-else description="暂无待分类图片" />
        </div>

        <ClassifyActionPanel
          :current-category-name="currentCategoryName"
          :shortcut-categories="shortcutCategories"
          :has-more-categories="hasMoreCategories"
          :has-current-photo="Boolean(currentPhoto)"
          :category-names="photoStore.categoryNames"
          @select-category="setCurrentCategory"
          @classify-current="classifyToCurrentCategory"
          @classify-to-category="classifyCurrentPhotoTo"
          @open-other-category="openOtherCategoryDialog"
          @create-category="createCategoryDialogVisible = true"
          @skip="handleSkipCurrentPhoto"
          @discard="handleMoveCurrentPhotoToDiscarded"
          @rename="handleRenameCurrentPhoto"
        />
      </el-main>
    </el-container>

    <CategoryCreateDialog v-model="createCategoryDialogVisible" @confirm="handleCreateCategory" />

    <CategorySelectDialog
      v-model="selectCategoryDialogVisible"
      :categories="photoStore.categoryNames"
      @confirm="handleSelectOtherCategory"
    />

    <PhotoRenameDialog
      v-model="renameDialogVisible"
      :photo="currentPhoto"
      @confirm="handleRenameConfirm"
    />
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  overflow: hidden;
}

.layout {
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e7ed;
}

.title {
  font-weight: 700;
  font-size: 18px;
}

.progress {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.main {
  display: flex;
  flex-direction: column;
  padding: 0;
  background: #f5f7fa;
}

.photo-area {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 32px 24px 40px;
  overflow: hidden;
}

.current-photo {
  max-width: 100%;
  max-height: calc(100vh - 340px);
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 10%);
  background: #fff;
}

.photo-name {
  max-width: 80%;
  min-height: 24px;
  padding: 4px 12px;
  color: #606266;
  font-size: 14px;
  text-align: center;
  word-break: break-all;
}
</style>
