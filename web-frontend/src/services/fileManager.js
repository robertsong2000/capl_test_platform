// 文件管理器 - 基于HTML5 File API
import localDataManager from './localStorage.js'

class FileManager {
  constructor() {
    this.supportedFormats = {
      import: ['.json', '.xlsx', '.xls', '.csv'],
      export: ['json', 'excel', 'csv', 'html']
    }
  }

  // 文件选择器
  async selectFile(accept = '.json,.xlsx,.xls,.csv') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.multiple = false
      
      input.onchange = (event) => {
        const file = event.target.files[0]
        if (file) {
          resolve(file)
        } else {
          reject(new Error('未选择文件'))
        }
      }
      
      input.click()
    })
  }

  // 读取文件内容
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        resolve(event.target.result)
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      // 根据文件类型选择读取方式
      if (file.name.endsWith('.json')) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }

  // 保存文件
  downloadFile(content, filename, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }

  // 数据导入
  async importData(format = 'auto') {
    try {
      const file = await this.selectFile()
      const content = await this.readFile(file)
      
      let data
      
      if (file.name.endsWith('.json') || format === 'json') {
        data = JSON.parse(content)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || format === 'excel') {
        data = await this.parseExcel(content)
      } else if (file.name.endsWith('.csv') || format === 'csv') {
        data = await this.parseCSV(content)
      } else {
        throw new Error('不支持的文件格式')
      }
      
      // 验证数据格式
      if (!this.validateImportData(data)) {
        throw new Error('数据格式验证失败')
      }
      
      return {
        success: true,
        data: data,
        filename: file.name,
        format: this.detectFormat(file.name)
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        filename: null,
        format: null
      }
    }
  }

  // 数据导出
  async exportData(format = 'json', filename = null) {
    try {
      const data = localDataManager.exportAllData()
      
      if (!data) {
        throw new Error('没有可导出的数据')
      }
      
      let content, mimeType, defaultFilename
      
      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2)
          mimeType = 'application/json'
          defaultFilename = `capl_test_data_${new Date().toISOString().split('T')[0]}.json`
          break
          
        case 'excel':
          content = await this.generateExcel(data)
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          defaultFilename = `capl_test_data_${new Date().toISOString().split('T')[0]}.xlsx`
          break
          
        case 'csv':
          content = await this.generateCSV(data)
          mimeType = 'text/csv'
          defaultFilename = `capl_test_data_${new Date().toISOString().split('T')[0]}.csv`
          break
          
        case 'html':
          content = await this.generateHTMLReport(data)
          mimeType = 'text/html'
          defaultFilename = `capl_test_report_${new Date().toISOString().split('T')[0]}.html`
          break
          
        default:
          throw new Error('不支持的导出格式')
      }
      
      const finalFilename = filename || defaultFilename
      this.downloadFile(content, finalFilename, mimeType)
      
      return {
        success: true,
        filename: finalFilename,
        format: format,
        size: content.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        filename: null,
        format: null
      }
    }
  }

  // 生成测试报告
  async generateTestReport(testExecutions, format = 'html') {
    try {
      const projects = localDataManager.getProjects()
      const testCases = localDataManager.getTestCases()
      
      // 统计信息
      const stats = {
        total: testExecutions.length,
        passed: testExecutions.filter(te => te.status === 'passed').length,
        failed: testExecutions.filter(te => te.status === 'failed').length,
        pending: testExecutions.filter(te => te.status === 'pending').length,
        projects: new Set(testExecutions.map(te => te.projectName)).size,
        testCases: new Set(testExecutions.map(te => te.testCaseName)).size
      }
      
      let content, mimeType, filename
      
      switch (format) {
        case 'html':
          content = this.generateHTMLReportContent(testExecutions, stats, projects, testCases)
          mimeType = 'text/html'
          filename = `test_report_${new Date().toISOString().split('T')[0]}.html`
          break
          
        case 'json':
          content = JSON.stringify({
            reportInfo: {
              generatedAt: new Date().toISOString(),
              format: 'json',
              version: '2.0'
            },
            statistics: stats,
            testExecutions: testExecutions,
            projects: projects,
            testCases: testCases
          }, null, 2)
          mimeType = 'application/json'
          filename = `test_report_${new Date().toISOString().split('T')[0]}.json`
          break
          
        default:
          throw new Error('不支持的报告格式')
      }
      
      this.downloadFile(content, filename, mimeType)
      
      return {
        success: true,
        filename: filename,
        format: format,
        stats: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 生成HTML报告内容
  generateHTMLReportContent(testExecutions, stats, projects, testCases) {
    const reportDate = new Date().toLocaleDateString('zh-CN')
    const reportTime = new Date().toLocaleTimeString('zh-CN')
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CAPL测试报告 - ${reportDate}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header .subtitle { margin: 10px 0 0 0; opacity: 0.9; }
        .stats { display: flex; justify-content: space-around; padding: 30px; background: #fafafa; border-bottom: 1px solid #e0e0e0; }
        .stat-item { text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #333; margin-bottom: 5px; }
        .stat-label { color: #666; font-size: 0.9em; }
        .passed { color: #4caf50; }
        .failed { color: #f44336; }
        .pending { color: #ff9800; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; background: white; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        .table th { background: #f8f9fa; font-weight: 600; color: #555; }
        .table tr:hover { background: #f5f5f5; }
        .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 500; }
        .status-passed { background: #e8f5e8; color: #2e7d32; }
        .status-failed { background: #ffebee; color: #c62828; }
        .status-pending { background: #fff3e0; color: #ef6c00; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 0.9em; border-top: 1px solid #e0e0e0; }
        .timestamp { color: #999; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CAPL测试报告</h1>
            <div class="subtitle">CAPL Test Platform - Web Frontend</div>
            <div class="timestamp">生成时间: ${reportDate} ${reportTime}</div>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">总执行数</div>
            </div>
            <div class="stat-item">
                <div class="stat-number passed">${stats.passed}</div>
                <div class="stat-label">通过</div>
            </div>
            <div class="stat-item">
                <div class="stat-number failed">${stats.failed}</div>
                <div class="stat-label">失败</div>
            </div>
            <div class="stat-item">
                <div class="stat-number pending">${stats.pending}</div>
                <div class="stat-label">待执行</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.projects}</div>
                <div class="stat-label">项目数</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.testCases}</div>
                <div class="stat-label">测试用例数</div>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>执行详情</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>项目名称</th>
                            <th>测试用例</th>
                            <th>状态</th>
                            <th>开始时间</th>
                            <th>持续时间</th>
                            <th>结果摘要</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${testExecutions.map(execution => `
                        <tr>
                            <td>${execution.projectName}</td>
                            <td>${execution.testCaseName}</td>
                            <td><span class="status-badge status-${execution.status}">${this.getStatusText(execution.status)}</span></td>
                            <td>${new Date(execution.startTime).toLocaleString('zh-CN')}</td>
                            <td>${execution.duration}ms</td>
                            <td>${execution.resultSummary || '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>项目概览</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>项目名称</th>
                            <th>描述</th>
                            <th>创建时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${projects.map(project => `
                        <tr>
                            <td>${project.name}</td>
                            <td>${project.description || '-'}</td>
                            <td>${new Date(project.createdAt).toLocaleString('zh-CN')}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            由 CAPL Test Platform - Web Frontend 生成 | 
            <span class="timestamp">生成时间: ${new Date().toISOString()}</span>
        </div>
    </div>
</body>
</html>`
  }

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'passed': '通过',
      'failed': '失败',
      'pending': '待执行',
      'running': '执行中',
      'error': '错误'
    }
    return statusMap[status] || status
  }

  // 验证导入数据格式
  validateImportData(data) {
    if (!data || typeof data !== 'object') {
      return false
    }
    
    // 检查必需字段
    const requiredFields = ['projects', 'testCases', 'testSteps', 'caplScripts', 'testExecutions', 'configs']
    for (const field of requiredFields) {
      if (!Array.isArray(data[field]) && typeof data[field] !== 'object') {
        return false
      }
    }
    
    return true
  }

  // 检测文件格式
  detectFormat(filename) {
    if (filename.endsWith('.json')) return 'json'
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return 'excel'
    if (filename.endsWith('.csv')) return 'csv'
    if (filename.endsWith('.html')) return 'html'
    return 'unknown'
  }

  // 解析Excel文件（简化实现）
  async parseExcel(content) {
    // 这里应该使用专业的Excel解析库，如xlsx.js
    // 为了简化，这里返回模拟数据
    throw new Error('Excel解析功能需要额外的库支持')
  }

  // 生成Excel文件（简化实现）
  async generateExcel(data) {
    // 这里应该使用专业的Excel生成库，如xlsx.js
    // 为了简化，这里返回JSON格式的数据
    return JSON.stringify(data, null, 2)
  }

  // 解析CSV文件（简化实现）
  async parseCSV(content) {
    // 这里应该使用专业的CSV解析库
    // 为了简化，这里返回模拟数据
    throw new Error('CSV解析功能需要额外的库支持')
  }

  // 生成CSV文件（简化实现）
  async generateCSV(data) {
    // 这里应该使用专业的CSV生成库
    // 为了简化，这里返回JSON格式的数据
    return JSON.stringify(data, null, 2)
  }

  // 生成HTML报告（简化实现）
  async generateHTMLReport(data) {
    // 这里应该生成完整的HTML报告
    // 为了简化，这里返回JSON格式的数据
    return JSON.stringify(data, null, 2)
  }
}

// 创建单例实例
const fileManager = new FileManager()

export default fileManager