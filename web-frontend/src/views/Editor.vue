<template>
  <div class="editor-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>CAPL 代码编辑器</h2>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="saveScript" :loading="saving">
          <el-icon><DocumentChecked /></el-icon>
          保存
        </el-button>
        <el-button type="success" @click="runTest" :loading="running">
          <el-icon><VideoPlay /></el-icon>
          运行
        </el-button>
        <el-button @click="showTemplateDialog">
          <el-icon><DocumentCopy /></el-icon>
          模板
        </el-button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="editor-content">
      <!-- 侧边栏 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>测试用例列表</h3>
          <el-button size="small" @click="showTestCaseDialog">
            <el-icon><Plus /></el-icon>
            新建
          </el-button>
        </div>
        
        <div class="project-selector">
          <el-select v-model="selectedProjectId" placeholder="选择项目" @change="handleProjectChange">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </div>
        
        <div class="test-cases-list">
          <div
            v-for="testCase in testCases"
            :key="testCase.id"
            class="test-case-item"
            :class="{ active: selectedTestCase?.id === testCase.id }"
            @click="selectTestCase(testCase)"
          >
            <div class="test-case-info">
              <div class="test-case-name">{{ testCase.name }}</div>
              <div class="test-case-meta">
                <el-tag :type="getPriorityType(testCase.priority)" size="small">
                  {{ getPriorityText(testCase.priority) }}
                </el-tag>
                <el-tag :type="getStatusType(testCase.status)" size="small" style="margin-left: 8px;">
                  {{ getStatusText(testCase.status) }}
                </el-tag>
              </div>
            </div>
            <div class="test-case-actions">
              <el-button
                size="small"
                text
                @click.stop="editTestCase(testCase)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button
                size="small"
                text
                type="danger"
                @click.stop="deleteTestCase(testCase)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        
        <div v-if="testCases.length === 0" class="empty-state">
          <el-icon size="32" color="#c0c4cc"><Document /></el-icon>
          <p>暂无测试用例</p>
        </div>
      </div>

      <!-- 编辑器区域 -->
      <div class="editor-area">
        <div class="editor-header">
          <div class="editor-info">
            <h3 v-if="selectedTestCase">{{ selectedTestCase.name }}</h3>
            <span v-else>请选择测试用例</span>
          </div>
          <div class="editor-actions">
            <el-button size="small" @click="formatCode">
              <el-icon><Document /></el-icon>
              格式化
            </el-button>
            <el-button size="small" @click="clearCode">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
        </div>
        
        <div class="editor-wrapper">
          <div ref="monacoEditor" class="monaco-editor"></div>
        </div>
        
        <div class="output-panel">
          <div class="output-header">
            <span>输出</span>
            <el-button size="small" @click="clearOutput">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
          <div class="output-content" ref="outputContent">
            <div
              v-for="(log, index) in outputLogs"
              :key="index"
              class="log-item"
              :class="log.type"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模板对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="CAPL 代码模板"
      width="600px"
    >
      <div class="template-list">
        <div
          v-for="template in codeTemplates"
          :key="template.id"
          class="template-item"
          @click="applyTemplate(template)"
        >
          <div class="template-header">
            <div class="template-title">{{ template.name }}</div>
            <el-tag :type="template.type === 'basic' ? 'info' : 'success'" size="small">
              {{ template.type === 'basic' ? '基础' : '高级' }}
            </el-tag>
          </div>
          <div class="template-description">{{ template.description }}</div>
          <pre class="template-preview">{{ template.preview }}</pre>
        </div>
      </div>
    </el-dialog>

    <!-- 测试用例对话框 -->
    <el-dialog
      v-model="testCaseDialogVisible"
      :title="editingTestCase ? '编辑测试用例' : '新建测试用例'"
      width="500px"
      @close="resetTestCaseForm"
    >
      <el-form
        ref="testCaseFormRef"
        :model="testCaseForm"
        :rules="testCaseRules"
        label-width="100px"
      >
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
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as monaco from 'monaco-editor'
import localDataManager from '../services/localStorage.js'

// 编辑器状态
const loading = ref(false)
const saving = ref(false)
const running = ref(false)
const monacoEditor = ref(null)
const outputContent = ref(null)
let editor = null

