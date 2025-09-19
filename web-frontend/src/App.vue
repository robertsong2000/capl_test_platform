<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo">
          <el-icon size="32" color="#409EFF"><Tools /></el-icon>
          <span>CAPL测试平台</span>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          class="nav-menu"
          router
          @select="handleMenuSelect"
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/editor">
            <el-icon><Edit /></el-icon>
            <span>代码编辑</span>
          </el-menu-item>
          <el-menu-item index="/execution">
            <el-icon><VideoPlay /></el-icon>
            <span>测试执行</span>
          </el-menu-item>
          <el-menu-item index="/results">
            <el-icon><Document /></el-icon>
            <span>测试结果</span>
          </el-menu-item>
        </el-menu>
        
        <div class="header-actions">
          <el-button @click="showImportDialog" :loading="importing">
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
          <el-button @click="showExportDialog" :loading="exporting">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button @click="showSettingsDialog">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </div>
      </div>
    </el-header>
    
    <!-- 主要内容区域 -->
    <el-main class="app-main">
      <router-view />
    </el-main>
    
    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入数据"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="import-content">
        <el-form :model="importForm" label-width="100px">
          <el-form-item label="导入类型">
            <el-radio-group v-model="importForm.type">
              <el-radio label="json">JSON文件</el-radio>
              <el-radio label="excel">Excel文件</el-radio>
              <el-radio label="csv">CSV文件</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="选择文件">
            <el-upload
              ref="uploadRef"
              class="upload-demo"
              drag
              :auto-upload="false"
              :accept="getImportAccept()"
              :on-change="handleImportFileChange"
              :file-list="importFileList"
            >
              <el-icon size="48" color="#409EFF"><Upload /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 {{ getImportAccept() }} 格式文件，文件大小不超过 10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
          
          <el-form-item label="导入选项">
            <el-checkbox v-model="importForm.merge">合并现有数据</el-checkbox>
            <el-checkbox v-model="importForm.validate">验证数据格式</el-checkbox>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="importData" :loading="importing">导入</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 导出对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出数据"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="export-content">
        <el-form :model="exportForm" label-width="100px">
          <el-form-item label="导出范围">
            <el-radio-group v-model="exportForm.scope">
              <el-radio label="all">全部数据</el-radio>
              <el-radio label="projects">仅项目</el-radio>
              <el-radio label="testCases">仅测试用例</el-radio>
              <el-radio label="results">仅测试结果</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="导出格式">
            <el-radio-group v-model="exportForm.format">
              <el-radio label="json">JSON</el-radio>
              <el-radio label="excel">Excel</el-radio>
              <el-radio label="csv">CSV</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="导出选项">
            <el-checkbox v-model="exportForm.includeScripts">包含CAPL脚本</el-checkbox>
            <el-checkbox v-model="exportForm.includeResults">包含测试结果</el-checkbox>
            <el-checkbox v-model="exportForm.includeHistory">包含执行历史</el-checkbox>
          </el-form-item>
          
          <el-form-item label="文件名称">
            <el-input v-model="exportForm.filename" placeholder="请输入文件名" />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="exportData" :loading="exporting">导出</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 设置对话框 -->
    <el-dialog
      v-model="settingsDialogVisible"
      title="系统设置"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="settings-content">
        <el-tabs v-model="activeSettingsTab">
          <el-tab-pane label="通用设置" name="general">
            <el-form :model="settingsForm" label-width="120px">
              <el-form-item label="自动保存">
                <el-switch v-model="settingsForm.autoSave" />
              </el-form-item>
              <el-form-item label="保存间隔(秒)">
                <el-input-number v-model="settingsForm.autoSaveInterval" :min="30" :max="300" :step="30" />
              </el-form-item>
              <el-form-item label="主题模式">
                <el-radio-group v-model="settingsForm.theme">
                  <el-radio label="light">浅色</el-radio>
                  <el-radio label="dark">深色</el-radio>
                  <el-radio label="auto">自动</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="语言">
                <el-select v-model="settingsForm.language">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>
              <el-form-item label="每页显示">
                <el-input-number v-model="settingsForm.pageSize" :min="10" :max="100" :step="10" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          
          <el-tab-pane label="编辑器设置" name="editor">
            <el-form :model="settingsForm" label-width="120px">
              <el-form-item label="主题">
                <el-select v-model="settingsForm.editorTheme">
                  <el-option label="VS Dark" value="vs-dark" />
                  <el-option label="VS Light" value="vs" />
                  <el-option label="High Contrast" value="hc-black" />
                </el-select>
              </el-form-item>
              <el-form-item label="字体大小">
                <el-input-number v-model="settingsForm.fontSize" :min="10" :max="24" :step="1" />
              </el-form-item>
              <el-form-item label="显示行号">
                <el-switch v-model="settingsForm.showLineNumbers" />
              </el-form-item>
              <el-form-item label="自动换行">
                <el-switch v-model="settingsForm.wordWrap" />
              </el-form-item>
              <el-form-item label="代码提示">
                <el-switch v-model="settingsForm.codeCompletion" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          
          <el-tab-pane label="数据管理" name="data">
            <el-form :model="settingsForm" label-width="120px">
              <el-form-item label="自动备份">
                <el-switch v-model="settingsForm.autoBackup" />
              </el-form-item>
              <el-form-item label="备份间隔(小时)">
                <el-input-number v-model="settingsForm.backupInterval" :min="1" :max="24" :step="1" />
              </el-form-item>
              <el-form-item label="保留备份数">
                <el-input-number v-model="settingsForm.maxBackups" :min="1" :max="50" :step="1" />
              </el-form-item>
              <el-form-item label="数据验证">
                <el-switch v-model="settingsForm.dataValidation" />
              </el-form-item>
            </el-form>
            
            <div class="data-actions">
              <el-button @click="clearAllData" type="danger">
                <el-icon><Delete /></el-icon>
                清空所有数据
              </el-button>
              <el-button @click="exportSettings">
                <el-icon><Download /></el-icon>
                导出设置
              </el-button>
              <el-button @click="importSettings">
                <el-icon><Upload /></el-icon>
                导入设置
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="settingsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import localDataManager from './services/localStorage.js'
import fileManager from './services/fileManager.js'

