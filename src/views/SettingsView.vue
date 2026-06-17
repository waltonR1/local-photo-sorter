<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import { useHistoryStore } from '@/stores/historyStore'
import { usePhotoStore } from '@/stores/photoStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type {
  ClassifyShortcutBinding,
  GridSize,
  ImportMode,
  SortBy,
  SortOrder,
} from '@/types/settings'
import type { WorkspaceLanguage } from '@/types/workspace'
import {
  buildClassifyShortcutBindings,
  isReservedClassifyShortcutKey,
} from '@/utils/classifyShortcuts'

const router = useRouter()
const settingsStore = useSettingsStore()
const workspaceStore = useWorkspaceStore()
const photoStore = usePhotoStore()
const historyStore = useHistoryStore()
const listeningShortcutIndex = ref<number | null>(null)

const uiLanguage = computed({
  get: () => settingsStore.settings.uiLanguage,
  set: (value: WorkspaceLanguage) => {
    settingsStore.setUiLanguage(value)
  },
})

const gridSize = computed({
  get: () => settingsStore.settings.gridSize,
  set: (value: GridSize) => {
    settingsStore.setGridSize(value)
  },
})

const sortBy = computed({
  get: () => settingsStore.settings.sortBy,
  set: (value: SortBy) => {
    settingsStore.setSortBy(value)
  },
})

const sortOrder = computed({
  get: () => settingsStore.settings.sortOrder,
  set: (value: SortOrder) => {
    settingsStore.setSortOrder(value)
  },
})

const defaultImportMode = computed({
  get: () => settingsStore.settings.defaultImportMode,
  set: (value: ImportMode) => {
    settingsStore.setDefaultImportMode(value)
  },
})

const shortcutBindings = computed(() => {
  return buildClassifyShortcutBindings(photoStore.categoryNames, settingsStore.settings)
})

function getAvailableCategoryNames(bindingIndex: number): string[] {
  const selectedNames = new Set(
    shortcutBindings.value
      .filter((_binding, index) => index !== bindingIndex)
      .map((binding) => binding.categoryName),
  )

  return photoStore.categoryNames.filter((categoryName) => {
    return !selectedNames.has(categoryName)
  })
}

async function saveShortcutBindings(bindings: ClassifyShortcutBinding[]) {
  try {
    await settingsStore.setClassifyShortcutBindings(bindings)
    showSavedMessage()
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
      return
    }

    ElMessage.error('保存快捷键设置失败')
  }
}

async function handleUpdateBindingCategory(index: number, categoryName: string) {
  const nextBindings = shortcutBindings.value.map((binding) => ({ ...binding }))
  const currentBinding = nextBindings[index]

  if (!currentBinding) {
    return
  }

  if (
    nextBindings.some((binding, bindingIndex) => {
      return bindingIndex !== index && binding.categoryName === categoryName
    })
  ) {
    ElMessage.warning('该分类已经绑定了快捷键')
    return
  }

  currentBinding.categoryName = categoryName
  await saveShortcutBindings(nextBindings)
}

function startListeningShortcut(index: number) {
  listeningShortcutIndex.value = index
}

function stopListeningShortcut() {
  listeningShortcutIndex.value = null
}

async function handleShortcutKeydown(event: KeyboardEvent) {
  if (listeningShortcutIndex.value === null) {
    return
  }

  event.preventDefault()

  const shortcutKey = event.key.length === 1 ? event.key : event.key.toLowerCase()

  if (isReservedClassifyShortcutKey(shortcutKey)) {
    ElMessage.warning('快捷键不能使用 Enter、Space、Delete、N、R、Esc')
    stopListeningShortcut()
    return
  }

  const nextBindings = shortcutBindings.value.map((binding) => ({ ...binding }))
  const currentBinding = nextBindings[listeningShortcutIndex.value]

  if (!currentBinding) {
    stopListeningShortcut()
    return
  }

  const normalizedKey = shortcutKey.toLowerCase()
  const hasDuplicateKey = nextBindings.some((binding, bindingIndex) => {
    return bindingIndex !== listeningShortcutIndex.value && binding.key.toLowerCase() === normalizedKey
  })

  if (hasDuplicateKey) {
    ElMessage.warning('快捷键不能重复')
    stopListeningShortcut()
    return
  }

  currentBinding.key = shortcutKey
  await saveShortcutBindings(nextBindings)
  stopListeningShortcut()
}

async function goBack() {
  await router.push('/browse')
}

function showSavedMessage() {
  ElMessage.success('设置已保存')
}

