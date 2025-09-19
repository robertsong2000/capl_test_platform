<template>
  <div class="results-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>测试结果</h2>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="exportResults">
          <el-icon><Download /></el-icon>
          导出结果
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon size="32"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总执行次数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon passed">
            <el-icon size="32"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.passed }}</div>
            <div class="stat-label">通过次数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon failed">
            <el-icon size="32"><CircleClose /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.failed }}</div>
            <div class="stat-label">失败次数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon pass-rate">
            <el-icon size="32"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.passRate }}%</div>
            <div class="stat-label">通过率</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选面板 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="项目">
          <el-select v-model="filterForm.projectId" placeholder="选择项目" @change="handleFilterChange">
            <el-option label="全部项目" value="" />
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="结果">
          <el-select v-model="filterForm.result" placeholder="选择结果" @change="handleFilterChange">
            <el-option label="全部结果" value="" />
            <el-option label="通过" value="PASSED" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleFilterChange"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button @click="resetFilter">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果列表 -->
    <el-card class="results-card">
      <div class="results-header">
        <h3>执行记录</h3>
        <div class="results-actions">
          <el-input
            v-model="searchText"
            placeholder="搜索测试用例名称"
            clearable
            @input="handleSearch"
            style="width: 200px; margin-right: 10px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="sortBy" @change="handleSort" style="width: 120px;">
            <el-option label="按时间排序" value="time" />
            <el-option label="按结果排序" value="result" />
            <el-option label="按项目排序" value="project" />
          </el-select>
        </div>
      </div>
      
      <div v-if="loading" class="loading-state">
        <el-icon size="48" class="is-loading"><Loading /></el-icon>
        <p>正在加载测试结果...</p>
      </div>
      
      <div v-else-if="filteredResults.length === 0" class="empty-state">
        <el-icon size="48" color="#c0c4cc"><Document /></el-icon>
        <p>暂无测试结果</p>
      </div>
      
      <div v-else class="results-list">
        <div
          v-for="result in filteredResults"
          :key="result.id"
          class="result-item"
          @click="showResultDetails(result)"
        >
          <div class="result-header">
            <div class="result-info">
              <div class="result-title">{{ getTestCaseName(result.testCaseId) }}</div>
              <div class="result-project">{{ getProjectName(result.projectId) }}</div>
            </div>
            <div class="result-status">
              <el-tag :type="getStatusType(result.result)" size="large">
                {{ getResultText(result.result) }}
              </el-tag>
            </div>
          </div>
          
          <div class="result-details">
            <div class="result-time">
              <el-icon size="16"><Clock /></el-icon>
              <span>{{ formatTime(result.startTime) }}</span>
            </div>
            <div class="result-duration">
              <el-icon size="16"><Timer /></el-icon>
              <span>{{ formatDuration(result.duration) }}</span>
            </div>
            <div class="result-steps">
              <el-icon size="16"><List /></el-icon>
              <span>{{ result.steps.length }} 步骤</span>
            </div>
            <div class="result-error" v-if="result.error">
              <el-icon size="16"><Warning /></el-icon>
              <span class="error-text">{{ result.error }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalResults"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 结果详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="测试详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedResult" class="result-details-content">
        <div class="details-header">
          <div class="details-info">
            <h3>{{ getTestCaseName(selectedResult.testCaseId) }}</h3>
            <p>{{ getProjectName(selectedResult.projectId) }}</p>
          </div>
          <div class="details-status">
            <el-tag :type="getStatusType(selectedResult.result)" size="large">
              {{ getResultText(selectedResult.result) }}
            </el-tag>
          </div>
        </div>
        
        <div class="details-stats">
          <div class="stat-item">
            <span class="stat-label">开始时间:</span>
            <span class="stat-value">{{ formatTime(selectedResult.startTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">执行时长:</span>
            <span class="stat-value">{{ formatDuration(selectedResult.duration) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">执行ID:</span>
            <span class="stat-value">{{ selectedResult.id }}</span>
          </div>
        </div>
        
        <div class="details-steps">
          <h4>测试步骤</h4>
          <div class="steps-list">
            <div
              v-for="(step, index) in selectedResult.steps"
              :key="step.id"
              class="step-item"
              :class="{ 'step-passed': step.result === 'PASSED', 'step-failed': step.result === 'FAILED' }"
            >
              <div class="step-header">
                <span class="step-number">{{ index + 1 }}</span>
                <span class="step-name">{{ step.name }}</span>
                <el-icon v-if="step.result === 'PASSED'" size="16" color="#67c23a"><CircleCheck /></el-icon>
                <el-icon v-else-if="step.result === 'FAILED'" size="16" color="#f56c6c"><CircleClose /></el-icon>
                <el-icon v-else size="16" color="#909399"><Clock /></el-icon>
              </div>
              <div class="step-description">{{ step.description }}</div>
              <div v-if="step.error" class="step-error">{{ step.error }}</div>
            </div>
          </div>
        </div>
        
        <div class="details-output">
          <h4>执行输出</h4>
          <div class="output-content">
            <pre>{{ selectedResult.output }}</pre>
          </div>
        </div>
        
        <div v-if="selectedResult.error" class="details-error">
          <h4>错误信息</h4>
          <div class="error-content">
            <pre>{{ selectedResult.error }}</pre>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="details-footer">
          <el-button @click="generateReport(selectedResult)">
            <el-icon><Document /></el-icon>
            生成报告
          </el-button>
          <el-button type="primary" @click="detailsDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import fileManager from '../services/fileManager.js'
import localDataManager from '../services/localStorage.js'

// 数据状态
const loading = ref(false)
const projects = ref([])
const testCases = ref([])
const executionRecords = ref([])

// 筛选状态
const filterForm = reactive({
  projectId: '',
  result: '',
  dateRange: null
})

// 搜索和排序
const searchText = ref('')
const sortBy = ref('time')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const totalResults = ref(0)

// 详情对话框
const detailsDialogVisible = ref(false)
const selectedResult = ref(null)

// 计算属性
const stats = computed(() => {
  const total = executionRecords.value.length
  const passed = executionRecords.value.filter(r => r.result === 'PASSED').length
  const failed = executionRecords.value.filter(r => r.result === 'FAILED').length
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
  
  return {
    total,
    passed,
    failed,
    passRate
  }
})

const filteredResults = computed(() => {
  let filtered = executionRecords.value
  
  // 项目筛选
  if (filterForm.projectId) {
    filtered = filtered.filter(r => r.projectId === filterForm.projectId)
  }
  
  // 结果筛选
  if (filterForm.result) {
    filtered = filtered.filter(r => r.result === filterForm.result)
  }
  
  // 日期范围筛选
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const startDate = new Date(filterForm.dateRange[0])
    const endDate = new Date(filterForm.dateRange[1])
    endDate.setHours(23, 59, 59, 999) // 包含结束日期
    
    filtered = filtered.filter(r => {
      const recordDate = new Date(r.startTime)
      return recordDate >= startDate && recordDate <= endDate
    })
  }
  
  // 搜索筛选
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    filtered = filtered.filter(r => {
      const testCaseName = getTestCaseName(r.testCaseId).toLowerCase()
      return testCaseName.includes(searchLower)
    })
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'result':
        return a.result.localeCompare(b.result)
      case 'project':
        const projectA = getProjectName(a.projectId)
        const projectB = getProjectName(b.projectId)
        return projectA.localeCompare(projectB)
      case 'time':
      default:
        return new Date(b.startTime) - new Date(a.startTime)
    }
  })
  
  // 分页
  totalResults.value = filtered.length
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
      testCases.value.push(...cases)
    })
    
    // 获取执行记录
    executionRecords.value = localDataManager.getTestExecutions()
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

const handleFilterChange = () => {
  currentPage.value = 1
}

const resetFilter = () => {
  filterForm.projectId = ''
  filterForm.result = ''
  filterForm.dateRange = null
  currentPage.value = 1
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSort = () => {
  // 排序逻辑在computed中处理
}

const handlePageChange = () => {
  // 分页逻辑在computed中处理
}

const showResultDetails = (result) => {
  selectedResult.value = result
  detailsDialogVisible.value = true
}

const exportResults = async () => {
  try {
    const exportData = {
      projects: projects.value,
      testCases: testCases.value,
      executionRecords: filteredResults.value
    }
    
    await fileManager.exportData(exportData, '测试结果导出.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  }
}

const generateReport = async (result) => {
  try {
    const reportData = {
      project: projects.value.find(p => p.id === result.projectId),
      testCase: testCases.value.find(tc => tc.id === result.testCaseId),
      executionRecord: result
    }
    
    await fileManager.generateTestReport(reportData, '测试报告.html')
    ElMessage.success('报告生成成功')
  } catch (error) {
    ElMessage.error('报告生成失败: ' + error.message)
  }
}

// 工具函数
const getProjectName = (projectId) => {
  const project = projects.value.find(p => p.id === projectId)
  return project ? project.name : '未知项目'
}

const getTestCaseName = (testCaseId) => {
  const testCase = testCases.value.find(tc => tc.id === testCaseId)
  return testCase ? testCase.name : '未知测试用例'
}

const getStatusType = (result) => {
  const types = {
    'PASSED': 'success',
    'FAILED': 'danger'
  }
  return types[result] || 'info'
}

const getResultText = (result) => {
  const texts = {
    'PASSED': '通过',
    'FAILED': '失败'
  }
  return texts[result] || result
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleString('zh-CN')
}

const formatDuration = (duration) => {
  if (!duration) return '0秒'
  
  if (duration < 1000) {
    return `${duration}毫秒`
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}秒`
  } else {
    const minutes = Math.floor(duration / 60000)
    const seconds = ((duration % 60000) / 1000).toFixed(0)
    return `${minutes}分${seconds}秒`
  }
}
</script>

<style scoped>
.results-container {
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

.stat-icon.total {
  background: #d9ecff;
  color: #409eff;
}

.stat-icon.passed {
  background: #e1f3d8;
  color: #67c23a;
}

.stat-icon.failed {
  background: #fde2e2;
  color: #f56c6c;
}

.stat-icon.pass-rate {
  background: #f0f9ff;
  color: #13c2c2;
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

.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.filter-form {
  padding: 10px 0;
}

.results-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.results-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.results-actions {
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

.results-list {
  padding: 20px;
}

.result-item {
  padding: 20px;
  margin-bottom: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.result-item:last-child {
  margin-bottom: 0;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.result-info {
  flex: 1;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.result-project {
  font-size: 14px;
  color: #909399;
}

.result-status {
  margin-left: 20px;
}

.result-details {
  display: flex;
  gap: 24px;
  align-items: center;
}

.result-time,
.result-duration,
.result-steps,
.result-error {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.error-text {
  color: #f56c6c;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #e9ecef;
}

.result-details-content {
  max-height: 70vh;
  overflow-y: auto;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.details-info h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.details-info p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.details-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 600;
}

.details-steps {
  margin-bottom: 20px;
}

.details-steps h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #dcdfe6;
}

.step-item.step-passed {
  border-left-color: #67c23a;
  background: #f0f9ff;
}

.step-item.step-failed {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.step-name {
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.step-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.step-error {
  font-size: 14px;
  color: #f56c6c;
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #f56c6c;
}

.details-output,
.details-error {
  margin-bottom: 20px;
}

.details-output h4,
.details-error h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.output-content,
.error-content {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
}

.output-content pre,
.error-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.details-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .results-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
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
  
  .filter-form {
    flex-direction: column;
  }
  
  .results-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .results-actions {
    justify-content: center;
  }
  
  .result-details {
    flex-direction: column;
    gap: 12px;
  }
  
  .details-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .details-stats {
    grid-template-columns: 1fr;
  }
  
  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .details-footer {
    flex-direction: column;
  }
}
</style>