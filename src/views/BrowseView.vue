<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import { useWorkspaceStore } from '@/stores/workspaceStore'
import { usePhotoStore } from '@/stores/photoStore'
import type { PhotoItem, PhotoViewKey } from '@/types/photo'
import PhotoGrid from '@/components/photo/PhotoGrid.vue'
import CategoryCreateDialog from '@/components/category/CategoryCreateDialog.vue'
import CategorySelectDialog from '@/components/category/CategorySelectDialog.vue'
import {
  createCategoryFolder,
  deleteCategoryFolder,
  movePhotoToCategory,
} from '@/services/categoryService'
import { getFolderNames } from '@/utils/folderNames'
import type { WorkspaceLanguage } from '@/types/workspace'
import { movePhotoToDiscarded, restorePhotoFromDiscarded } from '@/services/trashService'
import ImportDialog from '@/components/import/ImportDialog.vue'
import { importFilesToUnsorted, selectImportImageFiles } from '@/services/importService'
import PhotoRenameDialog from '@/components/photo/PhotoRenameDialog.vue'
import { renamePhoto } from '@/services/renameService'
import { useHistoryStore } from '@/stores/historyStore'
import PhotoPreviewDialog from '@/components/photo/PhotoPreviewDialog.vue'
import { useSettingsStore } from '@/stores/settingsStore'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const photoStore = usePhotoStore()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()

const createCategoryDialogVisible = ref(false)
const selectCategoryDialogVisible = ref(false)
const selectedPhotoIds = ref<Set<string>>(new Set())
const lastSelectedPhotoId = ref<string | null>(null)
const renameDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const previewPhotoId = ref<string | null>(null)

const importDialogVisible = ref(false)
const importing = ref(false)
const selectedImportFileHandles = ref<FileSystemFileHandle[]>([])
const importMode = ref<'copy' | 'move'>('copy')

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

const PAGE_SIZE = 40
const visibleLimit = ref(PAGE_SIZE)

const visiblePhotos = computed(() => {
  return photoStore.filteredPhotos.slice(0, visibleLimit.value)
})

const previewPhoto = computed<PhotoItem | null>(() => {
  if (!previewPhotoId.value) {
    return null
  }

  return photoStore.filteredPhotos.find((photo) => photo.id === previewPhotoId.value) ?? null
})

const previewPhotoIndex = computed(() => {
  if (!previewPhotoId.value) {
    return -1
  }

  return photoStore.filteredPhotos.findIndex((photo) => photo.id === previewPhotoId.value)
})

const hasPreviousPreviewPhoto = computed(() => {
  return previewPhotoIndex.value > 0
})

const hasNextPreviewPhoto = computed(() => {
  return (
    previewPhotoIndex.value >= 0 && previewPhotoIndex.value < photoStore.filteredPhotos.length - 1
  )
})

const selectedPhotos = computed(() => {
  return photoStore.photos.filter((photo) => selectedPhotoIds.value.has(photo.id))
})

const singleSelectedPhoto = computed<PhotoItem | null>(() => {
  if (selectedPhotos.value.length !== 1) {
    return null
  }

  return selectedPhotos.value[0] ?? null
})

const selectedNormalPhotos = computed(() => {
  return selectedPhotos.value.filter((photo) => photo.parentType !== 'discarded')
})

const selectedDiscardedPhotos = computed(() => {
  return selectedPhotos.value.filter((photo) => photo.parentType === 'discarded')
})

function applySettingsToPhotoStore() {
  photoStore.gridSize = settingsStore.settings.gridSize
  photoStore.sortBy = settingsStore.settings.sortBy
  photoStore.sortOrder = settingsStore.settings.sortOrder
}

function clearSelection() {
  selectedPhotoIds.value = new Set()
  lastSelectedPhotoId.value = null
}

function setSingleSelection(photo: PhotoItem) {
  selectedPhotoIds.value = new Set([photo.id])
  lastSelectedPhotoId.value = photo.id
}