async function resetWorkspace() {
  try {
    await ElMessageBox.confirm(
      '确定要重新选择工作区吗？\n\n这不会删除你的本地照片文件，只会清除当前网页保存的工作区记录。',
      '重新选择工作区',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    await workspaceStore.clearWorkspace()
    photoStore.clearPhotos()
    historyStore.clearHistory()

    ElMessage.success('已清除当前工作区记录')
    await router.push('/setup')
  } catch (error) {
    if (error instanceof Error && error.message === 'cancel') {
      return
    }
  }
}

onMounted(async () => {
  await settingsStore.loadSettings()

  if (workspaceStore.hasWorkspace && photoStore.photos.length === 0) {
    try {
      await photoStore.scanPhotos({ generateThumbnails: false })
    } catch (error) {
      if (error instanceof Error) {
        ElMessage.error(error.message)
      }
    }
  }

  window.addEventListener('keydown', handleShortcutKeydown, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleShortcutKeydown, true)
})
</script>

<template>
  <div class="page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="title">设置</div>
            <div class="sub-title">Local Photo Sorter</div>
          </div>

          <el-button type="primary" @click="goBack"> 返回浏览 </el-button>
        </div>
      </template>

      <el-form label-width="140px">
        <el-form-item label="界面语言">
          <el-select v-model="uiLanguage" style="width: 220px" @change="showSavedMessage">
            <el-option label="中文" value="zh" />
            <el-option label="English" value="en" />
          </el-select>

          <div class="form-tip">
            这里只影响界面语言，不会修改已经创建的本地文件夹名称。
          </div>
        </el-form-item>

        <el-form-item label="网格大小">
          <el-select v-model="gridSize" style="width: 220px" @change="showSavedMessage">
            <el-option label="小" value="small" />
            <el-option label="中" value="medium" />
            <el-option label="大" value="large" />
          </el-select>
        </el-form-item>

        <el-form-item label="默认排序">
          <el-select v-model="sortBy" style="width: 220px" @change="showSavedMessage">
            <el-option label="文件名" value="name" />
            <el-option label="修改时间" value="modifiedTime" />
          </el-select>
        </el-form-item>

        <el-form-item label="排序方向">
          <el-select v-model="sortOrder" style="width: 220px" @change="showSavedMessage">
            <el-option label="升序" value="asc" />
            <el-option label="降序" value="desc" />
          </el-select>
        </el-form-item>

        <el-form-item label="默认导入方式">
          <el-select v-model="defaultImportMode" style="width: 220px" @change="showSavedMessage">
            <el-option label="复制导入" value="copy" />
            <el-option label="移动导入" value="move" />
          </el-select>

          <div class="form-tip">
            当前版本导入功能优先支持复制导入；移动导入后续再完善。
          </div>
        </el-form-item>

        <el-form-item label="分类快捷键">
          <div class="shortcut-bindings">
            <div v-if="shortcutBindings.length === 0" class="form-tip">
              暂无分类，创建分类后可以在这里绑定快捷键。
            </div>

            <div
              v-for="(binding, index) in shortcutBindings"
              :key="`${binding.key}-${binding.categoryName}`"
              class="shortcut-row"
            >
              <el-button
                class="shortcut-key-button"
                :type="listeningShortcutIndex === index ? 'primary' : 'default'"
                @click="startListeningShortcut(index)"
              >
                {{ listeningShortcutIndex === index ? '按键中' : binding.key }}
              </el-button>

              <el-select
                :model-value="binding.categoryName"
                class="shortcut-category-select"
                filterable
                @change="(value: string) => handleUpdateBindingCategory(index, value)"
              >
                <el-option
                  v-for="categoryName in getAvailableCategoryNames(index)"
                  :key="categoryName"
                  :label="categoryName"
                  :value="categoryName"
                />
              </el-select>
            </div>
          </div>

          <div class="form-tip">
            左侧点击后按新的快捷键即可修改；右侧选择该快捷键绑定的分类。未手动设置时默认按
            1,2,3,4,5,6,7,8,9,0 绑定前 10 个分类。
          </div>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="danger-zone">
        <div>
          <div class="danger-title">工作区</div>
          <div class="danger-desc">
            重新选择工作区不会删除本地照片，只会让网页忘记当前选择的文件夹。
          </div>
        </div>

        <el-button type="danger" plain @click="resetWorkspace"> 重新选择工作区 </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  overflow: auto;
  padding: 32px;
  background: #f5f7fa;
}

.settings-card {
  max-width: 760px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-weight: 700;
  font-size: 18px;
}

.sub-title {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.form-tip {
  margin-top: 6px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}

.shortcut-bindings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 420px;
}

.shortcut-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.shortcut-key-button {
  width: 88px;
  margin-left: 0;
}

.shortcut-category-select {
  width: 100%;
}

.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid #f5c2c7;
  border-radius: 8px;
  background: #fff7f7;
}

.danger-title {
  font-weight: 700;
  color: #c45656;
}

.danger-desc {
  margin-top: 6px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}
</style>
