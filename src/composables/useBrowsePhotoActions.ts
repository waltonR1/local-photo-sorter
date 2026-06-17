import { ref, type ComputedRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { createCategoryFolder, deleteCategoryFolder, movePhotoToCategory } from '@/services/categoryService'
import { importFilesToUnsorted, selectImportImageFiles } from '@/services/importService'
import { renamePhoto } from '@/services/renameService'
import { movePhotoToDiscarded, restorePhotoFromDiscarded } from '@/services/trashService'
import type { useHistoryStore } from '@/stores/historyStore'
import type { usePhotoStore } from '@/stores/photoStore'
import type { useSettingsStore } from '@/stores/settingsStore'
import type { useWorkspaceStore } from '@/stores/workspaceStore'
import type { PhotoItem } from '@/types/photo'
import type { WorkspaceLanguage } from '@/types/workspace'
import { getFolderNames } from '@/utils/folderNames'

interface UseBrowsePhotoActionsOptions {
  workspaceStore: ReturnType<typeof useWorkspaceStore>
  photoStore: ReturnType<typeof usePhotoStore>
  historyStore: ReturnType<typeof useHistoryStore>
  settingsStore: ReturnType<typeof useSettingsStore>
  currentCategoryName: ComputedRef<string>
  selectedPhotos: ComputedRef<PhotoItem[]>
  singleSelectedPhoto: ComputedRef<PhotoItem | null>
  selectedNormalPhotos: ComputedRef<PhotoItem[]>
  selectedDiscardedPhotos: ComputedRef<PhotoItem[]>
  clearSelection: () => void
  resetVisibleLimit: () => void
}

export function useBrowsePhotoActions(options: UseBrowsePhotoActionsOptions) {
  const createCategoryDialogVisible = ref(false)
  const selectCategoryDialogVisible = ref(false)
  const renameDialogVisible = ref(false)
  const importDialogVisible = ref(false)
  const importing = ref(false)
  const selectedImportFileHandles = ref<FileSystemFileHandle[]>([])
  const importMode = ref<'copy' | 'move'>('copy')

  function getCurrentWorkspaceOrThrow(): {
    rootHandle: FileSystemDirectoryHandle
    language: WorkspaceLanguage
  } {
    const workspace = options.workspaceStore.currentWorkspace

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
        existingCategoryNames: options.photoStore.categoryNames,
      })

      createCategoryDialogVisible.value = false

      await options.photoStore.scanPhotos()
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
    if (options.selectedPhotos.value.length === 0) {
      ElMessage.warning('请先选择图片')
      return
    }

    if (options.selectedNormalPhotos.value.length === 0) {
      ElMessage.warning('已废弃图片不能直接移动到分类，请先恢复')
      return
    }

    if (options.photoStore.categoryNames.length === 0) {
      ElMessage.warning('请先创建分类')
      return
    }

    selectCategoryDialogVisible.value = true
  }

  async function handleMoveSelectedPhotoToCategory(categoryName: string) {
    const photosToMove = options.selectedNormalPhotos.value.filter((photo) => {
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

        options.historyStore.pushMoveAction({
          fromPath: photo.relativePath,
          toPath,
        })
      }

      selectCategoryDialogVisible.value = false
      options.clearSelection()

      await options.photoStore.scanPhotos()

      ElMessage.success(`已移动 ${photosToMove.length} 张图片到分类`)
    } catch (error) {
      if (error instanceof Error) {
        ElMessage.error(error.message)
        return
      }

      ElMessage.error('移动失败')
    }
  }

  async function handleMoveSelectedPhotoToDiscarded() {
    const photosToMove = options.selectedNormalPhotos.value

    if (photosToMove.length === 0) {
      ElMessage.warning('请选择未废弃的图片')
      return
    }

    try {
      if (photosToMove.length > 1) {
        await ElMessageBox.confirm(`确定要将选中的 ${photosToMove.length} 张图片移动到已废弃吗？`, '批量废弃', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        })
      }

      const workspace = getCurrentWorkspaceOrThrow()
      const folderNames = getFolderNames(workspace.language)

      for (const photo of photosToMove) {
        const toPath = await movePhotoToDiscarded({
          rootHandle: workspace.rootHandle,
          folderNames,
          photo,
        })

        options.historyStore.pushMoveAction({
          fromPath: photo.relativePath,
          toPath,
        })
      }

      options.clearSelection()

      await options.photoStore.scanPhotos()

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
    const photosToRestore = options.selectedDiscardedPhotos.value

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

        options.historyStore.pushMoveAction({
          fromPath: photo.relativePath,
          toPath,
        })
      }

      options.clearSelection()

      await options.photoStore.scanPhotos()

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
    const categoryName = options.currentCategoryName.value

    if (!categoryName) {
      return
    }

    const count = options.photoStore.categoryPhotoCounts[categoryName] ?? 0

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

      options.clearSelection()
      options.photoStore.setCurrentView('unsorted')

      await options.photoStore.scanPhotos()

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
    importMode.value =
      options.settingsStore.settings.defaultImportMode === 'move'
        ? 'copy'
        : options.settingsStore.settings.defaultImportMode

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

      await options.photoStore.scanPhotos()
      options.photoStore.setCurrentView('unsorted')
      options.resetVisibleLimit()
      options.clearSelection()

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
    if (!options.singleSelectedPhoto.value) {
      ElMessage.warning('请先选择一张图片')
      return
    }

    renameDialogVisible.value = true
  }

  async function handleRenameSelectedPhoto(newName: string) {
    if (!options.singleSelectedPhoto.value) {
      return
    }

    try {
      const toPath = await renamePhoto({
        photo: options.singleSelectedPhoto.value,
        newName,
      })

      options.historyStore.pushRenameAction({
        fromPath: options.singleSelectedPhoto.value.relativePath,
        toPath,
      })

      renameDialogVisible.value = false
      options.clearSelection()

      await options.photoStore.scanPhotos()

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
    if (!options.historyStore.canUndo) {
      ElMessage.info('没有可撤销的操作')
      return
    }

    try {
      const workspace = getCurrentWorkspaceOrThrow()

      const action = await options.historyStore.undoLastAction({
        rootHandle: workspace.rootHandle,
      })

      options.clearSelection()
      await options.photoStore.scanPhotos()

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

  return {
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
    handleMoveSelectedPhotoToDiscarded,
    handleRestoreSelectedPhoto,
    handleDeleteCurrentCategory,
    openImportDialog,
    handleSelectImportFiles,
    handleStartImport,
    openRenameDialog,
    handleRenameSelectedPhoto,
    handleUndo,
  }
}
