<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import CategoryCreateDialog from '@/components/category/CategoryCreateDialog.vue'
import CategorySelectDialog from '@/components/category/CategorySelectDialog.vue'
import ImportDialog from '@/components/import/ImportDialog.vue'
import BrowseToolbar from '@/components/layout/BrowseToolbar.vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import PhotoDetailPanel from '@/components/photo/PhotoDetailPanel.vue'
import PhotoGrid from '@/components/photo/PhotoGrid.vue'
import PhotoPreviewDialog from '@/components/photo/PhotoPreviewDialog.vue'
import PhotoRenameDialog from '@/components/photo/PhotoRenameDialog.vue'
import { useBrowsePhotoActions } from '@/composables/useBrowsePhotoActions'
import { usePhotoPreview } from '@/composables/usePhotoPreview'
import { usePhotoSelection } from '@/composables/usePhotoSelection'
import { useHistoryStore } from '@/stores/historyStore'
import { usePhotoStore } from '@/stores/photoStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { PhotoItem, PhotoViewKey } from '@/types/photo'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const photoStore = usePhotoStore()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()

const currentCategoryName = computed(() => {
  const view = photoStore.currentView

  if (!view.startsWith('category:')) {
    return ''
  }

  return view.replace('category:', '')
})

const isCategoryView = computed(() => {
  return Boolean(currentCategoryName.value)
})

const workspaceName = computed(() => {
  return workspaceStore.currentWorkspace?.name ?? '未选择工作区'
})

const currentViewTitle = computed(() => {
  const view = photoStore.currentView

  if (view === 'all') return '全部照片'
  if (view === 'unsorted') return '未分类'
  if (view === 'discarded') return '已废弃'
  if (view.startsWith('category:')) return view.replace('category:', '')

  return '照片'
})

const allPhotos = computed(() => photoStore.photos)
const filteredPhotos = computed(() => photoStore.filteredPhotos)

const {
  selectedPhotoIds,
  selectedPhotos,
  singleSelectedPhoto,
  selectedNormalPhotos,
  selectedCategoryPhotos,
  selectedDiscardedPhotos,
  clearSelection,
  setSingleSelection,
  handleSelectPhoto,
} = usePhotoSelection({
  photos: allPhotos,
  rangePhotos: filteredPhotos,
})

const {
  previewDialogVisible,
  previewPhoto,
  hasPreviousPreviewPhoto,
  hasNextPreviewPhoto,
  handlePreviewPhoto,
  showPreviousPreviewPhoto,
  showNextPreviewPhoto,
  closePreview,
} = usePhotoPreview({
  photos: filteredPhotos,
  setSingleSelection,
})

const {
  createCategoryDialogVisible,
  selectCategoryDialogVisible,
  renameDialogVisible,
  importDialogVisible,
  importing,
  selectedImportFileHandles,
  importMode,
  handleCreateCategory,
  openMoveToCategoryDialog,
  handleMoveSelectedPhotoToCategory,
  handleMoveSelectedPhotoToUnsorted,
  handleMoveSelectedPhotoToDiscarded,
  handleRestoreSelectedPhoto,
  handleDeleteCurrentCategory,
  openImportDialog,
  handleSelectImportFiles,
  handleStartImport,
  openRenameDialog,
  handleRenameSelectedPhoto,
  handleUndo,
} = useBrowsePhotoActions({
  workspaceStore,
  photoStore,
  historyStore,
  settingsStore,
  currentCategoryName,
  selectedPhotos,
  singleSelectedPhoto,
  selectedNormalPhotos,
  selectedCategoryPhotos,
  selectedDiscardedPhotos,
  clearSelection,
})

function applySettingsToPhotoStore() {
  photoStore.gridSize = settingsStore.settings.gridSize
  photoStore.sortBy = settingsStore.settings.sortBy
  photoStore.sortOrder = settingsStore.settings.sortOrder
}

watch(
  () => [photoStore.gridSize, photoStore.sortBy, photoStore.sortOrder] as const,
  async ([gridSize, sortBy, sortOrder]) => {
    await settingsStore.updateSettings({
      gridSize,
      sortBy,
      sortOrder,
    })
  },
)

function handleMenuSelect(view: PhotoViewKey) {
  photoStore.setCurrentView(view)
  clearSelection()
}

async function handleRefresh() {
  try {
    await photoStore.scanPhotos()
    clearSelection()
    ElMessage.success('刷新完成')
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('刷新失败')
  }
}

function goToClassify() {
  router.push('/classify')
}

