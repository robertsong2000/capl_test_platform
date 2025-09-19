# CANoe测试用例管理系统 - Web前端设计方案

## 1. 简化架构设计

### 1.1 整体架构
采用纯Web前端架构，通过浏览器访问，无需安装桌面应用。

```
┌─────────────────────────────────────────────────────────────┐
│                      Web浏览器                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │  测试用例   │  CAPL编辑器  │  测试执行   │  结果展示   │  │
│  │  管理界面   │  (Monaco)   │  控制台     │  界面       │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                  前端数据处理层                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │  本地存储   │  文件操作   │  数据序列化 │  配置管理   │  │
│  │  (浏览器)   │  (HTML5)    │  (JSON)     │  (JSON)     │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选择（Web前端版）

#### 前端技术栈
- **框架**: Vue.js 3
- **UI组件**: Element Plus
- **代码编辑器**: Monaco Editor
- **数据存储**: 浏览器LocalStorage/IndexedDB
- **文件操作**: HTML5 File API
- **配置**: JSON文件

#### 数据处理
- **本地存储**: 浏览器本地存储API
- **文件导入导出**: HTML5文件操作API
- **数据序列化**: JSON格式存储
- **报告生成**: HTML模板 + 浏览器打印功能

## 2. 功能简化设计

### 2.1 核心功能（MVP版本）

#### 2.1.1 测试用例管理
- ✅ 测试用例创建/编辑/删除
- ✅ 测试步骤管理（增删改）
- ✅ 预期结果设置
- ✅ 简单的分类和搜索
- ❌ 复杂的权限管理（简化）
- ❌ 版本控制（后续版本添加）

#### 2.1.2 CAPL脚本管理
- ✅ 基本的CAPL代码编辑
- ✅ 语法高亮显示
- ✅ 脚本与测试用例关联
- ❌ 高级代码补全（后续版本）
- ❌ 在线编译检查（后续版本）

#### 2.1.3 测试执行
- ✅ 测试用例执行流程管理
- ✅ 执行状态跟踪
- ✅ 基本的结果收集
- ❌ CANoe集成（后续版本，需要后端支持）
- ❌ 批量执行（后续版本）

#### 2.1.4 结果管理
- ✅ 执行结果查看
- ✅ 简单的HTML报告
- ✅ 结果导出（Excel/PDF）
- ❌ 复杂的数据分析（后续版本）

### 2.2 界面简化

#### 主界面布局
```
┌─────────────────────────────────────────────────────────────┐
│  工具栏 [新建] [打开] [保存] [执行] [导出] [设置]             │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  项目树      │              工作区                          │
│  ├─项目A     │                                              │
│  │ ├─测试用例1 │         测试用例编辑区                     │
│  │ ├─测试用例2 │                                              │
│  │ └─CAPL脚本1 │                                              │
│  └─项目B     │                                              │
│    ├─测试用例3 │                                              │
│    └─CAPL脚本2 │                                              │
│             │                                              │
├─────────────┴───────────────────────────────────────────────┤
│  状态栏: 就绪 | 当前项目: XXX | CAPL状态: 已连接/未连接       │
└─────────────────────────────────────────────────────────────┘
```

## 3. 数据存储设计（Web前端版）

### 3.1 浏览器本地存储结构

#### 3.1.1 LocalStorage存储结构
```javascript
// 项目数据
const projects = [
  {
    id: 'proj_001',
    name: '项目A',
    description: '项目描述',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// 测试用例数据
const testCases = [
  {
    id: 'case_001',
    projectId: 'proj_001',
    name: '测试用例1',
    description: '用例描述',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// 测试步骤数据
const testSteps = [
  {
    id: 'step_001',
    testCaseId: 'case_001',
    stepNumber: 1,
    actionDescription: '操作步骤描述',
    expectedResult: '预期结果',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

// CAPL脚本数据
const caplScripts = [
  {
    id: 'script_001',
    name: 'CAPL脚本1',
    description: '脚本描述',
    codeContent: 'CAPL代码内容',
    filePath: 'local/path/to/script.can',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// 测试执行记录
const testExecutions = [
  {
    id: 'exec_001',
    testCaseId: 'case_001',
    executionStatus: 'COMPLETED',
    startTime: '2024-01-01T10:00:00.000Z',
    endTime: '2024-01-01T10:05:00.000Z',
    resultSummary: '执行成功',
    errorMessage: '',
    createdAt: '2024-01-01T10:00:00.000Z'
  }
];

// 系统配置
const systemConfigs = {
  canoePath: 'C:/Program Files/CANoe/canoe.exe',
  defaultProjectPath: 'C:/Projects',
  exportFormat: 'excel'
};
```

## 4. 核心模块设计

### 4.1 本地数据管理器
```javascript
// 使用浏览器LocalStorage的数据管理器
class LocalDataManager {
    constructor() {
        this.storageKey = 'capl_test_platform';
        this.initializeData();
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
                    autoSave: true
                }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }
    
    // 获取所有数据
    getAllData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }
    
    // 保存数据
    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
    
    // 测试用例相关操作
    getTestCases(projectId) {
        const data = this.getAllData();
        return data.testCases.filter(tc => tc.projectId === projectId);
    }
    
    createTestCase(testCase) {
        const data = this.getAllData();
        const newTestCase = {
            ...testCase,
            id: `case_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.testCases.push(newTestCase);
        this.saveData(data);
        return newTestCase;
    }
    
    // CAPL脚本相关操作
    saveCAPLScript(script) {
        const data = this.getAllData();
        const newScript = {
            ...script,
            id: `script_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.caplScripts.push(newScript);
        this.saveData(data);
        return newScript;
    }
    
    // 文件导出功能
    exportToFile(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    // 文件导入功能
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.saveData(data);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}
```

### 4.2 文件操作模块（Web版）
```javascript
// HTML5文件API封装
class FileManager {
    constructor() {
        this.supportedFormats = {
            import: ['.json', '.xlsx', '.xls'],
            export: ['.json', '.xlsx', '.html']
        };
    }
    
    // 文件导入
    async importFile(accept = '.json') {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) {
                    reject(new Error('未选择文件'));
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        resolve(data);
                    } catch (error) {
                        reject(new Error('文件格式错误'));
                    }
                };
                reader.onerror = () => reject(new Error('文件读取失败'));
                reader.readAsText(file);
            };
            input.click();
        });
    }
    
    // 文件导出
    exportFile(data, filename, format = 'json') {
        let content, mimeType;
        
        switch (format) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                break;
            case 'html':
                content = this.generateHTMLReport(data);
                mimeType = 'text/html';
                break;
            default:
                throw new Error('不支持的导出格式');
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    // 生成HTML报告
    generateHTMLReport(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>测试报告</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .pass { color: green; }
                    .fail { color: red; }
                </style>
            </head>
            <body>
                <h1>测试执行报告</h1>
                <p>生成时间: ${new Date().toLocaleString()}</p>
                <table>
                    <tr>
                        <th>测试用例</th>
                        <th>状态</th>
                        <th>执行时间</th>
                        <th>结果</th>
                    </tr>
                    ${data.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.status}</td>
                            <td>${item.startTime}</td>
                            <td class="${item.status.toLowerCase()}">${item.resultSummary}</td>
                        </tr>
                    `).join('')}
                </table>
            </body>
            </html>
        `;
    }
}
```

### 4.3 Excel导入导出模块
```javascript
// Excel处理工具类
class ExcelManager {
    async importFromExcel(filePath) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.worksheets[0];
        const testCases = [];
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // 跳过表头
                const testCase = {
                    name: row.getCell(1).value,
                    description: row.getCell(2).value,
                    priority: row.getCell(3).value,
                    steps: []
                };
                testCases.push(testCase);
            }
        });
        
        return testCases;
    }
    
    async exportToExcel(testCases, outputPath) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('测试用例');
        
        // 添加表头
        worksheet.addRow(['用例名称', '描述', '优先级', '状态', '创建时间']);
        
        // 添加数据
        testCases.forEach(testCase => {
            worksheet.addRow([
                testCase.name,
                testCase.description,
                testCase.priority,
                testCase.status,
                testCase.created_at
            ]);
        });
        
        await workbook.xlsx.writeFile(outputPath);
    }
}
```

## 5. 用户界面设计（简化版）

### 5.1 主界面组件
```vue
<template>
  <div class="main-container">
    <!-- 工具栏 -->
    <el-toolbar>
      <el-button @click="createProject" icon="Plus">新建项目</el-button>
      <el-button @click="createTestCase" icon="Document">新建用例</el-button>
      <el-button @click="openCAPLEditor" icon="Edit">CAPL编辑器</el-button>
      <el-button @click="executeTest" icon="VideoPlay">执行测试</el-button>
      <el-button @click="exportResults" icon="Download">导出结果</el-button>
    </el-toolbar>
    
    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 左侧项目树 -->
      <div class="project-tree">
        <el-tree
          :data="projectTree"
          @node-click="handleNodeClick"
          :props="treeProps">
        </el-tree>
      </div>
      
      <!-- 右侧工作区 -->
      <div class="workspace">
        <!-- 测试用例编辑 -->
        <div v-if="currentView === 'testCase'" class="test-case-editor">
          <el-form :model="currentTestCase" label-width="80px">
            <el-form-item label="用例名称">
              <el-input v-model="currentTestCase.name"></el-input>
            </el-form-item>
            <el-form-item label="描述">
              <el-input type="textarea" v-model="currentTestCase.description"></el-input>
            </el-form-item>
            <el-form-item label="优先级">
              <el-select v-model="currentTestCase.priority">
                <el-option label="低" value="LOW"></el-option>
                <el-option label="中" value="MEDIUM"></el-option>
                <el-option label="高" value="HIGH"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
          
          <!-- 测试步骤 -->
          <div class="test-steps">
            <h3>测试步骤</h3>
            <el-table :data="testSteps" style="width: 100%">
              <el-table-column prop="step_number" label="步骤号" width="80"></el-table-column>
              <el-table-column prop="action_description" label="操作描述"></el-table-column>
              <el-table-column prop="expected_result" label="预期结果"></el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button size="small" @click="editStep(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteStep(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        
        <!-- CAPL编辑器 -->
        <div v-if="currentView === 'caplEditor'" class="capl-editor">
          <monaco-editor
            v-model="caplCode"
            language="capl"
            theme="vs-dark"
            style="height: 500px">
          </monaco-editor>
        </div>
        
        <!-- 执行结果 -->
        <div v-if="currentView === 'executionResults'" class="execution-results">
          <el-table :data="executionResults" style="width: 100%">
            <el-table-column prop="test_case_name" label="测试用例"></el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_time" label="开始时间"></el-table-column>
            <el-table-column prop="duration" label="耗时(秒)"></el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button size="small" @click="viewDetails(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>