// 数据状态
const projects = ref([])
const testCases = ref([])
const selectedProjectId = ref('')
const selectedTestCase = ref(null)

// 输出日志
const outputLogs = ref([])

// 对话框状态
const templateDialogVisible = ref(false)
const testCaseDialogVisible = ref(false)
const editingTestCase = ref(false)
const savingTestCase = ref(false)

// 表单引用
const testCaseFormRef = ref(null)
const testCaseForm = reactive({
  id: '',
  projectId: '',
  name: '',
  priority: 'MEDIUM',
  description: ''
})

const testCaseRules = {
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

// CAPL 代码模板
const codeTemplates = ref([
  {
    id: 'basic',
    name: '基础测试模板',
    type: 'basic',
    description: '基本的CAPL测试框架',
    preview: 'variables {\n  // 变量定义\n}\n\non start {\n  // 测试开始\n  output(\"测试开始\");\n}\n\non message CAN1.* {\n  // 消息处理\n}\n\non timer testTimer {\n  // 定时器处理\n}\n\non key 'a' {\n  // 按键处理\n}',
    code: `variables {
  int testCounter = 0;
  message CAN1 msg1;
  timer testTimer;
}

on start {
  output("测试开始");
  testCounter = 0;
  setTimer(testTimer, 1000);
}

on message CAN1.* {
  output("收到消息: %d", this.id);
  testCounter++;
}

on timer testTimer {
  output("定时器触发，计数: %d", testCounter);
  if (testCounter < 10) {
    setTimer(testTimer, 1000);
  }
}

on key 'a' {
  output("按键 A 被按下");
  msg1.id = 0x123;
  msg1.dlc = 8;
  msg1.byte(0) = 0x11;
  output(msg1);
}
  },
  {
    id: 'can-message',
    name: 'CAN消息测试',
    type: 'advanced',
    description: 'CAN消息发送和接收测试',
    preview: 'variables {\n  message CAN1 txMsg;\n  message CAN1 rxMsg;\n  int messageCount = 0;\n}\n\non start {\n  // 初始化消息\n  txMsg.id = 0x123;\n  txMsg.dlc = 8;\n}\n\non message 0x123 {\n  // 接收特定消息\n}',
    code: `variables {
  message CAN1 txMsg;
  message CAN1 rxMsg;
  int messageCount = 0;
  int testPassed = 0;
}

on start {
  output("CAN消息测试开始");
  
  // 初始化发送消息
  txMsg.id = 0x123;
  txMsg.dlc = 8;
  txMsg.byte(0) = 0xAA;
  txMsg.byte(1) = 0xBB;
  txMsg.byte(2) = 0xCC;
  txMsg.byte(3) = 0xDD;
  
  // 发送测试消息
  output(txMsg);
  setTimer(this, 2000);
}

on message 0x123 {
  output("收到消息 ID: 0x123");
  messageCount++;
  
  // 验证消息内容
  if (this.byte(0) == 0xAA && this.byte(1) == 0xBB) {
    output("消息内容验证通过");
    testPassed = 1;
  } else {
    output("消息内容验证失败");
  }
}

on timer this {
  output("测试完成 - 收到消息数: %d", messageCount);
  if (testPassed) {
    output("测试通过!");
  } else {
    output("测试失败!");
  }
}`
  },
  {
    id: 'signal-test',
    name: '信号测试',
    type: 'advanced',
    description: '信号值测试和验证',
    preview: 'variables {\n  msTimer cycleTimer;\n  int currentValue = 0;\n}\n\non start {\n  setTimer(cycleTimer, 100);\n}\n\non timer cycleTimer {\n  // 周期性测试\n}',
    code: `variables {
  msTimer cycleTimer;
  int currentValue = 0;
  int testStep = 0;
  float signalValue = 0.0;
}

on start {
  output("信号测试开始");
  setTimer(cycleTimer, 100);
  
  // 初始化信号
  @sysvar::Test::EngineSpeed = 1000.0;
  @sysvar::Test::VehicleSpeed = 50.0;
}

on timer cycleTimer {
  testStep++;
  
  switch (testStep) {
    case 1:
      // 测试发动机转速
      @sysvar::Test::EngineSpeed = 2000.0;
      output("设置发动机转速: 2000 RPM");
      break;
      
    case 2:
      // 验证信号值
      signalValue = @sysvar::Test::EngineSpeed;
      if (signalValue >= 1950.0 && signalValue <= 2050.0) {
        output("发动机转速测试通过: %.1f RPM", signalValue);
      } else {
        output("发动机转速测试失败: %.1f RPM", signalValue);
      }
      break;
      
    case 3:
      // 测试车速
      @sysvar::Test::VehicleSpeed = 80.0;
      output("设置车速: 80 km/h");
      break;
      
    case 4:
      signalValue = @sysvar::Test::VehicleSpeed;
      if (signalValue >= 75.0 && signalValue <= 85.0) {
        output("车速测试通过: %.1f km/h", signalValue);
      } else {
        output("车速测试失败: %.1f km/h", signalValue);
      }
      
      // 测试完成
      output("信号测试完成");
      cancelTimer(cycleTimer);
      break;
  }
  
  if (testStep < 4) {
    setTimer(cycleTimer, 1000);
  }
}`
  }
])

// 生命周期
onMounted(() => {
  loadData()
  initMonacoEditor()
})

// 监听项目变化
watch(selectedProjectId, (newVal) => {
  if (newVal) {
    loadTestCases(newVal)
  }
})

// 初始化 Monaco Editor
const initMonacoEditor = () => {
  nextTick(() => {
    if (monacoEditor.value) {
      // 注册 CAPL 语言
      monaco.languages.register({ id: 'capl' })
      
      // 定义 CAPL 语言语法高亮
      monaco.languages.setMonarchTokensProvider('capl', {
        keywords: [
          'variables', 'on', 'start', 'message', 'timer', 'msTimer',
          'this', 'output', 'setTimer', 'cancelTimer', 'if', 'else',
          'switch', 'case', 'default', 'break', 'continue', 'for',
          'while', 'return', 'int', 'float', 'char', 'byte', 'word',
          'dword', 'qword', 'void', 'const', 'static', 'extern'
        ],
        operators: [
          '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
          '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^',
          '%', '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
          '^=', '%=', '<<=', '>>=', '>>>='
        ],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        tokenizer: {
          root: [
            [/[a-z_$][\w$]*/, {
              cases: {
                '@keywords': 'keyword',
                '@default': 'identifier'
              }
            }],
            [/[A-Z][\w\$]*/, 'type.identifier'],
            [/\d+/, 'number'],
            [/".*?"/, 'string'],
            [/'.*?'/, 'string'],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
            [/@symbols/, {
              cases: {
                '@operators': 'operator',
                '@default': ''
              }
            }],
            [/\s+/, 'white']
          ],
          comment: [
            [/[^\/*]+/, 'comment'],
            [/\/\*/, 'comment', '@push'],
            [/\*\//, 'comment', '@pop'],
            [/[\/*]/, 'comment']
          ]
        }
      })
      
      // 定义主题
      monaco.editor.defineTheme('caplTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '#569CD6' },
          { token: 'identifier', foreground: '#9CDCFE' },
          { token: 'number', foreground: '#B5CEA8' },
          { token: 'string', foreground: '#CE9178' },
          { token: 'comment', foreground: '#6A9955' },
          { token: 'operator', foreground: '#D4D4D4' }
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
          'editorLineNumber.foreground': '#858585',
          'editor.selectionBackground': '#264f78',
          'editor.lineHighlightBackground': '#2d2d30'
        }
      })
      
      // 创建编辑器
      editor = monaco.editor.create(monacoEditor.value, {
        value: '',
        language: 'capl',
        theme: 'caplTheme',
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        minimap: { enabled: true },
        wordWrap: 'on',
        folding: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
          other: true,
          comments: true,
          strings: true
        }
      })
      
      // 监听内容变化
      editor.onDidChangeModelContent(() => {
        if (selectedTestCase.value) {
          selectedTestCase.value.script = editor.getValue()
          localDataManager.updateTestCase(selectedTestCase.value.id, {
            script: selectedTestCase.value.script
          })
        }
      })
    }
  })
}

// 数据加载
const loadData = () => {
  loading.value = true
  try {
    projects.value = localDataManager.getProjects()
    if (projects.value.length > 0 && !selectedProjectId.value) {
      selectedProjectId.value = projects.value[0].id
    }
  } catch (error) {
    ElMessage.error('加载数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadTestCases = (projectId) => {
  testCases.value = localDataManager.getTestCases(projectId)
  if (testCases.value.length > 0 && !selectedTestCase.value) {
    selectTestCase(testCases.value[0])
  }
}

const handleProjectChange = () => {
  if (selectedProjectId.value) {
    loadTestCases(selectedProjectId.value)
  }
}

const refreshData = () => {
  loadData()
  if (selectedProjectId.value) {
    loadTestCases(selectedProjectId.value)
  }
  ElMessage.success('已刷新数据')
}

// 测试用例选择
const selectTestCase = (testCase) => {
  selectedTestCase.value = testCase
  if (editor && testCase.script) {
    editor.setValue(testCase.script)
  } else if (editor) {
    editor.setValue('')
  }
}

// 编辑器操作
const formatCode = () => {
  if (editor) {
    editor.getAction('editor.action.formatDocument').run()
    ElMessage.success('代码已格式化')
  }
}

const clearCode = () => {
  if (editor) {
    editor.setValue('')
    ElMessage.success('代码已清空')
  }
}

const clearOutput = () => {
  outputLogs.value = []
}

// 模板操作
const showTemplateDialog = () => {
  templateDialogVisible.value = true
}

const applyTemplate = (template) => {
  if (editor) {
    editor.setValue(template.code)
    templateDialogVisible.value = false
    ElMessage.success(`已应用模板: ${template.name}`)
  }
}

// 保存和运行
const saveScript = async () => {
  if (!selectedTestCase.value) {
    ElMessage.warning('请先选择测试用例')
    return
  }
  
  saving.value = true
  try {
    const code = editor ? editor.getValue() : ''
    selectedTestCase.value.script = code
    localDataManager.updateTestCase(selectedTestCase.value.id, {
      script: code
    })
    ElMessage.success('代码保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

const runTest = async () => {
  if (!selectedTestCase.value) {
    ElMessage.warning('请先选择测试用例')
    return
  }
  
  running.value = true
  try {
    addOutputLog('info', '开始执行测试...')
    
    // 模拟测试执行
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const code = editor ? editor.getValue() : ''
    if (!code.trim()) {
      addOutputLog('warning', '测试代码为空')
      return
    }
    
    // 简单的代码验证
    if (code.includes('on start') && code.includes('output')) {
      addOutputLog('success', '代码结构验证通过')
    } else {
      addOutputLog('warning', '代码可能缺少必要的结构')
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟执行结果
    const success = Math.random() > 0.3 // 70% 成功率
    
    if (success) {
      addOutputLog('success', '测试执行完成 - 通过')
      
      // 更新测试用例状态
      selectedTestCase.value.status = 'PASSED'
      localDataManager.updateTestCase(selectedTestCase.value.id, {
        status: 'PASSED'
      })
      
      // 记录执行结果
      const result = {
        id: `result_${Date.now()}`,
        testCaseId: selectedTestCase.value.id,
        projectId: selectedTestCase.value.projectId,
        status: 'PASSED',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 1500,
        output: outputLogs.value.map(log => log.message).join('\n'),
        steps: [
          { name: '代码验证', status: 'PASSED', duration: 500 },
          { name: '执行测试', status: 'PASSED', duration: 1000 }
        ]
      }
      localDataManager.addExecutionRecord(result)
      
    } else {
      addOutputLog('error', '测试执行失败')
      
      selectedTestCase.value.status = 'FAILED'
      localDataManager.updateTestCase(selectedTestCase.value.id, {
        status: 'FAILED'
      })
      
      const result = {
        id: `result_${Date.now()}`,
        testCaseId: selectedTestCase.value.id,
        projectId: selectedTestCase.value.projectId,
        status: 'FAILED',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 1500,
        output: outputLogs.value.map(log => log.message).join('\n'),
        error: '模拟执行错误',
        steps: [
          { name: '代码验证', status: 'PASSED', duration: 500 },
          { name: '执行测试', status: 'FAILED', duration: 1000 }
        ]
      }
      localDataManager.addExecutionRecord(result)
    }
    
  } catch (error) {
    addOutputLog('error', '测试执行出错: ' + error.message)
  } finally {
    running.value = false
  }
}

// 测试用例管理
const showTestCaseDialog = () => {
  editingTestCase.value = false
  testCaseDialogVisible.value = true
}

const editTestCase = (testCase) => {
  editingTestCase.value = true
  Object.assign(testCaseForm, {
    id: testCase.id,
    projectId: testCase.projectId,
    name: testCase.name,
    priority: testCase.priority,
    description: testCase.description || ''
  })
  testCaseDialogVisible.value = true
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
    
    // 重新加载测试用例
    loadTestCases(selectedProjectId.value)
    
    // 如果删除的是当前选中的测试用例，清空编辑器
    if (selectedTestCase.value?.id === testCase.id) {
      selectedTestCase.value = null
      if (editor) {
        editor.setValue('')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
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
        projectId: selectedProjectId.value,
        status: 'READY',
        script: '',
        createdAt: new Date().toISOString()
      }
      localDataManager.addTestCase(newTestCase)
      ElMessage.success('测试用例创建成功')
    }
    
    testCaseDialogVisible.value = false
    loadTestCases(selectedProjectId.value)
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    savingTestCase.value = false
  }
}

const resetTestCaseForm = () => {
  if (testCaseFormRef.value) {
    testCaseFormRef.value.resetFields()
  }
  Object.assign(testCaseForm, {
    id: '',
    projectId: selectedProjectId.value,
    name: '',
    priority: 'MEDIUM',
    description: ''
  })
}

// 工具函数
const addOutputLog = (type, message) => {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN')
  outputLogs.value.push({
    type,
    message,
    time: timeStr
  })
  
  // 自动滚动到底部
  nextTick(() => {
    if (outputContent.value) {
      outputContent.value.scrollTop = outputContent.value.scrollHeight
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
</script>

<style scoped>
.editor-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
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

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.sidebar-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.project-selector {
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.test-cases-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.test-case-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-case-item:hover {
  background: #e9ecef;
  transform: translateX(2px);
}

.test-case-item.active {
  background: #409eff;
  color: white;
}

.test-case-item.active .test-case-name {
  color: white;
}

.test-case-info {
  flex: 1;
}

.test-case-name {
  font-weight: 500;
  margin-bottom: 4px;
  color: #2c3e50;
}

.test-case-meta {
  display: flex;
  gap: 8px;
}

.test-case-actions {
  display: flex;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state p {
  margin: 10px 0 0 0;
  font-size: 14px;
}

.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.editor-info h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
  background: #1e1e1e;
}

.monaco-editor {
  width: 100%;
  height: 100%;
}

.output-panel {
  height: 200px;
  background: #1e1e1e;
  border-top: 1px solid #333;
  display: flex;
  flex-direction: column;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2d2d30;
  border-bottom: 1px solid #333;
  color: #cccccc;
  font-size: 14px;
  font-weight: 500;
}

.output-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.log-item {
  margin-bottom: 4px;
  display: flex;
  gap: 10px;
}

.log-time {
  color: #858585;
  white-space: nowrap;
}

.log-message {
  color: #d4d4d4;
  word-break: break-word;
}

.log-item.success .log-message {
  color: #4ec9b0;
}

.log-item.error .log-message {
  color: #f44747;
}

.log-item.warning .log-message {
  color: #ffcc02;
}

.log-item.info .log-message {
  color: #9cdcfe;
}

.template-list {
  max-height: 400px;
  overflow-y: auto;
}

.template-item {
  padding: 16px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.template-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.template-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.template-description {
  color: #606266;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.template-preview {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
  white-space: pre-wrap;
  max-height: 100px;
  overflow: hidden;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .editor-container {
    height: auto;
    min-height: 100vh;
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
  
  .editor-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: 300px;
  }
  
  .test-case-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .test-case-actions {
    align-self: flex-end;
  }
  
  .editor-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .editor-actions {
    justify-content: center;
  }
  
  .output-panel {
    height: 150px;
  }
  
  .dialog-footer {
    flex-direction: column;
  }
}
</style>