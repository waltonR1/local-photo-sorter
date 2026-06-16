<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import { useWorkspaceStore } from '@/stores/workspaceStore'
import {
  checkWorkspaceStructure,
  createWorkspaceFolders,
  selectWorkspaceDirectory,
} from '@/services/workspaceService'
import { getFolderNames } from '@/utils/folderNames'
import type { WorkspaceLanguage } from '@/types/workspace'

const router = useRouter()
const workspaceStore = useWorkspaceStore()

const language = ref<WorkspaceLanguage>('zh')
const loading = ref(false)

const folderNamesText = () => {
  const names = getFolderNames(language.value)

  return `${names.unsorted} / ${names.sorted} / ${names.discarded}`
}

async function handleSelectWorkspace() {
  try {
    loading.value = true

    const rootHandle = await selectWorkspaceDirectory()
    const checkResult = await checkWorkspaceStructure(rootHandle, language.value)

    if (checkResult.exists) {
      await ElMessageBox.confirm(
        `检测到已有工作区，是否继续使用？\n\n${folderNamesText()}`,
        '确认工作区',
        {
          confirmButtonText: '继续使用',
          cancelButtonText: '取消',
          type: 'info',
        },
      )
    } else {
      await ElMessageBox.confirm(
        `检测到该目录还不是 Local Photo Sorter 工作区。\n\n程序将创建以下文件夹：\n\n${folderNamesText()}\n\n是否继续？`,
        '创建工作区',
        {
          confirmButtonText: '创建',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )

      await createWorkspaceFolders(rootHandle, language.value)
    }

    await workspaceStore.setWorkspace({
      rootHandle,
      language: language.value,
    })

    ElMessage.success('工作区初始化完成')
    await router.push('/browse')
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return
      }

      ElMessage.error(error.message)
      return
    }

    ElMessage.error('初始化工作区失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <el-card class="setup-card">
      <template #header>
        <div class="card-header">
          <span>Local Photo Sorter</span>
          <span class="sub-title">本地照片筛选器</span>
        </div>
      </template>

      <div class="section">
        <div class="section-title">1. 选择工作区语言</div>

        <el-radio-group v-model="language">
          <el-radio-button label="zh">中文</el-radio-button>
          <el-radio-button label="en">English</el-radio-button>
        </el-radio-group>

        <p class="hint">
          将创建目录：
          <strong>{{ folderNamesText() }}</strong>
        </p>
      </div>

      <div class="section">
        <div class="section-title">2. 选择本地工作目录</div>

        <p class="description">
          请选择一个用于管理照片的目标文件夹。照片只会在本地处理，不会上传。
        </p>

        <el-button type="primary" size="large" :loading="loading" @click="handleSelectWorkspace">
          选择工作目录
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.setup-card {
  width: 560px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 700;
  font-size: 18px;
}

.sub-title {
  color: #909399;
  font-size: 14px;
  font-weight: 400;
}

.section {
  margin-bottom: 28px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin-bottom: 12px;
  font-weight: 600;
}

.hint {
  margin-top: 12px;
  color: #606266;
}

.description {
  color: #606266;
  line-height: 1.7;
}
</style>