const router = useRouter()
const route = useRoute()

// 状态管理
const activeMenu = ref('/')
const importing = ref(false)
const exporting = ref(false)
const importDialogVisible = ref(false)
const exportDialogVisible = ref(false)
const settingsDialogVisible = ref(false)
const activeSettingsTab = ref('general')

// 表单数据
const importForm = reactive({
  type: 'json',
  merge: true,
  validate: true
})
const exportForm = reactive({
  scope: 'all',
  format: 'json',
  includeScripts: true,
  includeResults: true,
  includeHistory: true,
  filename: `capl_export_${new Date().toISOString().split('T')[0]}`
})
const settingsForm = reactive({
  // 通用设置
  autoSave: true,
  autoSaveInterval: 60,
  theme: 'light',
  language: 'zh-CN',
  pageSize: 20,
  // 编辑器设置
  editorTheme: 'vs-dark',
  fontSize: 14,
  showLineNumbers: true,
  wordWrap: true,
  codeCompletion: true,
  // 数据管理
  autoBackup: true,
  backupInterval: 6,
  maxBackups: 10,
  dataValidation: true
})

const importFileList = ref([])

// 计算属性
const activeMenuComputed = computed(() => route.path)

// 生命周期
onMounted(() => {
  activeMenu.value = route.path
  loadSettings()
})

// 监听路由变化
watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

// 方法
const handleMenuSelect = (index) => {
  activeMenu.value = index
}

const showImportDialog = () => {
  importDialogVisible.value = true
  importFileList.value = []
}

const showExportDialog = () => {
  exportDialogVisible.value = true
  // 生成默认文件名
  exportForm.filename = `capl_export_${new Date().toISOString().split('T')[0]}`
}

const showSettingsDialog = () => {
  settingsDialogVisible.value = true
  loadSettings()
}

const getImportAccept = () => {
  const accepts = {
    json: '.json',
    excel: '.xlsx,.xls',
    csv: '.csv'
  }
  return accepts[importForm.type] || '.json'
}

const handleImportFileChange = (file, fileList) => {
  importFileList.value = fileList
}