function toggleSelection(photo: PhotoItem) {
  const next = new Set(selectedPhotoIds.value)

  if (next.has(photo.id)) {
    next.delete(photo.id)
  } else {
    next.add(photo.id)
  }

  selectedPhotoIds.value = next
  lastSelectedPhotoId.value = photo.id
}

function selectRange(photo: PhotoItem) {
  if (!lastSelectedPhotoId.value) {
    setSingleSelection(photo)
    return
  }

  const list = visiblePhotos.value
  const startIndex = list.findIndex((item) => item.id === lastSelectedPhotoId.value)
  const endIndex = list.findIndex((item) => item.id === photo.id)

  if (startIndex === -1 || endIndex === -1) {
    setSingleSelection(photo)
    return
  }

  const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]

  const next = new Set(selectedPhotoIds.value)

  for (const item of list.slice(start, end + 1)) {
    next.add(item.id)
  }

  selectedPhotoIds.value = next
}

function handleSelectPhoto(photo: PhotoItem, event: MouseEvent) {
  if (event.shiftKey) {
    selectRange(photo)
    return
  }

  if (event.ctrlKey || event.metaKey) {
    toggleSelection(photo)
    return
  }

  setSingleSelection(photo)
}

const hasMorePhotos = computed(() => {
  return visibleLimit.value < photoStore.filteredPhotos.length
})

function loadMorePhotos() {
  visibleLimit.value += PAGE_SIZE
}

function resetVisibleLimit() {
  visibleLimit.value = PAGE_SIZE
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

watch(
  () => [
    photoStore.currentView,
    photoStore.searchKeyword,
    photoStore.sortBy,
    photoStore.sortOrder,
    photoStore.gridSize,
  ],
  () => {
    resetVisibleLimit()
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
    ElMessage.success('分类创建成功')
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('创建分类失败')
  }
}

function openMoveToCategoryDialog() {
  if (selectedPhotos.value.length === 0) {
    ElMessage.warning('请先选择图片')
    return
  }

  if (selectedNormalPhotos.value.length === 0) {
    ElMessage.warning('已废弃图片不能直接移动到分类，请先恢复')
    return
  }

  if (photoStore.categoryNames.length === 0) {
    ElMessage.warning('请先创建分类')
    return
  }

  selectCategoryDialogVisible.value = true
}

async function handleMoveSelectedPhotoToCategory(categoryName: string) {
  const photosToMove = selectedNormalPhotos.value.filter((photo) => {
    return !(photo.parentType === 'category' && photo.categoryName === categoryName)
  })

  if (photosToMove.length === 0) {
    ElMessage.warning('选中的图片已经在当前分类中')
    return
  }

  try {
    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)

    for (const photo of photosToMove) {
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
    }

    selectCategoryDialogVisible.value = false
    clearSelection()

    await photoStore.scanPhotos()

    ElMessage.success(`已移动 ${photosToMove.length} 张图片到分类`)
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('移动失败')
  }
}

function handleMenuSelect(index: string) {
  photoStore.setCurrentView(index as PhotoViewKey)
  clearSelection()
}

