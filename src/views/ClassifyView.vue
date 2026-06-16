<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import CategoryCreateDialog from '@/components/category/CategoryCreateDialog.vue'
import CategorySelectDialog from '@/components/category/CategorySelectDialog.vue'
import { createCategoryFolder, movePhotoToCategory } from '@/services/categoryService'
import { movePhotoToDiscarded } from '@/services/trashService'
import { usePhotoStore } from '@/stores/photoStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { PhotoItem } from '@/types/photo'
import type { WorkspaceLanguage } from '@/types/workspace'
import { getFolderNames } from '@/utils/folderNames'
import PhotoRenameDialog from '@/components/photo/PhotoRenameDialog.vue'
import { renamePhoto } from '@/services/renameService'
import { useHistoryStore } from '@/stores/historyStore'

const router = useRouter()
const photoStore = usePhotoStore()
const workspaceStore = useWorkspaceStore()
const historyStore = useHistoryStore()

const currentIndex = ref(0)
const currentCategoryName = ref('')
const skippedPhotoIds = ref<Set<string>>(new Set())

const createCategoryDialogVisible = ref(false)
const selectCategoryDialogVisible = ref(false)
const handling = ref(false)
const renameDialogVisible = ref(false)

const allUnsortedPhotos = computed(() => {
  return photoStore.photos.filter((photo) => photo.parentType === 'unsorted')
})

const queuePhotos = computed(() => {
  return allUnsortedPhotos.value.filter((photo) => {
    return !skippedPhotoIds.value.has(photo.id)
  })
})

const currentPhoto = computed<PhotoItem | null>(() => {
  return queuePhotos.value[currentIndex.value] ?? null
})

const shortcutCategories = computed(() => {
  return photoStore.categoryNames.slice(0, 10).map((name, index) => {
    return {
      name,
      key: index === 9 ? '0' : String(index + 1),
    }
  })
})

const hasMoreCategories = computed(() => {
  return photoStore.categoryNames.length > 10
})

const progressText = computed(() => {
  const total = allUnsortedPhotos.value.length
  const current = Math.min(currentIndex.value + 1, queuePhotos.value.length)

  if (total === 0) {
    return '未分类：0 / 0'
  }

  return `未分类：${current} / ${queuePhotos.value.length}，跳过：${skippedPhotoIds.value.size}`
})

const currentCategoryLabel = computed(() => {
  return currentCategoryName.value || '暂无'
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

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()

  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable
}

function getCategoryByShortcutKey(key: string): string | null {
  const item = shortcutCategories.value.find((category) => {
    return category.key === key
  })

  return item?.name ?? null
}

function setCurrentCategory(categoryName: string) {
  currentCategoryName.value = categoryName
}

function normalizeCurrentIndex() {
  if (currentIndex.value < 0) {
    currentIndex.value = 0
  }

  if (currentIndex.value >= queuePhotos.value.length) {
    currentIndex.value = Math.max(queuePhotos.value.length - 1, 0)
  }
}

async function handleQueueEndIfNeeded() {
  await nextTick()
  normalizeCurrentIndex()

  if (queuePhotos.value.length > 0) {
    return
  }

  if (skippedPhotoIds.value.size > 0) {
    try {
      await ElMessageBox.confirm(
        `本轮分类完成。\n\n还有 ${skippedPhotoIds.value.size} 张跳过的照片，是否重新处理？`,
        '分类完成',
        {
          confirmButtonText: '重新处理',
          cancelButtonText: '返回浏览',
          type: 'info',
        },
      )

      skippedPhotoIds.value = new Set()
      currentIndex.value = 0

      return
    } catch {
      await router.push('/browse')
      return
    }
  }

  ElMessage.success('未分类照片已处理完成')
  await router.push('/browse')
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
  if (handling.value) {
    return
  }

  if (!currentPhoto.value) {
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
  if (handling.value) {
    return
  }

  if (!currentPhoto.value) {
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

async function handleSkipCurrentPhoto() {
  if (!currentPhoto.value) {
    return
  }

  const nextSkipped = new Set(skippedPhotoIds.value)
  nextSkipped.add(currentPhoto.value.id)
  skippedPhotoIds.value = nextSkipped

  normalizeCurrentIndex()
  await handleQueueEndIfNeeded()
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

async function goBackToBrowse() {
  await router.push('/browse')
}

async function handleKeydown(event: KeyboardEvent) {
  if (isTypingTarget(event.target)) {
    return
  }

  if (
    createCategoryDialogVisible.value ||
    selectCategoryDialogVisible.value ||
    renameDialogVisible.value
  ) {
    return
  }

  if (event.ctrlKey && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    handleUndo()
    return
  }

  const shortcutCategory = getCategoryByShortcutKey(event.key)

  if (shortcutCategory) {
    event.preventDefault()
    await classifyCurrentPhotoTo(shortcutCategory)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    await classifyToCurrentCategory()
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    await handleSkipCurrentPhoto()
    return
  }

  if (event.key === 'Delete') {
    event.preventDefault()
    await handleMoveCurrentPhotoToDiscarded()
    return
  }

  if (event.key.toLowerCase() === 'n') {
    event.preventDefault()
    createCategoryDialogVisible.value = true
    return
  }

  if (event.key.toLowerCase() === 'r') {
    event.preventDefault()
    handleRenameCurrentPhoto()
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    await goBackToBrowse()
  }
}

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
    <el-container class="layout">
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

        <div class="classify-actions">
          <div class="current-category">当前分类：{{ currentCategoryLabel }}</div>

          <template v-if="photoStore.categoryNames.length === 0">
            <div class="empty-category-tip">暂无分类，请先创建分类。</div>

            <div class="category-buttons">
              <el-button type="primary" @click="createCategoryDialogVisible = true">
                + 新分类 N
              </el-button>

              <el-button :disabled="!currentPhoto" @click="handleSkipCurrentPhoto">
                跳过 Space
              </el-button>

              <el-button
                type="danger"
                plain
                :disabled="!currentPhoto"
                @click="handleMoveCurrentPhotoToDiscarded"
              >
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
                @click="setCurrentCategory(category.name)"
                @dblclick="classifyCurrentPhotoTo(category.name)"
              >
                {{ category.key }} {{ category.name }}
              </el-button>

              <el-button v-if="hasMoreCategories" @click="openOtherCategoryDialog">
                选择其他分类
              </el-button>

              <el-button type="primary" plain @click="createCategoryDialogVisible = true">
                + 新分类 N
              </el-button>
            </div>

            <div class="main-actions">
              <el-button
                type="primary"
                :disabled="!currentPhoto || !currentCategoryName"
                @click="classifyToCurrentCategory"
              >
                Enter 放入当前分类
              </el-button>

              <el-button :disabled="!currentPhoto" @click="handleSkipCurrentPhoto">
                Space 跳过
              </el-button>

              <el-button
                type="danger"
                plain
                :disabled="!currentPhoto"
                @click="handleMoveCurrentPhotoToDiscarded"
              >
                Delete 废弃
              </el-button>

              <el-button :disabled="!currentPhoto" @click="handleRenameCurrentPhoto">
                R 重命名
              </el-button>
            </div>
          </template>
        </div>
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