function goToSettings() {
  router.push('/settings')
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

const uiLanguage = computed(() => {
  return settingsStore.settings.uiLanguage
})

function getPhotoStatusLabel(status: PhotoItem['parentType']): string {
  const statusMap = {
    zh: {
      unsorted: '未分类',
      category: '已分类',
      discarded: '已废弃',
    },
    en: {
      unsorted: 'Unsorted',
      category: 'Sorted',
      discarded: 'Discarded',
    },
  }

  return statusMap[uiLanguage.value][status]
}

function getDisplayPath(photo: PhotoItem): string {
  const workspace = workspaceStore.currentWorkspace

  if (!workspace) {
    return photo.relativePath
  }

  const sortedFolderName = workspace.language === 'zh' ? '已分类' : 'Sorted'

  if (photo.parentType === 'category' && photo.relativePath.startsWith(`${sortedFolderName}/`)) {
    return photo.relativePath.replace(`${sortedFolderName}/`, '')
  }

  return photo.relativePath
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()

  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable
}

async function handleBrowseKeydown(event: KeyboardEvent) {
  if (isTypingTarget(event.target)) {
    return
  }

  if (event.ctrlKey && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    await handleUndo()
  }
}

function handlePreviewMoveToCategory() {
  if (!previewPhoto.value) {
    return
  }

  setSingleSelection(previewPhoto.value)
  openMoveToCategoryDialog()
}

async function handlePreviewMoveToDiscarded() {
  if (!previewPhoto.value) {
    return
  }

  setSingleSelection(previewPhoto.value)
  await handleMoveSelectedPhotoToDiscarded()
  closePreview()
}

async function handlePreviewRestore() {
  if (!previewPhoto.value) {
    return
  }

  setSingleSelection(previewPhoto.value)
  await handleRestoreSelectedPhoto()
  closePreview()
}

onMounted(async () => {
  await settingsStore.loadSettings()
  applySettingsToPhotoStore()

  if (photoStore.photos.length === 0) {
    await handleRefresh()
  }

  window.addEventListener('keydown', handleBrowseKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleBrowseKeydown)
})
</script>

<template>
  <div class="page">
    <el-container class="layout" direction="vertical">
      <BrowseToolbar
        :workspace-name="workspaceName"
        :loading="photoStore.loading"
        :can-undo="historyStore.canUndo"
        :is-category-view="isCategoryView"
        @import="openImportDialog"
        @refresh="handleRefresh"
        @undo="handleUndo"
        @create-category="createCategoryDialogVisible = true"
        @delete-category="handleDeleteCurrentCategory"
        @go-to-classify="goToClassify"
        @go-to-settings="goToSettings"
      />

      <el-container class="content-layout">
        <SidebarNav
          :current-view="photoStore.currentView"
          :total-normal-photos="photoStore.totalNormalPhotos"
          :total-unsorted-photos="photoStore.totalUnsortedPhotos"
          :total-discarded-photos="photoStore.totalDiscardedPhotos"
          :category-names="photoStore.categoryNames"
          :category-photo-counts="photoStore.categoryPhotoCounts"
          @select-view="handleMenuSelect"
        />

        <el-main class="main">
          <div class="main-toolbar">
            <div class="main-title">
              {{ currentViewTitle }}
              <span class="photo-count"> {{ photoStore.filteredPhotos.length }} 张</span>
            </div>

            <div class="main-filters">
              <el-input
                v-model="photoStore.searchKeyword"
                clearable
                placeholder="搜索文件名"
                style="width: 220px"
              />

              <el-select v-model="photoStore.sortBy" style="width: 140px">
                <el-option label="文件名" value="name" />
                <el-option label="修改时间" value="modifiedTime" />
              </el-select>

              <el-select v-model="photoStore.sortOrder" style="width: 100px">
                <el-option label="升序" value="asc" />
                <el-option label="降序" value="desc" />
              </el-select>

              <el-select v-model="photoStore.gridSize" style="width: 100px">
                <el-option label="小" value="small" />
                <el-option label="中" value="medium" />
                <el-option label="大" value="large" />
              </el-select>
            </div>
          </div>

          <div v-loading="photoStore.loading" class="photo-content">
            <div v-if="photoStore.filteredPhotos.length > 0">
              <PhotoGrid
                :photos="photoStore.filteredPhotos"
                :grid-size="photoStore.gridSize"
                :selected-photo-ids="selectedPhotoIds"
                @select-photo="handleSelectPhoto"
                @preview-photo="handlePreviewPhoto"
              />
            </div>

            <el-empty v-else description="暂无图片" />
          </div>
        </el-main>

        <PhotoDetailPanel
          :selected-photos="selectedPhotos"
          :single-selected-photo="singleSelectedPhoto"
          :selected-normal-photos="selectedNormalPhotos"
          :selected-category-photos="selectedCategoryPhotos"
          :selected-discarded-photos="selectedDiscardedPhotos"
          :get-photo-status-label="getPhotoStatusLabel"
          :get-display-path="getDisplayPath"
          :format-file-size="formatFileSize"
          :format-time="formatTime"
          @move-to-category="openMoveToCategoryDialog"
          @move-to-unsorted="handleMoveSelectedPhotoToUnsorted"
          @move-to-discarded="handleMoveSelectedPhotoToDiscarded"
          @restore="handleRestoreSelectedPhoto"
          @rename="openRenameDialog"
          @clear-selection="clearSelection"
        />
      </el-container>
    </el-container>

    <CategoryCreateDialog v-model="createCategoryDialogVisible" @confirm="handleCreateCategory" />

    <CategorySelectDialog
      v-model="selectCategoryDialogVisible"
      :categories="photoStore.categoryNames"
      @confirm="handleMoveSelectedPhotoToCategory"
    />

    <ImportDialog
      v-model="importDialogVisible"
      v-model:import-mode="importMode"
      :selected-count="selectedImportFileHandles.length"
      :importing="importing"
      @select-files="handleSelectImportFiles"
      @start-import="handleStartImport"
    />

    <PhotoRenameDialog
      v-model="renameDialogVisible"
      :photo="singleSelectedPhoto"
      @confirm="handleRenameSelectedPhoto"
    />

    <PhotoPreviewDialog
      v-model="previewDialogVisible"
      :photo="previewPhoto"
      :has-previous="hasPreviousPreviewPhoto"
      :has-next="hasNextPreviewPhoto"
      @previous="showPreviousPreviewPhoto"
      @next="showNextPreviewPhoto"
      @move-to-category="handlePreviewMoveToCategory"
      @move-to-discarded="handlePreviewMoveToDiscarded"
      @restore="handlePreviewRestore"
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

.content-layout {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.main {
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  padding: 0;
}

.main-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.main-title {
  font-weight: 700;
  font-size: 18px;
}

.photo-count {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
  font-weight: 400;
}

.main-filters {
  display: flex;
  gap: 8px;
}

.photo-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

</style>