async function handleRefresh() {
  try {
    await photoStore.scanPhotos()
    resetVisibleLimit()
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

function handlePreviewPhoto(photo: PhotoItem) {
  setSingleSelection(photo)
  previewPhotoId.value = photo.id
  previewDialogVisible.value = true
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

async function handleMoveSelectedPhotoToDiscarded() {
  const photosToMove = selectedNormalPhotos.value

  if (photosToMove.length === 0) {
    ElMessage.warning('请选择未废弃的图片')
    return
  }

  try {
    if (photosToMove.length > 1) {
      await ElMessageBox.confirm(
        `确定要将选中的 ${photosToMove.length} 张图片移动到已废弃吗？`,
        '批量废弃',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    }

    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)

    for (const photo of photosToMove) {
      const toPath = await movePhotoToDiscarded({
        rootHandle: workspace.rootHandle,
        folderNames,
        photo,
      })

      historyStore.pushMoveAction({
        fromPath: photo.relativePath,
        toPath,
      })
    }

    clearSelection()

    await photoStore.scanPhotos()

    ElMessage.success(`已移动 ${photosToMove.length} 张图片到已废弃`)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'cancel') {
        return
      }

      ElMessage.error(error.message)
      return
    }

    ElMessage.error('移动到已废弃失败')
  }
}

async function handleRestoreSelectedPhoto() {
  const photosToRestore = selectedDiscardedPhotos.value

  if (photosToRestore.length === 0) {
    ElMessage.warning('请选择已废弃图片')
    return
  }

  try {
    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)

    for (const photo of photosToRestore) {
      const toPath = await restorePhotoFromDiscarded({
        rootHandle: workspace.rootHandle,
        folderNames,
        photo,
      })

      historyStore.pushMoveAction({
        fromPath: photo.relativePath,
        toPath,
      })
    }

    clearSelection()

    await photoStore.scanPhotos()

    ElMessage.success(`已恢复 ${photosToRestore.length} 张图片`)
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('恢复失败')
  }
}

