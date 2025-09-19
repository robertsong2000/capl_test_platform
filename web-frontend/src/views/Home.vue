<template>
  <div class="home-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>项目和测试用例管理</h2>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="showProjectDialog">
          <el-icon><Plus /></el-icon>
          新建项目
        </el-button>
        <el-button type="success" @click="showTestCaseDialog">
          <el-icon><Document /></el-icon>
          新建测试用例
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon projects">
            <el-icon size="32"><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.projects }}</div>
            <div class="stat-label">项目数量</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon test-cases">
            <el-icon size="32"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.testCases }}</div>
            <div class="stat-label">测试用例数量</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon high-priority">
            <el-icon size="32"><Flag /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.highPriority }}</div>
            <div class="stat-label">高优先级用例</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon execution">
            <el-icon size="32"><VideoPlay /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.executions }}</div>
            <div class="stat-label">执行次数</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <el-card class="data-card">
      <div class="data-header">
        <h3>数据管理</h3>
        <div class="data-actions">
          <el-input
            v-model="searchText"
            placeholder="搜索项目名称或测试用例名称"
            clearable
            @input="handleSearch"
            style="width: 250px; margin-right: 10px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="viewMode" @change="handleViewChange" style="width: 120px; margin-right: 10px;">
            <el-option label="项目视图" value="projects" />
            <el-option label="测试用例视图" value="testCases" />
          </el-select>
          <el-select v-model="filterPriority" @change="handleFilterChange" style="width: 120px;">
            <el-option label="全部优先级" value="" />
            <el-option label="高优先级" value="HIGH" />
            <el-option label="中优先级" value="MEDIUM" />
            <el-option label="低优先级" value="LOW" />
          </el-select>
        </div>
      </div>
      
      <div v-if="loading" class="loading-state">
        <el-icon size="48" class="is-loading"><Loading /></el-icon>
        <p>正在加载数据...</p>
      </div>
      
      <div v-else-if="filteredData.length === 0" class="empty-state">
        <el-icon size="48" color="#c0c4cc"><Folder /></el-icon>
        <p>暂无数据</p>
      </div>
      
      <div v-else-if="viewMode === 'projects'" class="projects-list">
        <div
          v-for="project in filteredData"
          :key="project.id"
          class="project-item"
          @click="selectProject(project)"
        >
          <div class="project-header">
            <div class="project-info">
              <div class="project-title">{{ project.name }}</div>
              <div class="project-description">{{ project.description }}</div>
            </div>
            <div class="project-stats">
              <div class="stat-item">
                <el-icon size="16"><Document /></el-icon>
                <span>{{ getProjectTestCases(project.id).length }} 测试用例</span>
              </div>
              <div class="stat-item">
                <el-icon size="16"><Calendar /></el-icon>
                <span>{{ formatTime(project.createdAt) }}</span>
              </div>
            </div>
          </div>
          
          <div class="project-actions">
            <el-button
              size="small"
              type="primary"
              @click.stop="editProject(project)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click.stop="deleteProject(project)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
            <el-button
              size="small"
              @click.stop="showTestCaseDialog(project)"
            >
              <el-icon><Plus /></el-icon>
              添加测试用例
            </el-button>
          </div>
        </div>
      </div>
      
      <div v-else class="test-cases-list">
        <el-table
          :data="filteredData"
          style="width: 100%"
          row-key="id"
          stripe
          border
        >
          <el-table-column prop="name" label="测试用例名称" min-width="200" />
          <el-table-column prop="projectName" label="所属项目" min-width="150">
            <template #default="scope">
              {{ getProjectName(scope.row.projectId) }}
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="scope">
              <el-tag :type="getPriorityType(scope.row.priority)" size="small">
                {{ getPriorityText(scope.row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="scope">
              {{ formatTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="editTestCase(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="deleteTestCase(scope.row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 项目对话框 -->
    <el-dialog
      v-model="projectDialogVisible"
      :title="editingProject ? '编辑项目' : '新建项目'"
      width="500px"
      @close="resetProjectForm"
    >
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        :rules="projectRules"
        label-width="100px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="projectForm.name"
            placeholder="请输入项目名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            placeholder="请输入项目描述"
            maxlength="200"
            show-word-limit
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="projectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProject" :loading="savingProject">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 测试用例对话框 -->
    <el-dialog
      v-model="testCaseDialogVisible"
      :title="editingTestCase ? '编辑测试用例' : '新建测试用例'"
      width="600px"
      @close="resetTestCaseForm"
    >
      <el-form
        ref="testCaseFormRef"
        :model="testCaseForm"
        :rules="testCaseRules"
        label-width="100px"
      >
        <el-form-item label="所属项目" prop="projectId">
          <el-select v-model="testCaseForm.projectId" placeholder="请选择项目">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="测试名称" prop="name">
          <el-input
            v-model="testCaseForm.name"
            placeholder="请输入测试用例名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="testCaseForm.priority">
            <el-radio label="HIGH">高</el-radio>
            <el-radio label="MEDIUM">中</el-radio>
            <el-radio label="LOW">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="测试描述" prop="description">
          <el-input
            v-model="testCaseForm.description"
            type="textarea"
            placeholder="请输入测试用例描述"
            maxlength="500"
            show-word-limit
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="testCaseDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTestCase" :loading="savingTestCase">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import localDataManager from '../services/localStorage.js'

// 数据状态
const loading = ref(false)
const projects = ref([])
const testCases = ref([])
const selectedProject = ref(null)

// 视图模式
const viewMode = ref('projects') // projects, testCases
const searchText = ref('')
const filterPriority = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 项目对话框
const projectDialogVisible = ref(false)
const editingProject = ref(false)
const savingProject = ref(false)
const projectFormRef = ref(null)
const projectForm = reactive({
  id: '',
  name: '',
  description: ''
})

const projectRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '项目描述长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 测试用例对话框
const testCaseDialogVisible = ref(false)
const editingTestCase = ref(false)
const savingTestCase = ref(false)
const testCaseFormRef = ref(null)
const testCaseForm = reactive({
  id: '',
  projectId: '',
  name: '',
  priority: 'MEDIUM',
  description: '',
  status: 'READY'
})

const testCaseRules = {
  projectId: [
    { required: true, message: '请选择所属项目', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入测试用例名称', trigger: 'blur' },
    { min: 2, max: 100, message: '测试用例名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  description: [
    { max: 500, message: '测试用例描述长度不能超过 500 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const stats = computed(() => {
  const executions = localDataManager.getTestExecutions()
  return {
    projects: projects.value.length,
    testCases: testCases.value.length,
    highPriority: testCases.value.filter(tc => tc.priority === 'HIGH').length,
    executions: executions.length
  }
})

const filteredData = computed(() => {
  let filtered = []
  
  if (viewMode.value === 'projects') {
    filtered = projects.value
    if (searchText.value) {
      const searchLower = searchText.value.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }
  } else {
    filtered = testCases.value
    if (searchText.value) {
      const searchLower = searchText.value.toLowerCase()
      filtered = filtered.filter(tc => 
        tc.name.toLowerCase().includes(searchLower)
      )
    }
    if (filterPriority.value) {
      filtered = filtered.filter(tc => tc.priority === filterPriority.value)
    }
  }
  
  // 分页
  totalItems.value = filtered.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return filtered.slice(start, end)
})

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const loadData = () => {
  loading.value = true
  try {
    projects.value = localDataManager.getProjects()
    testCases.value = []
    
    // 加载所有测试用例
    projects.value.forEach(project => {
      const cases = localDataManager.getTestCases(project.id)
      cases.forEach(testCase => {
        testCase.projectName = project.name
      })
      testCases.value.push(...cases)
    })
  } catch (error) {
    ElMessage.error('加载数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadData()
  ElMessage.success('已刷新数据')
}

const handleViewChange = () => {
  currentPage.value = 1
  searchText.value = ''
  filterPriority.value = ''
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handleSearch = () => {
  currentPage.value = 1
}

const handlePageChange = () => {
  // 分页逻辑在computed中处理
}

const selectProject = (project) => {
  selectedProject.value = project
}

// 项目相关方法
const showProjectDialog = () => {
  editingProject.value = false
  projectDialogVisible.value = true
}

const editProject = (project) => {
  editingProject.value = true
  Object.assign(projectForm, project)
  projectDialogVisible.value = true
}

const saveProject = async () => {
  if (!projectFormRef.value) return
  
  try {
    await projectFormRef.value.validate()
    savingProject.value = true
    
    if (editingProject.value) {
      localDataManager.updateProject(projectForm.id, projectForm)
      ElMessage.success('项目更新成功')
    } else {
      const newProject = {
        ...projectForm,
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      }
      localDataManager.createProject(newProject)
      ElMessage.success('项目创建成功')
    }
    
    projectDialogVisible.value = false
    loadData()
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    savingProject.value = false
  }
}

const deleteProject = async (project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目 "${project.name}" 吗？\n删除项目将同时删除该项目下的所有测试用例。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
    
    localDataManager.deleteProject(project.id)
    ElMessage.success('项目删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

const resetProjectForm = () => {
  if (projectFormRef.value) {
    projectFormRef.value.resetFields()
  }
  Object.assign(projectForm, {
    id: '',
    name: '',
    description: ''
  })
}

// 测试用例相关方法
const showTestCaseDialog = (project = null) => {
  editingTestCase.value = false
  if (project) {
    testCaseForm.projectId = project.id
  }
  testCaseDialogVisible.value = true
}

const editTestCase = (testCase) => {
  editingTestCase.value = true
  Object.assign(testCaseForm, testCase)
  testCaseDialogVisible.value = true
}

const saveTestCase = async () => {
  if (!testCaseFormRef.value) return
  
  try {
    await testCaseFormRef.value.validate()
    savingTestCase.value = true
    
    if (editingTestCase.value) {
      localDataManager.updateTestCase(testCaseForm.id, testCaseForm)
      ElMessage.success('测试用例更新成功')
    } else {
      const newTestCase = {
        ...testCaseForm,
        id: `testcase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      }
      localDataManager.createTestCase(newTestCase)
      ElMessage.success('测试用例创建成功')
    }
    
    testCaseDialogVisible.value = false
    loadData()
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    savingTestCase.value = false
  }
}

const deleteTestCase = async (testCase) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除测试用例 "${testCase.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    localDataManager.deleteTestCase(testCase.id)
    ElMessage.success('测试用例删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

const resetTestCaseForm = () => {
  if (testCaseFormRef.value) {
    testCaseFormRef.value.resetFields()
  }
  Object.assign(testCaseForm, {
    id: '',
    projectId: '',
    name: '',
    priority: 'MEDIUM',
    description: '',
    status: 'READY'
  })
}

// 工具函数
const getProjectName = (projectId) => {
  const project = projects.value.find(p => p.id === projectId)
  return project ? project.name : '未知项目'
}

const getProjectTestCases = (projectId) => {
  return testCases.value.filter(tc => tc.projectId === projectId)
}

const getPriorityType = (priority) => {
  const types = {
    'HIGH': 'danger',
    'MEDIUM': 'warning',
    'LOW': 'info'
  }
  return types[priority] || 'info'
}

const getPriorityText = (priority) => {
  const texts = {
    'HIGH': '高',
    'MEDIUM': '中',
    'LOW': '低'
  }
  return texts[priority] || priority
}

const getStatusType = (status) => {
  const types = {
    'READY': 'info',
    'RUNNING': 'warning',
    'PASSED': 'success',
    'FAILED': 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    'READY': '待执行',
    'RUNNING': '执行中',
    'PASSED': '已通过',
    'FAILED': '已失败'
  }
  return texts[status] || status
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.home-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.page-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
}

.stat-icon.projects {
  background: #d9ecff;
  color: #409eff;
}

.stat-icon.test-cases {
  background: #e1f3d8;
  color: #67c23a;
}

.stat-icon.high-priority {
  background: #fde2e2;
  color: #f56c6c;
}

.stat-icon.execution {
  background: #faecd8;
  color: #e6a23c;
}

.stat-info {
  text-align: right;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.data-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.data-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.data-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.loading-state p,
.empty-state p {
  margin: 20px 0 0 0;
  font-size: 16px;
}

.projects-list {
  padding: 20px;
}

.project-item {
  padding: 20px;
  margin-bottom: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.project-item:last-child {
  margin-bottom: 0;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.project-info {
  flex: 1;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.project-description {
  font-size: 14px;
  color: #909399;
  line-height: 1.5;
}

.project-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.project-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.test-cases-list {
  padding: 20px;
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #e9ecef;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .home-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .data-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .data-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .project-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .project-stats {
    margin-left: 0;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .project-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
}
</style>