// 本地存储管理器 - 基于浏览器LocalStorage
class LocalDataManager {
  constructor() {
    this.storageKey = 'capl_test_platform_v2'
    this.initializeData()
  }

  // 初始化数据结构
  initializeData() {
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        projects: [],
        testCases: [],
        testSteps: [],
        caplScripts: [],
        testExecutions: [],
        configs: {
          exportFormat: 'excel',
          autoSave: true,
          theme: 'light'
        },
        version: '2.0.0'
      }
      localStorage.setItem(this.storageKey, JSON.stringify(initialData))
    }
  }

  // 获取所有数据
  getAllData() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('读取本地数据失败:', error)
      return null
    }
  }

  // 保存数据
  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('保存本地数据失败:', error)
      return false
    }
  }

  // 生成唯一ID
  generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 项目相关操作
  getProjects() {
    const data = this.getAllData()
    return data ? data.projects : []
  }

  getProject(id) {
    const data = this.getAllData()
    if (!data) return null
    return data.projects.find(p => p.id === id)
  }

  createProject(projectData) {
    const data = this.getAllData()
    if (!data) return null

    const newProject = {
      id: this.generateId('proj'),
      name: projectData.name || '新项目',
      description: projectData.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    data.projects.push(newProject)
    const success = this.saveData(data)
    return success ? newProject : null
  }

  updateProject(id, updateData) {
    const data = this.getAllData()
    if (!data) return false

    const projectIndex = data.projects.findIndex(p => p.id === id)
    if (projectIndex === -1) return false

    data.projects[projectIndex] = {
      ...data.projects[projectIndex],
      ...updateData,
      id, // 确保ID不变
      updatedAt: new Date().toISOString()
    }

    return this.saveData(data)
  }

  deleteProject(id) {
    const data = this.getAllData()
    if (!data) return false

    // 删除项目下的所有测试用例
    data.testCases = data.testCases.filter(tc => tc.projectId !== id)
    data.testSteps = data.testSteps.filter(ts => {
      const testCase = data.testCases.find(tc => tc.id === ts.testCaseId)
      return testCase && testCase.projectId !== id
    })
    data.caplScripts = data.caplScripts.filter(cs => cs.projectId !== id)
    data.testExecutions = data.testExecutions.filter(te => {
      const testCase = data.testCases.find(tc => tc.id === te.testCaseId)
      return testCase && testCase.projectId !== id
    })

    // 删除项目
    data.projects = data.projects.filter(p => p.id !== id)

    return this.saveData(data)
  }

  // 测试用例相关操作
  getTestCases(projectId = null) {
    const data = this.getAllData()
    if (!data) return []

    if (projectId) {
      return data.testCases.filter(tc => tc.projectId === projectId)
    }
    return data.testCases
  }

  getTestCase(id) {
    const data = this.getAllData()
    if (!data) return null
    return data.testCases.find(tc => tc.id === id)
  }

  createTestCase(testCaseData) {
    const data = this.getAllData()
    if (!data) return null

    const newTestCase = {
      id: this.generateId('case'),
      projectId: testCaseData.projectId,
      name: testCaseData.name || '新测试用例',
      description: testCaseData.description || '',
      priority: testCaseData.priority || 'MEDIUM',
      status: testCaseData.status || 'DRAFT',
      caplCode: testCaseData.caplCode || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    data.testCases.push(newTestCase)
    const success = this.saveData(data)
    return success ? newTestCase : null
  }

  updateTestCase(id, updateData) {
    const data = this.getAllData()
    if (!data) return false

    const testCaseIndex = data.testCases.findIndex(tc => tc.id === id)
    if (testCaseIndex === -1) return false

    data.testCases[testCaseIndex] = {
      ...data.testCases[testCaseIndex],
      ...updateData,
      id, // 确保ID不变
      updatedAt: new Date().toISOString()
    }

    return this.saveData(data)
  }

  deleteTestCase(id) {
    const data = this.getAllData()
    if (!data) return false

    // 删除相关的测试步骤
    data.testSteps = data.testSteps.filter(ts => ts.testCaseId !== id)
    
    // 删除相关的执行记录
    data.testExecutions = data.testExecutions.filter(te => te.testCaseId !== id)

    // 删除测试用例
    data.testCases = data.testCases.filter(tc => tc.id !== id)

    return this.saveData(data)
  }

  // 测试步骤相关操作
  getTestSteps(testCaseId) {
    const data = this.getAllData()
    if (!data) return []
    return data.testSteps.filter(ts => ts.testCaseId === testCaseId)
  }

  createTestStep(stepData) {
    const data = this.getAllData()
    if (!data) return null

    const newStep = {
      id: this.generateId('step'),
      testCaseId: stepData.testCaseId,
      stepNumber: stepData.stepNumber || 1,
      actionDescription: stepData.actionDescription || '',
      expectedResult: stepData.expectedResult || '',
      createdAt: new Date().toISOString()
    }

    data.testSteps.push(newStep)
    const success = this.saveData(data)
    return success ? newStep : null
  }

  updateTestStep(id, updateData) {
    const data = this.getAllData()
    if (!data) return false

    const stepIndex = data.testSteps.findIndex(ts => ts.id === id)
    if (stepIndex === -1) return false

    data.testSteps[stepIndex] = {
      ...data.testSteps[stepIndex],
      ...updateData,
      id, // 确保ID不变
      updatedAt: new Date().toISOString()
    }

    return this.saveData(data)
  }

  deleteTestStep(id) {
    const data = this.getAllData()
    if (!data) return false

    data.testSteps = data.testSteps.filter(ts => ts.id !== id)
    return this.saveData(data)
  }

  // CAPL脚本相关操作
  getCAPLScripts(projectId = null) {
    const data = this.getAllData()
    if (!data) return []

    if (projectId) {
      return data.caplScripts.filter(cs => cs.projectId === projectId)
    }
    return data.caplScripts
  }

  createCAPLScript(scriptData) {
    const data = this.getAllData()
    if (!data) return null

    const newScript = {
      id: this.generateId('script'),
      projectId: scriptData.projectId,
      name: scriptData.name || '新CAPL脚本',
      description: scriptData.description || '',
      codeContent: scriptData.codeContent || '',
      filePath: scriptData.filePath || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    data.caplScripts.push(newScript)
    const success = this.saveData(data)
    return success ? newScript : null
  }

  updateCAPLScript(id, updateData) {
    const data = this.getAllData()
    if (!data) return false

    const scriptIndex = data.caplScripts.findIndex(cs => cs.id === id)
    if (scriptIndex === -1) return false

    data.caplScripts[scriptIndex] = {
      ...data.caplScripts[scriptIndex],
      ...updateData,
      id, // 确保ID不变
      updatedAt: new Date().toISOString()
    }

    return this.saveData(data)
  }

  deleteCAPLScript(id) {
    const data = this.getAllData()
    if (!data) return false

    data.caplScripts = data.caplScripts.filter(cs => cs.id !== id)
    return this.saveData(data)
  }

  // 测试执行记录相关操作
  getTestExecutions(projectId = null, testCaseId = null) {
    const data = this.getAllData()
    if (!data) return []

    let executions = data.testExecutions

    if (projectId) {
      executions = executions.filter(te => {
        const testCase = data.testCases.find(tc => tc.id === te.testCaseId)
        return testCase && testCase.projectId === projectId
      })
    }

    if (testCaseId) {
      executions = executions.filter(te => te.testCaseId === testCaseId)
    }

    return executions
  }

  createTestExecution(executionData) {
    const data = this.getAllData()
    if (!data) return null

    const testCase = data.testCases.find(tc => tc.id === executionData.testCaseId)
    const project = testCase ? data.projects.find(p => p.id === testCase.projectId) : null

    const newExecution = {
      id: this.generateId('exec'),
      testCaseId: executionData.testCaseId,
      testCaseName: testCase ? testCase.name : '未知测试用例',
      projectId: project ? project.id : null,
      projectName: project ? project.name : '未知项目',
      executionStatus: executionData.executionStatus || 'PENDING',
      startTime: executionData.startTime || new Date().toISOString(),
      endTime: executionData.endTime || null,
      duration: executionData.duration || 0,
      resultSummary: executionData.resultSummary || '',
      status: executionData.status || 'pending',
      message: executionData.message || '',
      output: executionData.output || '',
      error: executionData.error || null,
      createdAt: new Date().toISOString()
    }

    data.testExecutions.push(newExecution)
    const success = this.saveData(data)
    return success ? newExecution : null
  }

  // 配置相关操作
  getConfig(key = null) {
    const data = this.getAllData()
    if (!data) return null

    if (key) {
      return data.configs[key]
    }
    return data.configs
  }

  setConfig(key, value) {
    const data = this.getAllData()
    if (!data) return false

    data.configs[key] = value
    return this.saveData(data)
  }

  // 数据备份和恢复
  exportAllData() {
    const data = this.getAllData()
    if (!data) return null

    return {
      ...data,
      exportTime: new Date().toISOString(),
      exportVersion: data.version
    }
  }

  importAllData(importedData) {
    if (!importedData || !importedData.version) {
      throw new Error('无效的数据格式')
    }

    // 数据版本兼容性检查
    if (importedData.version !== '2.0.0') {
      console.warn('数据版本不匹配，可能导致兼容性问题')
    }

    // 备份当前数据
    const currentData = this.getAllData()
    
    try {
      // 导入新数据
      const success = this.saveData(importedData)
      if (!success) {
        // 恢复备份
        this.saveData(currentData)
        throw new Error('数据导入失败')
      }
      return true
    } catch (error) {
      // 恢复备份
      this.saveData(currentData)
      throw error
    }
  }

  // 清空所有数据
  clearAllData() {
    const emptyData = {
      projects: [],
      testCases: [],
      testSteps: [],
      caplScripts: [],
      testExecutions: [],
      configs: {
        exportFormat: 'excel',
        autoSave: true,
        theme: 'light'
      },
      version: '2.0.0'
    }
    return this.saveData(emptyData)
  }

  // 获取存储使用情况
  getStorageUsage() {
    try {
      const allData = this.getAllData()
      if (!allData) return { used: 0, total: 0, percentage: 0 }
      
      const dataString = JSON.stringify(allData)
      const usedBytes = new Blob([dataString]).size
      const totalBytes = 5 * 1024 * 1024 // 5MB (LocalStorage限制)
      const percentage = Math.round((usedBytes / totalBytes) * 100)
      
      return {
        used: Math.round(usedBytes / 1024), // KB
        total: Math.round(totalBytes / 1024), // KB
        percentage
      }
    } catch (error) {
      console.error('计算存储使用情况失败:', error)
      return { used: 0, total: 0, percentage: 0 }
    }
  }
}

// 创建单例实例
const localDataManager = new LocalDataManager()

export default localDataManager