async function handleDeleteCurrentCategory() {
  const categoryName = currentCategoryName.value

  if (!categoryName) {
    return
  }

  const count = photoStore.categoryPhotoCounts[categoryName] ?? 0

  try {
    await ElMessageBox.confirm(
      `确定要删除分类「${categoryName}」吗？\n\n该分类中的 ${count} 张图片会移动回「未分类」。\n图片不会被删除。\n\n注意：删除分类本身暂不支持撤销。`,
      '删除分类',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)

    const result = await deleteCategoryFolder({
      rootHandle: workspace.rootHandle,
      folderNames,
      categoryName,
    })

    clearSelection()
    photoStore.setCurrentView('unsorted')

    await photoStore.scanPhotos()

    ElMessage.success(`分类已删除，${result.movedCount} 张图片已移动回未分类`)
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

function openImportDialog() {
  selectedImportFileHandles.value = []

  // 当前版本只实际支持复制导入。
  // 如果设置中是 move，也先降级为 copy，避免误导用户。
  importMode.value =
    settingsStore.settings.defaultImportMode === 'move'
      ? 'copy'
      : settingsStore.settings.defaultImportMode

  importDialogVisible.value = true
}

async function handleSelectImportFiles() {
  try {
    const fileHandles = await selectImportImageFiles()
    selectedImportFileHandles.value = fileHandles

    if (fileHandles.length === 0) {
      ElMessage.warning('没有选择支持的图片文件')
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return
      }

      ElMessage.error(error.message)
      return
    }

    ElMessage.error('选择图片失败')
  }
}

async function handleStartImport() {
  if (selectedImportFileHandles.value.length === 0) {
    ElMessage.warning('请先选择图片')
    return
  }

  if (importMode.value === 'move') {
    ElMessage.warning('当前版本暂不支持移动导入，请使用复制导入')
    return
  }

  try {
    importing.value = true

    const workspace = getCurrentWorkspaceOrThrow()
    const folderNames = getFolderNames(workspace.language)

    const result = await importFilesToUnsorted({
      rootHandle: workspace.rootHandle,
      folderNames,
      fileHandles: selectedImportFileHandles.value,
    })

    importDialogVisible.value = false
    selectedImportFileHandles.value = []

    await photoStore.scanPhotos()
    photoStore.setCurrentView('unsorted')
    resetVisibleLimit()
    clearSelection()

    ElMessage.success(`导入完成，共导入 ${result.importedCount} 张图片`)
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

function openRenameDialog() {
  if (!singleSelectedPhoto.value) {
    ElMessage.warning('请先选择一张图片')
    return
  }

  renameDialogVisible.value = true
}

async function handleRenameSelectedPhoto(newName: string) {
  if (!singleSelectedPhoto.value) {
    return
  }

  try {
    const toPath = await renamePhoto({
      photo: singleSelectedPhoto.value,
      newName,
    })

    historyStore.pushRenameAction({
      fromPath: singleSelectedPhoto.value.relativePath,
      toPath,
    })

    renameDialogVisible.value = false
    clearSelection()

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

    clearSelection()
    await photoStore.scanPhotos()

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

function showPreviousPreviewPhoto() {
  const index = previewPhotoIndex.value

  if (index <= 0) {
    return
  }

  const previousPhoto = photoStore.filteredPhotos[index - 1]

  if (!previousPhoto) {
    return
  }

  previewPhotoId.value = previousPhoto.id
  setSingleSelection(previousPhoto)
}

function showNextPreviewPhoto() {
  const index = previewPhotoIndex.value

  if (index < 0 || index >= photoStore.filteredPhotos.length - 1) {
    return
  }

  const nextPhoto = photoStore.filteredPhotos[index + 1]

  if (!nextPhoto) {
    return
  }

  previewPhotoId.value = nextPhoto.id
  setSingleSelection(nextPhoto)
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
  previewDialogVisible.value = false
  previewPhotoId.value = null
}

async function handlePreviewRestore() {
  if (!previewPhoto.value) {
    return
  }

  setSingleSelection(previewPhoto.value)
  await handleRestoreSelectedPhoto()
  previewDialogVisible.value = false
  previewPhotoId.value = null
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
    <el-container class="layout">
      <el-header class="header">
        <div>
          <div class="title">Local Photo Sorter</div>
          <div class="workspace-name">当前工作区：{{ workspaceName }}</div>
        </div>

        <div class="actions">
          <el-button @click="openImportDialog"> 导入 </el-button>

          <el-button :loading="photoStore.loading" @click="handleRefresh"> 刷新 </el-button>

          <el-button :disabled="!historyStore.canUndo" @click="handleUndo"> 撤销 Ctrl+Z </el-button>

          <el-button @click="createCategoryDialogVisible = true"> 新建分类 </el-button>

          <el-button v-if="isCategoryView" type="danger" plain @click="handleDeleteCurrentCategory">
            删除分类
          </el-button>

          <el-button type="primary" @click="goToClassify"> 进入分类模式 </el-button>

          <el-button @click="goToSettings">设置</el-button>
        </div>
      </el-header>

      <el-container>
        <el-aside width="220px" class="sidebar">
          <el-menu :default-active="photoStore.currentView" @select="handleMenuSelect">
            <el-menu-item index="all">
              全部照片
              <span class="menu-count">{{ photoStore.totalNormalPhotos }}</span>
            </el-menu-item>

            <el-menu-item index="unsorted">
              未分类
              <span class="menu-count">{{ photoStore.totalUnsortedPhotos }}</span>
            </el-menu-item>

            <el-sub-menu index="categories">
              <template #title>已分类</template>

              <el-menu-item
                v-for="categoryName in photoStore.categoryNames"
                :key="categoryName"
                :index="`category:${categoryName}`"
              >
                {{ categoryName }}
                <span class="menu-count">
                  {{ photoStore.categoryPhotoCounts[categoryName] ?? 0 }}
                </span>
              </el-menu-item>

              <el-menu-item
                v-if="photoStore.categoryNames.length === 0"
                index="category-empty"
                disabled
              >
                暂无分类
              </el-menu-item>
            </el-sub-menu>

            <el-menu-item index="discarded">
              已废弃
              <span class="menu-count">{{ photoStore.totalDiscardedPhotos }}</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main class="main">
          <div class="main-toolbar">
            <div class="main-title">
              {{ currentViewTitle }}
              <span class="photo-count"> {{ photoStore.filteredPhotos.length }} 张 </span>
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
                :photos="visiblePhotos"
                :grid-size="photoStore.gridSize"
                :selected-photo-ids="selectedPhotoIds"
                @select-photo="handleSelectPhoto"
                @preview-photo="handlePreviewPhoto"
              />

              <div v-if="hasMorePhotos" class="load-more">
                <el-button @click="loadMorePhotos">
                  加载更多
                  {{ visiblePhotos.length }} / {{ photoStore.filteredPhotos.length }}
                </el-button>
              </div>
            </div>

            <el-empty v-else description="暂无图片" />
          </div>
        </el-main>

        <el-aside width="280px" class="right-panel">
          <template v-if="selectedPhotos.length > 1">
            <h3>批量操作</h3>

            <p class="empty-detail">已选择 {{ selectedPhotos.length }} 张图片</p>

            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="未废弃">
                {{ selectedNormalPhotos.length }} 张
              </el-descriptions-item>

              <el-descriptions-item label="已废弃">
                {{ selectedDiscardedPhotos.length }} 张
              </el-descriptions-item>
            </el-descriptions>

            <div class="detail-actions">
              <el-button
                type="primary"
                :disabled="selectedNormalPhotos.length === 0"
                @click="openMoveToCategoryDialog"
              >
                批量移动到分类
              </el-button>

              <el-button
                type="danger"
                plain
                :disabled="selectedNormalPhotos.length === 0"
                @click="handleMoveSelectedPhotoToDiscarded"
              >
                批量移动到已废弃
              </el-button>

              <el-button
                type="success"
                :disabled="selectedDiscardedPhotos.length === 0"
                @click="handleRestoreSelectedPhoto"
              >
                批量恢复
              </el-button>

              <el-button @click="clearSelection"> 取消选择 </el-button>
            </div>
          </template>

          <template v-else-if="singleSelectedPhoto">
            <h3>详情</h3>

            <div class="detail-preview">
              <img :src="singleSelectedPhoto.objectUrl" :alt="singleSelectedPhoto.name" />
            </div>

            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="文件名">
                {{ singleSelectedPhoto.name }}
              </el-descriptions-item>

              <el-descriptions-item label="路径">
                {{ getDisplayPath(singleSelectedPhoto) }}
              </el-descriptions-item>

              <el-descriptions-item label="大小">
                {{ formatFileSize(singleSelectedPhoto.size) }}
              </el-descriptions-item>

              <el-descriptions-item label="修改时间">
                {{ formatTime(singleSelectedPhoto.lastModified) }}
              </el-descriptions-item>

              <el-descriptions-item label="状态">
                {{ getPhotoStatusLabel(singleSelectedPhoto.parentType) }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="detail-actions">
              <template v-if="singleSelectedPhoto.parentType !== 'discarded'">
                <el-button type="primary" @click="openMoveToCategoryDialog"> 移动到分类 </el-button>

                <el-button type="danger" plain @click="handleMoveSelectedPhotoToDiscarded">
                  移动到已废弃
                </el-button>
              </template>

              <template v-else>
                <el-button type="success" @click="handleRestoreSelectedPhoto">
                  恢复到原位置
                </el-button>
              </template>

              <el-button @click="openRenameDialog"> 重命名 </el-button>

              <el-button @click="clearSelection"> 取消选择 </el-button>
            </div>
          </template>

          <template v-else>
            <h3>详情</h3>
            <p class="empty-detail">请选择图片</p>
          </template>
        </el-aside>
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

.workspace-name {
  margin-top: 2px;
  color: #909399;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 8px;
}

.sidebar {
  border-right: 1px solid #e4e7ed;
  background: #fff;
}

.menu-count {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
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

.right-panel {
  border-left: 1px solid #e4e7ed;
  padding: 16px;
  background: #fff;
  overflow: auto;
}

.empty-detail {
  color: #909399;
}

.detail-preview {
  width: 100%;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f2f5;
}

.detail-preview img {
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: contain;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 24px 0 8px;
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
</style>
