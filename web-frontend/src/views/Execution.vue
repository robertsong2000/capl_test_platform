<template>
  <div class="execution-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>测试执行</h2>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="batchExecute" :loading="executing" :disabled="selectedTestCases.length === 0">
          <el-icon><VideoPlay /></el-icon>
          批量执行
        </el-button>
        <el-button type="success" @click="showExecutionLog" :disabled="executionHistory.length === 0">
          <el-icon><Document /></el-icon>
          执行日志
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
          <el-icon size="24" color="#409EFF"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ totalTestCases }}</div>
            <div class="stat-label">测试用例总数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon size="24" color="#67C23A"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ passedTestCases }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon size="24" color="#F56C6C"><CircleClose /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ failedTestCases }}</div>
            <div class="stat-label">已失败</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon size="24" color="#E6A23C"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ pendingTestCases }}</div>
            <div class="stat-label">待执行</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选面板 -->
    <div class="filter-panel">
      <el-card>
        <div class="filter-content">
          <el-form :inline="true" class="filter-form">
            <el-form-item label="项目">
              <el-select v-model="filterProjectId" placeholder="选择项目" clearable @change="handleFilterChange">
                <el-option
                  v-for="project in projects"
                  :key="project.id"
                  :label="project.name"
                  :value="project.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="状态">
              <el-select v-model="filterStatus" placeholder="选择状态" clearable @change="handleFilterChange">
                <el-option label="待执行" value="READY" />
                <el-option label="已通过" value="PASSED" />
                <el-option label="已失败" value="FAILED" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="优先级">
              <el-select v-model="filterPriority" placeholder="选择优先级" clearable @change="handleFilterChange">
                <el-option label="高" value="HIGH" />
                <el-option label="中" value="MEDIUM" />
                <el-option label="低" value="LOW" />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button @click="resetFilters">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>

    <!-- 测试用例列表 -->
    <div class="test-cases-section">
      <el-card>
        <div class="section-header">
          <h3>测试用例列表</h3>
          <div class="section-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索测试用例"
              clearable
              @input="handleSearch"
              style="width: 200px; margin-right: 10px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button @click="toggleViewMode">
              <el-icon><Grid /></el-icon>
              {{ viewMode === 'list' ? '卡片' : '列表' }}
            </el-button>
          </div>
        </div>
        
        <div class="test-cases-content">
          <!-- 列表视图 -->
          <div v-if="viewMode === 'list'" class="list-view">
            <el-table
              :data="filteredTestCases"
              style="width: 100%"
              @selection-change="handleSelectionChange"
              v-loading="loading"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="name" label="测试用例名称" min-width="200" />
              <el-table-column prop="projectName" label="所属项目" width="150" />
              <el-table-column prop="priority" label="优先级" width="100">
                <template #default="{ row }">
                  <el-tag :type="getPriorityType(row.priority)" size="small">
                    {{ getPriorityText(row.priority) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click="executeTestCase(row)">
                    <el-icon><VideoPlay /></el-icon>
                    执行
                  </el-button>
                  <el-button size="small" @click="viewTestCase(row)">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 卡片视图 -->
          <div v-else class="card-view">
            <div class="test-case-cards">
              <el-card
                v-for="testCase in filteredTestCases"
                :key="testCase.id"
                class="test-case-card"
                :class="{ selected: selectedTestCases.includes(testCase) }"
                @click="toggleSelectTestCase(testCase)"
              >
                <div class="card-header">
                  <el-checkbox
                    :model-value="selectedTestCases.includes(testCase)"
                    @click.stop
                    @change="(val) => handleCardSelection(testCase, val)"
                  />
                  <h4>{{ testCase.name }}</h4>
                  <el-dropdown trigger="click" @command="(cmd) => handleCardCommand(cmd, testCase)">
                    <el-icon class="more-icon"><MoreFilled /></el-icon>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="execute">
                          <el-icon><VideoPlay /></el-icon>
                          执行
                        </el-dropdown-item>
                        <el-dropdown-item command="view">
                          <el-icon><View /></el-icon>
                          查看
                        </el-dropdown-item>
                        <el-dropdown-item command="edit">
                          <el-icon><Edit /></el-icon>
                          编辑
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                
                <div class="card-content">
                  <div class="card-info">
                    <div class="info-item">
                      <span class="info-label">项目:</span>
                      <span class="info-value">{{ testCase.projectName }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">优先级:</span>
                      <el-tag :type="getPriorityType(testCase.priority)" size="small">
                        {{ getPriorityText(testCase.priority) }}
                      </el-tag>
                    </div>
                    <div class="info-item">
                      <span class="info-label">状态:</span>
                      <el-tag :type="getStatusType(testCase.status)" size="small">
                        {{ getStatusText(testCase.status) }}
                      </el-tag>
                    </div>
                  </div>
                  <p class="card-description">{{ testCase.description || '暂无描述' }}</p>
                </div>
                
                <div class="card-actions">
                  <el-button size="small" @click.stop="executeTestCase(testCase)">
                    <el-icon><VideoPlay /></el-icon>
                    执行
                  </el-button>
                  <el-button size="small" @click.stop="viewTestCase(testCase)">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
          
          <div v-if="filteredTestCases.length === 0" class="empty-state">
            <el-icon size="48" color="#c0c4cc"><Document /></el-icon>
            <p>暂无测试用例</p>
          </div>
        </div>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 执行进度对话框 -->
    <el-dialog
      v-model="executionDialogVisible"
      title="测试执行进度"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="execution-progress">
        <div class="progress-header">
          <span>正在执行: {{ currentExecutingCase?.name }}</span>
          <span>{{ executedCount }} / {{ totalExecuteCount }}</span>
        </div>
        <el-progress
          :percentage="executionProgress"
          :status="executionStatus"
          :stroke-width="20"
          :text-inside="true"
        />
        
        <div class="execution-log">
          <div
            v-for="(log, index) in executionLogs"
            :key="index"
            class="log-item"
            :class="log.type"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelExecution" v-if="!executionCompleted">
            <el-icon><CircleClose /></el-icon>
            取消执行
          </el-button>
          <el-button type="primary" @click="closeExecutionDialog" v-if="executionCompleted">
            <el-icon><CircleCheck /></el-icon>
            完成
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 执行日志对话框 -->
    <el-dialog
      v-model="executionLogDialogVisible"
      title="执行日志"
      width="800px"
    >
      <div class="execution-log-dialog">
        <div class="log-filters">
          <el-form :inline="true">
            <el-form-item label="项目">
              <el-select v-model="logFilterProjectId" placeholder="选择项目" clearable @change="filterExecutionLogs">
                <el-option
                  v-for="project in projects"
                  :key="project.id"
                  :label="project.name"
                  :value="project.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="logDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="filterExecutionLogs"
              />
            </el-form-item>
            <el-form-item>
              <el-button @click="clearLogFilters">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="log-list">
          <div
            v-for="log in filteredExecutionLogs"
            :key="log.id"
            class="log-entry"
          >
            <div class="log-header">
              <span class="log-testcase">{{ log.testCaseName }}</span>
              <span class="log-project">{{ log.projectName }}</span>
              <span class="log-time">{{ log.time }}</span>
              <el-tag :type="getStatusType(log.status)" size="small">
                {{ getStatusText(log.status) }}
              </el-tag>
            </div>
            <div class="log-details">
              <p class="log-message">{{ log.message }}</p>
              <p class="log-duration">执行时长: {{ log.duration }}ms</p>
            </div>
          </div>
        </div>
        
        <div v-if="filteredExecutionLogs.length === 0" class="empty-state">
          <el-icon size="48" color="#c0c4cc"><Document /></el-icon>
          <p>暂无执行日志</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import localDataManager from '../services/localStorage.js'

// 状态管理
const loading = ref(false)
const executing = ref(false)
const executionDialogVisible = ref(false)
const executionLogDialogVisible = ref(false)

// 数据状态
const projects = ref([])
const testCases = ref([])
const executionHistory = ref([])
const selectedTestCases = ref([])

// 筛选条件
const filterProjectId = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const searchKeyword = ref('')

// 视图模式
const viewMode = ref('list') // list, card

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

// 执行状态
const currentExecutingCase = ref(null)
const executedCount = ref(0)
const totalExecuteCount = ref(0)
const executionLogs = ref([])
const executionCompleted = ref(false)

// 日志筛选
const logFilterProjectId = ref('')
const logDateRange = ref([])

// 计算属性
const filteredTestCases = computed(() => {
  let filtered = testCases.value
  
  // 项目筛选
  if (filterProjectId.value) {
    filtered = filtered.filter(tc => tc.projectId === filterProjectId.value)
  }
  
  // 状态筛选
  if (filterStatus.value) {
    filtered = filtered.filter(tc => tc.status === filterStatus.value)
  }
  
  // 优先级筛选
  if (filterPriority.value) {
    filtered = filtered.filter(tc => tc.priority === filterPriority.value)
  }
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(tc => 
      tc.name.toLowerCase().includes(keyword) ||
      tc.description.toLowerCase().includes(keyword)
    )
  }
  
  // 更新总数
  totalCount.value = filtered.length
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return filtered.slice(start, end)
})

const filteredExecutionLogs = computed(() => {
  let filtered = executionHistory.value
  
  // 项目筛选
  if (logFilterProjectId.value) {
    filtered = filtered.filter(log => log.projectId === logFilterProjectId.value)
  }
  
  // 日期范围筛选
  if (logDateRange.value && logDateRange.value.length === 2) {
    const startDate = new Date(logDateRange.value[0])
    const endDate = new Date(logDateRange.value[1])
    endDate.setHours(23, 59, 59, 999)
    
    filtered = filtered.filter(log => {
      const logDate = new Date(log.startTime)
      return logDate >= startDate && logDate <= endDate
    })
  }
  
  return filtered
})

const executionProgress = computed(() => {
  if (totalExecuteCount.value === 0) return 0
  return Math.round((executedCount.value / totalExecuteCount.value) * 100)
})

const executionStatus = computed(() => {
  if (!executionCompleted.value) return null
  return 'success'
})

const totalTestCases = computed(() => testCases.value.length)
const passedTestCases = computed(() => testCases.value.filter(tc => tc.status === 'PASSED').length)
const failedTestCases = computed(() => testCases.value.filter(tc => tc.status === 'FAILED').length)
const pendingTestCases = computed(() => testCases.value.filter(tc => tc.status === 'READY').length)

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const loadData = () => {
  loading.value = true
  try {
    projects.value = localDataManager.getProjects()
    testCases.value = localDataManager.getAllTestCases()
    executionHistory.value = localDataManager.getTestExecutions()
    
    // 为测试用例添加项目名称
    testCases.value.forEach(tc => {
      const project = projects.value.find(p => p.id === tc.projectId)
      tc.projectName = project ? project.name : '未知项目'
    })
    
    // 为执行日志添加项目名称和测试用例名称
    executionHistory.value.forEach(log => {
      const testCase = testCases.value.find(tc => tc.id === log.testCaseId)
      const project = projects.value.find(p => p.id === log.projectId)
      log.testCaseName = testCase ? testCase.name : '未知测试用例'
      log.projectName = project ? project.name : '未知项目'
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

const handleFilterChange = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  filterProjectId.value = ''
  filterStatus.value = ''
  filterPriority.value = ''
  searchKeyword.value = ''
  currentPage.value = 1
  handleFilterChange()
}

const handleSearch = () => {
  currentPage.value = 1
}

const handlePageChange = () => {
  // 分页变化时不需要额外操作，computed会自动更新
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'card' : 'list'
}

const handleSelectionChange = (selection) => {
  selectedTestCases.value = selection
}

const toggleSelectTestCase = (testCase) => {
  const index = selectedTestCases.value.findIndex(tc => tc.id === testCase.id)
  if (index > -1) {
    selectedTestCases.value.splice(index, 1)
  } else {
    selectedTestCases.value.push(testCase)
  }
}

const handleCardSelection = (testCase, selected) => {
  if (selected) {
    if (!selectedTestCases.value.find(tc => tc.id === testCase.id)) {
      selectedTestCases.value.push(testCase)
    }
  } else {
    const index = selectedTestCases.value.findIndex(tc => tc.id === testCase.id)
    if (index > -1) {
      selectedTestCases.value.splice(index, 1)
    }
  }
}

const handleCardCommand = (command, testCase) => {
  switch (command) {
    case 'execute':
      executeTestCase(testCase)
      break
    case 'view':
      viewTestCase(testCase)
      break
    case 'edit':
      editTestCase(testCase)
      break
  }
}

const executeTestCase = async (testCase) => {
  if (executing.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要执行测试用例 "${testCase.name}" 吗？`,
      '确认执行',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 单条执行
    selectedTestCases.value = [testCase]
    await executeSelectedTestCases()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('执行失败: ' + error.message)
    }
  }
}

const batchExecute = async () => {
  if (selectedTestCases.value.length === 0) {
    ElMessage.warning('请选择要执行的测试用例')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量执行 ${selectedTestCases.value.length} 个测试用例吗？`,
      '确认批量执行',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    await executeSelectedTestCases()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量执行失败: ' + error.message)
    }
  }
}

const executeSelectedTestCases = async () => {
  if (selectedTestCases.value.length === 0) return
  
  executing.value = true
  executionDialogVisible.value = true
  executionCompleted.value = false
  executionLogs.value = []
  executedCount.value = 0
  totalExecuteCount.value = selectedTestCases.value.length
  
  try {
    addExecutionLog('info', '开始批量执行测试用例...')
    
    for (let i = 0; i < selectedTestCases.value.length; i++) {
      const testCase = selectedTestCases.value[i]
      currentExecutingCase.value = testCase
      executedCount.value = i + 1
      
      addExecutionLog('info', `开始执行: ${testCase.name}`)
      
      try {
        // 模拟测试执行
        await executeSingleTestCase(testCase)
        addExecutionLog('success', `执行完成: ${testCase.name} - 通过`)
      } catch (error) {
        addExecutionLog('error', `执行失败: ${testCase.name} - ${error.message}`)
      }
      
      // 短暂延迟，模拟执行间隔
      if (i < selectedTestCases.value.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    addExecutionLog('success', '所有测试用例执行完成')
    executionCompleted.value = true
    
    // 刷新数据
    loadData()
    
  } catch (error) {
    addExecutionLog('error', '批量执行出错: ' + error.message)
  } finally {
    executing.value = false
  }
}

const executeSingleTestCase = async (testCase) => {
  return new Promise((resolve, reject) => {
    // 模拟测试执行
    setTimeout(() => {
      const success = Math.random() > 0.2 // 80% 成功率
      
      if (success) {
        // 更新测试用例状态
        testCase.status = 'PASSED'
        localDataManager.updateTestCase(testCase.id, { status: 'PASSED' })
        
        // 记录执行结果
        const result = {
          id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          testCaseId: testCase.id,
          projectId: testCase.projectId,
          status: 'PASSED',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
          output: `测试用例 "${testCase.name}" 执行通过`,
          steps: [
            { name: '初始化', status: 'PASSED', duration: 100 },
            { name: '执行测试', status: 'PASSED', duration: 800 },
            { name: '验证结果', status: 'PASSED', duration: 200 }
          ]
        }
        localDataManager.createTestExecution(result)
        
        resolve(result)
      } else {
        // 更新测试用例状态
        testCase.status = 'FAILED'
        localDataManager.updateTestCase(testCase.id, { status: 'FAILED' })
        
        // 记录执行结果
        const result = {
          id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          testCaseId: testCase.id,
          projectId: testCase.projectId,
          status: 'FAILED',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: Math.floor(Math.random() * 1500) + 300, // 300-1800ms
          output: `测试用例 "${testCase.name}" 执行失败`,
          error: '模拟执行错误',
          steps: [
            { name: '初始化', status: 'PASSED', duration: 100 },
            { name: '执行测试', status: 'FAILED', duration: 600 },
            { name: '验证结果', status: 'FAILED', duration: 100 }
          ]
        }
        localDataManager.createTestExecution(result)
        
        reject(new Error('模拟执行失败'))
      }
    }, Math.floor(Math.random() * 1000) + 500) // 500-1500ms 延迟
  })
}

const cancelExecution = () => {
  if (!executionCompleted.value) {
    ElMessageBox.confirm(
      '确定要取消当前的批量执行吗？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      executing.value = false
      executionDialogVisible.value = false
      executionCompleted.value = true
      addExecutionLog('warning', '批量执行已取消')
    }).catch(() => {})
  }
}

const closeExecutionDialog = () => {
  executionDialogVisible.value = false
  executionLogs.value = []
  currentExecutingCase.value = null
}

const viewTestCase = (testCase) => {
  // 跳转到编辑器页面
  window.location.hash = `#/editor`
  // 这里可以通过路由参数传递测试用例ID
  localStorage.setItem('selectedTestCaseId', testCase.id)
}

const editTestCase = (testCase) => {
  // 跳转到编辑器页面
  window.location.hash = `#/editor`
  localStorage.setItem('selectedTestCaseId', testCase.id)
}

const showExecutionLog = () => {
  executionLogDialogVisible.value = true
  // 重置日志筛选
  logFilterProjectId.value = ''
  logDateRange.value = []
}

const filterExecutionLogs = () => {
  // computed属性会自动处理筛选
}

const clearLogFilters = () => {
  logFilterProjectId.value = ''
  logDateRange.value = []
}

const addExecutionLog = (type, message) => {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN')
  executionLogs.value.push({
    type,
    message,
    time: timeStr
  })
  
  // 自动滚动到底部
  nextTick(() => {
    const logContainer = document.querySelector('.execution-log')
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight
    }
  })
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
    'PASSED': 'success',
    'FAILED': 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    'READY': '待执行',
    'PASSED': '已通过',
    'FAILED': '已失败'
  }
  return texts[status] || status
}
</script>

<style scoped>
.execution-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f8f9fa;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.filter-panel {
  margin-bottom: 20px;
}

.filter-content {
  padding: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.test-cases-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 20px;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.test-cases-content {
  padding: 0 20px 20px;
}

.list-view {
  margin-bottom: 20px;
}

.card-view {
  margin-bottom: 20px;
}

.test-case-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.test-case-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.test-case-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.test-case-card.selected {
  border-color: #409eff;
  background: #f0f9ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  margin-left: 10px;
}

.more-icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.more-icon:hover {
  background: #f5f7fa;
}

.card-content {
  margin-bottom: 16px;
}

.card-info {
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.card-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state p {
  margin: 16px 0 0 0;
  font-size: 16px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.execution-progress {
  padding: 20px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-weight: 500;
  color: #2c3e50;
}

.execution-log {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.log-item {
  margin-bottom: 8px;
  display: flex;
  gap: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.log-time {
  color: #909399;
  white-space: nowrap;
  min-width: 80px;
}

.log-message {
  color: #606266;
  word-break: break-word;
}

.log-item.success .log-message {
  color: #67c23a;
}

.log-item.error .log-message {
  color: #f56c6c;
}

.log-item.warning .log-message {
  color: #e6a23c;
}

.log-item.info .log-message {
  color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.execution-log-dialog {
  max-height: 500px;
  overflow-y: auto;
}

.log-filters {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}

.log-list {
  margin-bottom: 20px;
}

.log-entry {
  padding: 16px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.log-entry:last-child {
  margin-bottom: 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-testcase {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.log-project {
  color: #909399;
  font-size: 12px;
}

.log-time {
  color: #909399;
  font-size: 12px;
}

.log-details {
  margin-top: 8px;
}

.log-message {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.log-duration {
  color: #909399;
  font-size: 12px;
}

@media (max-width: 768px) {
  .execution-container {
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
    grid-template-columns: 1fr;
  }
  
  .filter-form {
    flex-direction: column;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .section-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .test-case-cards {
    grid-template-columns: 1fr;
  }
  
  .test-case-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .log-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
}
</style>