const importData = async () => {
  if (importFileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  
  importing.value = true
  
  try {
    const file = importFileList.value[0].raw
    const result = await fileManager.importData()
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    const importedData = result.data
    
    if (importForm.validate) {
      // 验证数据格式
      const validation = validateImportedData(importedData)
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }
    }
    
    if (importForm.merge) {
      // 合并现有数据
      const existingData = localDataManager.getAllData()
      const mergedData = mergeData(existingData, importedData)
      localDataManager.importData(mergedData)
    } else {
      // 覆盖现有数据
      localDataManager.importData(importedData)
    }
    
    ElMessage.success('数据导入成功')
    importDialogVisible.value = false
    
    // 刷新当前页面
    router.go(0)
    
  } catch (error) {
    ElMessage.error('导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

const exportData = async () => {
  exporting.value = true
  
  try {
    let dataToExport
    
    switch (exportForm.scope) {
      case 'all':
        dataToExport = localDataManager.getAllData()
        break
      case 'projects':
        dataToExport = { projects: localDataManager.getProjects() }
        break
      case 'testCases':
        dataToExport = { testCases: localDataManager.getTestCases() }
        break
      case 'results':
        dataToExport = { executionRecords: localDataManager.getExecutionRecords() }
        break
      default:
        throw new Error('不支持的导出范围')
    }
    
    // 根据选项过滤数据
    if (!exportForm.includeScripts) {
      if (dataToExport.testCases) {
        dataToExport.testCases = dataToExport.testCases.map(tc => ({
          ...tc,
          script: '' // 清空脚本内容
        }))
      }
    }
    
    if (!exportForm.includeResults) {
      delete dataToExport.executionRecords
    }
    
    if (!exportForm.includeHistory) {
      // 移除历史相关数据
      if (dataToExport.projects) {
        dataToExport.projects = dataToExport.projects.map(p => ({
          ...p,
          createdAt: undefined,
          updatedAt: undefined
        }))
      }
    }
    
    const result = await fileManager.exportData(exportForm.format, exportForm.filename)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    ElMessage.success('数据导出成功')
    exportDialogVisible.value = false
    
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}

const saveSettings = () => {
  try {
    localStorage.setItem('capl_settings', JSON.stringify(settingsForm))
    ElMessage.success('设置保存成功')
    settingsDialogVisible.value = false
    
    // 应用设置
    applySettings()
    
  } catch (error) {
    ElMessage.error('保存设置失败: ' + error.message)
  }
}

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('capl_settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      Object.assign(settingsForm, parsed)
    }
  } catch (error) {
    console.warn('加载设置失败:', error)
  }
}

const applySettings = () => {
  // 应用主题设置
  document.documentElement.setAttribute('data-theme', settingsForm.theme)
  
  // 应用语言设置
  if (settingsForm.language === 'en-US') {
    // 这里可以集成国际化
    console.log('切换到英文界面')
  }
}

const clearAllData = () => {
  ElMessageBox.confirm(
    '确定要清空所有数据吗？此操作不可恢复！',
    '危险操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    localDataManager.clearAllData()
    ElMessage.success('所有数据已清空')
    settingsDialogVisible.value = false
    router.go(0)
  }).catch(() => {})
}

const exportSettings = () => {
  try {
    const settingsBlob = new Blob([JSON.stringify(settingsForm, null, 2)], {
      type: 'application/json'
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(settingsBlob)
    link.download = `capl_settings_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    ElMessage.success('设置导出成功')
  } catch (error) {
    ElMessage.error('导出设置失败: ' + error.message)
  }
}

const importSettings = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result)
        Object.assign(settingsForm, importedSettings)
        saveSettings()
        ElMessage.success('设置导入成功')
      } catch (error) {
        ElMessage.error('导入设置失败: ' + error.message)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const validateImportedData = (data) => {
  const errors = []
  
  if (data.projects && !Array.isArray(data.projects)) {
    errors.push('projects 必须是数组')
  }
  
  if (data.testCases && !Array.isArray(data.testCases)) {
    errors.push('testCases 必须是数组')
  }
  
  if (data.executionRecords && !Array.isArray(data.executionRecords)) {
    errors.push('executionRecords 必须是数组')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

const mergeData = (existing, imported) => {
  const merged = { ...existing }
  
  if (imported.projects) {
    const existingProjectIds = new Set(existing.projects.map(p => p.id))
    const newProjects = imported.projects.filter(p => !existingProjectIds.has(p.id))
    merged.projects = [...existing.projects, ...newProjects]
  }
  
  if (imported.testCases) {
    const existingTestCaseIds = new Set(existing.testCases.map(tc => tc.id))
    const newTestCases = imported.testCases.filter(tc => !existingTestCaseIds.has(tc.id))
    merged.testCases = [...existing.testCases, ...newTestCases]
  }
  
  if (imported.executionRecords) {
    merged.executionRecords = [...(existing.executionRecords || []), ...imported.executionRecords]
  }
  
  return merged
}
</script>

<style scoped>
.app-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 0;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.nav-menu {
  flex: 1;
  margin: 0 40px;
  border-bottom: none;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.app-main {
  background: #f8f9fa;
  padding: 0;
  min-height: calc(100vh - 60px);
}

.import-content,
.export-content,
.settings-content {
  padding: 20px 0;
}

.upload-demo {
  width: 100%;
}

.data-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    padding: 10px;
    gap: 10px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .nav-menu {
    margin: 0;
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .import-content,
  .export-content,
  .settings-content {
    padding: 10px 0;
  }
  
  .data-actions {
    flex-direction: column;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
}
</style>