```

## 6. 开发计划（Web前端版）

### 6.1 第一阶段（1周）- 基础框架
- [ ] Vue.js 3项目搭建
- [ ] Element Plus UI集成
- [ ] 基础界面框架
- [ ] 本地存储管理器

### 6.2 第二阶段（1周）- 测试用例管理
- [ ] 测试用例CRUD操作
- [ ] 测试步骤管理
- [ ] 简单的搜索和筛选
- [ ] 本地数据持久化

### 6.3 第三阶段（1周）- CAPL编辑器
- [ ] Monaco Editor集成
- [ ] CAPL语法高亮
- [ ] 基本的代码编辑功能
- [ ] 脚本与用例关联

### 6.4 第四阶段（1周）- 文件操作
- [ ] HTML5文件API集成
- [ ] JSON导入导出功能
- [ ] HTML报告生成
- [ ] 浏览器打印功能

### 6.5 第五阶段（1周）- 优化和部署
- [ ] 界面优化
- [ ] 性能优化
- [ ] 静态网站部署
- [ ] 用户文档

## 7. 技术选型理由（Web前端版）

### 7.1 Web前端优势
- **无需安装**: 通过浏览器直接访问，无需安装任何软件
- **跨平台**: 支持所有主流浏览器和操作系统
- **即开即用**: 打开浏览器即可使用，无需配置环境
- **易于部署**: 静态文件部署，支持GitHub Pages等平台
- **自动更新**: 刷新页面即可获取最新版本

### 7.2 浏览器本地存储优势
- **零配置**: 无需安装数据库，浏览器原生支持
- **轻量级**: 适合存储小规模结构化数据
- **即时访问**: 数据读取无延迟，提升用户体验
- **数据隔离**: 每个浏览器实例独立存储数据
- **自动备份**: 浏览器自动管理数据持久化

### 7.3 Monaco Editor优势
- **VS Code内核**: 与VS Code相同的编辑器
- **功能丰富**: 语法高亮、代码折叠、查找替换等
- **可扩展**: 支持自定义语法和主题
- **性能优秀**: 大文件编辑性能良好

## 8. 部署和访问

### 8.1 静态网站部署
```bash
# 构建静态文件
npm run build

# 部署到GitHub Pages
git add dist
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages

# 或者部署到其他静态托管服务
# Netlify, Vercel, 阿里云OSS等
```

### 8.2 访问方式
- **直接访问**: 通过浏览器输入网址访问
- **本地访问**: 支持本地文件直接打开（file://协议）
- **移动设备**: 支持手机和平板浏览器访问
- **离线使用**: 支持PWA离线缓存（可选）

## 9. 后续扩展计划

### 9.1 功能扩展
- **网络协作**: 支持多用户协作
- **版本控制**: Git集成
- **高级分析**: 测试数据分析
- **CI/CD集成**: 持续集成支持

### 9.2 技术升级
- **服务端版本**: 添加后端API支持
- **云同步**: 云端数据同步
- **CANoe集成**: 添加后端服务支持CANoe集成
- **AI辅助**: 智能测试建议

这个Web前端设计完全移除了Electron依赖，采用纯Web技术栈，用户只需通过浏览器即可访问所有功能。数据存储在浏览器本地，支持数据导入导出，适合快速开发和部署，同时保持良好的用户体验。