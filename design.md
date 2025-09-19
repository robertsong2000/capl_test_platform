# CAPL测试平台 - Web前端设计方案 (已实现版本)

## 1. 架构设计

### 1.1 整体架构
采用纯Web前端架构，通过浏览器访问，无需安装桌面应用。基于Vue.js 3 + Element Plus + Monaco Editor技术栈。

```
┌─────────────────────────────────────────────────────────────┐
│                      Web浏览器                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │  首页       │  CAPL编辑器  │  测试执行   │  测试结果   │  │
│  │  (Home.vue) │ (Editor.vue)│ (Execution.vue)│ (Results.vue)│  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                  前端数据处理层                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │  本地存储   │  文件管理   │  数据序列化 │  路由管理   │  │
│  │  (LocalStorage)│ (FileManager)│ (JSON)     │ (Vue Router)│  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈 (实际实现)

#### 前端技术栈
- **框架**: Vue.js 3.4.0
- **UI组件库**: Element Plus 2.4.4
- **代码编辑器**: Monaco Editor 0.45.0
- **路由管理**: Vue Router 4.2.5
- **数据存储**: 浏览器LocalStorage
- **文件操作**: HTML5 File API
- **Excel处理**: SheetJS (xlsx 0.18.5)
- **日期处理**: Day.js 1.11.10
- **构建工具**: Vite 5.0.10

#### 数据处理
- **本地存储**: LocalStorage API，统一存储键为 `capl_test_platform_v2`
- **文件导入导出**: 支持JSON、Excel、CSV、HTML格式
- **数据序列化**: JSON格式存储
- **报告生成**: HTML模板 + 浏览器打印功能

## 2. 功能实现状态

### 2.1 已实现功能（V2.0.0版本）

#### 2.1.1 测试用例管理 ✅
- ✅ 项目创建/编辑/删除
- ✅ 测试用例创建/编辑/删除
- ✅ 测试步骤管理（增删改）
- ✅ 测试用例优先级设置（LOW/MEDIUM/HIGH）
- ✅ 测试用例状态管理（DRAFT/ACTIVE/DISABLED）
- ✅ CAPL代码与测试用例关联
- ✅ 项目树形结构展示

#### 2.1.2 CAPL脚本管理 ✅
- ✅ Monaco Editor集成
- ✅ CAPL语法高亮显示
- ✅ 代码编辑功能（撤销、重做、查找等）
- ✅ 多标签页代码编辑
- ✅ 代码与测试用例关联存储

#### 2.1.3 文件操作 ✅
- ✅ 数据导入（JSON/Excel/CSV）
- ✅ 数据导出（JSON/Excel/CSV/HTML）
- ✅ 批量导入导出功能
- ✅ HTML测试报告生成
- ✅ 文件下载功能

#### 2.1.4 系统功能 ✅
- ✅ 响应式界面设计
- ✅ 主题切换（浅色/深色/自动）
- ✅ 多语言支持（中文/英文）框架
- ✅ 自动保存功能
- ✅ 系统设置管理

### 2.2 界面实现

#### 主界面架构
基于Vue Router的单页应用，包含以下主要页面：

- **首页 (/)**: 项目概览、测试用例管理、项目树结构
- **代码编辑 (/editor)**: Monaco Editor集成、CAPL代码编辑
- **测试执行 (/execution)**: 测试执行管理、结果跟踪
- **测试结果 (/results)**: 测试结果展示、报告查看

#### 顶部导航栏
```
┌─────────────────────────────────────────────────────────────┐
│ [图标] CAPL测试平台  [首页][代码编辑][测试执行][测试结果] [导入][导出][设置] │
└─────────────────────────────────────────────────────────────┘
```

#### 数据管理界面
- **项目树**: 左侧项目列表，支持展开/折叠
- **测试用例表格**: 右侧测试用例列表，支持增删改查
- **测试步骤管理**: 测试用例详情中的步骤管理
- **CAPL代码编辑**: Monaco Editor集成，支持语法高亮

## 3. 数据存储设计（已实现）

### 3.1 LocalStorage存储结构

#### 3.1.1 数据模型 (实际实现)
```javascript
// LocalStorage键: 'capl_test_platform_v2'
{
  version: '2.0.0',
  projects: [
    {
      id: 'proj_123456789',
      name: '项目名称',
      description: '项目描述',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  testCases: [
    {
      id: 'case_123456789',
      projectId: 'proj_123456789',
      name: '测试用例名称',
      description: '用例描述',
      priority: 'MEDIUM',  // LOW/MEDIUM/HIGH
      status: 'DRAFT',     // DRAFT/ACTIVE/DISABLED
      caplCode: 'CAPL代码内容',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  testSteps: [
    {
      id: 'step_123456789',
      testCaseId: 'case_123456789',
      stepNumber: 1,
      actionDescription: '操作步骤描述',
      expectedResult: '预期结果',
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  caplScripts: [
    {
      id: 'script_123456789',
      projectId: 'proj_123456789',
      name: 'CAPL脚本名称',
      description: '脚本描述',
      codeContent: 'CAPL代码内容',
      filePath: 'local/path/to/script.can',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  testExecutions: [
    {
      id: 'exec_123456789',
      testCaseId: 'case_123456789',
      projectName: '项目名称',
      testCaseName: '测试用例名称',
      status: 'passed',  // passed/failed/pending
      startTime: '2024-01-01T10:00:00.000Z',
      endTime: '2024-01-01T10:05:00.000Z',
      duration: 300,
      resultSummary: '执行成功',
      errorMessage: '',
      logs: ['执行日志...'],
      createdAt: '2024-01-01T10:00:00.000Z'
    }
  ],
  configs: {
    exportFormat: 'excel',
    autoSave: true,
    theme: 'light',  // light/dark/auto
    language: 'zh-CN',
    pageSize: 20,
    editorTheme: 'vs-dark'
  }
}
```

## 4. 核心模块设计（已实现）

### 4.1 本地数据管理器 (LocalDataManager)
```javascript
// 文件: src/services/localStorage.js
class LocalDataManager {
    constructor() {
        this.storageKey = 'capl_test_platform_v2';
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
                    autoSave: true,
                    theme: 'light',
                    language: 'zh-CN',
                    pageSize: 20,
                    editorTheme: 'vs-dark'
                },
                version: '2.0.0'
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }
    
    // 核心方法
    generateId(prefix = 'item') // 生成唯一ID
    getAllData() // 获取所有数据
    saveData(data) // 保存数据
    
    // 项目管理
    getProjects() // 获取所有项目
    getProject(id) // 获取指定项目
    createProject(projectData) // 创建项目
    updateProject(id, updateData) // 更新项目
    deleteProject(id) // 删除项目（级联删除相关数据）
    
    // 测试用例管理
    getTestCases(projectId = null) // 获取测试用例
    getTestCase(id) // 获取指定测试用例
    createTestCase(testCaseData) // 创建测试用例
    updateTestCase(id, updateData) // 更新测试用例
    deleteTestCase(id) // 删除测试用例（级联删除步骤和执行记录）
    
    // 测试步骤管理
    getTestSteps(testCaseId) // 获取测试步骤
    createTestStep(stepData) // 创建测试步骤
    updateTestStep(id, updateData) // 更新测试步骤
    deleteTestStep(id) // 删除测试步骤
    
    // CAPL脚本管理
    getCAPLScripts(projectId = null) // 获取CAPL脚本
    getCAPLScript(id) // 获取指定脚本
    saveCAPLScript(scriptData) // 保存CAPL脚本
    updateCAPLScript(id, updateData) // 更新CAPL脚本
    deleteCAPLScript(id) // 删除CAPL脚本
    
    // 测试执行管理
    getTestExecutions(filters = {}) // 获取执行记录
    createTestExecution(executionData) // 创建执行记录
    updateTestExecution(id, updateData) // 更新执行记录
    deleteTestExecution(id) // 删除执行记录
    
    // 配置管理
    getConfigs() // 获取系统配置
    updateConfigs(updateData) // 更新系统配置
    
    // 数据导出
    exportAllData() // 导出所有数据
    exportProjectData(projectId) // 导出项目数据
}
```

### 4.2 文件管理器 (FileManager)
```javascript
// 文件: src/services/fileManager.js
class FileManager {
    constructor() {
        this.supportedFormats = {
            import: ['.json', '.xlsx', '.xls', '.csv'],
            export: ['json', 'excel', 'csv', 'html']
        };
    }
    
    // 文件选择
    async selectFile(accept = '.json,.xlsx,.xls,.csv')
    
    // 文件读取
    async readFile(file)
    
    // 文件下载
    downloadFile(content, filename, mimeType = 'application/json')
    
    // 数据导入
    async importData(format = 'auto')
    // 返回: { success, data, filename, format } 或 { success, error }
    
    // 数据导出
    async exportData(format = 'json', filename = null)
    // 返回: { success, filename, format, size } 或 { success, error }
    
    // 生成测试报告
    async generateTestReport(testExecutions, format = 'html')
    
    // Excel数据处理
    async parseExcel(content)     // Excel解析
    async generateExcel(data)     // Excel生成
    
    // CSV数据处理
    async parseCSV(content)       // CSV解析
    async generateCSV(data)       // CSV生成
    
    // HTML报告生成
    generateHTMLReportContent(testExecutions, stats, projects, testCases)
    
    // 数据验证
    validateImportData(data)      // 导入数据验证
    detectFormat(filename)        // 格式检测
}
```

### 4.3 Vue组件架构

#### 4.3.1 主应用组件 (App.vue)
- **功能**: 顶部导航、导入导出对话框、系统设置
- **依赖**: Element Plus组件库、文件管理器
- **特性**: 
  - 响应式布局
  - 多语言支持框架
  - 主题切换
  - 文件导入导出管理

#### 4.3.2 页面组件
- **Home.vue**: 项目管理和测试用例管理
  - 项目树展示
  - 测试用例表格
  - 测试步骤管理
  - 测试用例编辑对话框

- **Editor.vue**: CAPL代码编辑器
  - Monaco Editor集成
  - 代码语法高亮
  - 多文件编辑支持
  - 代码保存和加载

- **Execution.vue**: 测试执行管理
  - 测试用例执行
  - 执行状态跟踪
  - 结果收集
  - 执行历史查看

- **Results.vue**: 测试结果展示
  - 结果列表展示
  - 详细结果查看
  - 报告生成
  - 结果导出

#### 4.3.3 路由配置 (router/index.js)
```javascript
const routes = [
  { path: '/', component: Home },
  { path: '/editor', component: Editor },
  { path: '/execution', component: Execution },
  { path: '/results', component: Results }
]
```
```

## 5. 用户界面实现

### 5.1 主界面布局 (App.vue)
```
┌─────────────────────────────────────────────────────────────┐
│ CAPL测试平台 v2.0.0  [导入] [导出] [设置]                    │
├─────────────────────────────────────────────────────────────┤
│ [首页] [代码编辑] [测试执行] [测试结果]                        │
├─────────────────────────────────────────────────────────────┤
│                    页面内容区域                              │
│                                                             │
│                    (路由视图)                                │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 首页界面 (Home.vue)
```
┌─────────────────────────────────────────────────────────────┐
│ 项目管理 & 测试用例管理                                     │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┬──────────────────────────────────────────┐ │
│ │   项目树     │          测试用例表格                      │ │
│ │              │  ┌───────────────────────────────────┐    │ │
│ │ ▼ 项目1      │  │ 名称 │ 描述 │ 优先级 │ 状态      │    │ │
│ │   ├─用例1    │  ├─────┼─────┼──────┼──────────┤    │ │
│ │   └─用例2    │  │ TC01 │ ... │ 高    │ 待执行    │    │ │
│ │ ▶ 项目2      │  │ TC02 │ ... │ 中    │ 已通过    │    │ │
│ │              │  │ TC03 │ ... │ 低    │ 失败      │    │ │
│ │ [+新建项目]  │  └───────────────────────────────────┘    │ │
│ │              │                                          │ │
│ │              │ [+新建用例] [编辑] [删除] [刷新]           │ │
│ └──────────────┴──────────────────────────────────────────┘ │
│                                                             │
│ 测试步骤:                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 步骤1: 初始化系统                                       │ │
│ │ 步骤2: 输入测试数据                                     │ │
│ │ 步骤3: 验证结果                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [+添加步骤] [编辑步骤] [删除步骤] [上移] [下移]              │ │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 代码编辑界面 (Editor.vue)
```
┌──────────────────────────────────────────────────────────────┐
│ CAPL代码编辑器                                             │
├──────────────────────────────────────────────────────────────┤
│ 文件管理:                                                    │
│ [新文件] [打开] [保存] [另存为]                               │
│                                                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ on key 'a' {                                             │ │
│ │   output("Key A pressed");                               │ │
│ │ }                                                        │ │
│ │                                                          │ │
│ │ on key 'b' {                                             │ │
│ │   output("Key B pressed");                               │ │
│ │ }                                                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                             │
│ [语法检查] [格式化] [运行]                                   │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 测试执行界面 (Execution.vue)
```
┌──────────────────────────────────────────────────────────────┐
│ 测试执行管理                                                │
├──────────────────────────────────────────────────────────────┤
│ 选择测试用例:                                                │
│ ☑ 项目1 - 用例1 (高优先级)                                  │
│ ☐ 项目1 - 用例2 (中优先级)                                  │
│ ☑ 项目2 - 用例3 (高优先级)                                  │
│                                                             │
│ [开始执行] [停止执行] [查看日志]                              │
│                                                             │
│ 执行状态:                                                    │
│ 当前: 用例1 ✓ 通过 (15秒)                                   │
│ 总计: 2/3 完成                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.5 测试结果界面 (Results.vue)
```
┌──────────────────────────────────────────────────────────────┐
│ 测试结果展示                                                │
├──────────────────────────────────────────────────────────────┤
│ 结果列表:                                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 用例1 ✓ 通过 2024-01-01 10:30:25                        │ │
│ │ 用例2 ✗ 失败 2024-01-01 10:31:15                        │ │
│ │ 用例3 ✓ 通过 2024-01-01 10:32:45                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                             │
│ [查看详情] [导出报告] [刷新]                                 │
└──────────────────────────────────────────────────────────────┘
```

## 6. 技术实现方案 (已实现)

### 6.1 前端技术栈
- **框架**: Vue.js 3.4.0
- **UI组件库**: Element Plus 2.4.4
- **代码编辑器**: Monaco Editor (集成中)
- **构建工具**: Vite 5.0.10
- **路由**: Vue Router 4.2.5
- **Excel处理**: SheetJS (xlsx) 0.18.5
- **代码规范**: ESLint 8.56.0 + Prettier 3.1.1

### 6.2 已实现的核心功能

#### 6.2.1 文件导入导出系统
```javascript
// 支持的文件格式
const supportedFormats = {
  import: ['json', 'xlsx', 'csv'],
  export: ['json', 'xlsx', 'csv', 'html']
};

// FileManager核心方法已实现:
// - selectFile(): 文件选择
// - readFile(): 文件读取
// - downloadFile(): 文件下载
// - importData(format): 数据导入
// - exportData(format, filename): 数据导出
```

#### 6.2.2 本地数据管理
```javascript
// LocalStorage数据模型已实现:
{
  version: '2.0.0',
  projects: [...],
  testCases: [...],
  testSteps: [...],
  testExecutions: [...],
  configs: {
    general: {...},
    editor: {...}
  }
}

// LocalDataManager核心方法已实现:
// - 项目管理: getProjects(), createProject(), updateProject(), deleteProject()
// - 测试用例管理: getTestCases(), createTestCase(), updateTestCase(), deleteTestCase()
// - 测试步骤管理: getTestSteps(), createTestStep(), updateTestStep(), deleteTestStep()
// - 测试执行管理: getTestExecutions(), createTestExecution(), updateTestExecution()
// - 配置管理: getConfigs(), updateConfigs()
```

#### 6.2.3 Vue组件架构
```javascript
// 路由配置已实现:
const routes = [
  { path: '/', component: Home },           // 项目管理
  { path: '/editor', component: Editor },   // 代码编辑
  { path: '/execution', component: Execution }, // 测试执行
  { path: '/results', component: Results }   // 测试结果
];

// 主要组件已实现:
// - App.vue: 主应用组件，包含导航和对话框
// - Home.vue: 项目和测试用例管理
// - Editor.vue: CAPL代码编辑器
// - Execution.vue: 测试执行管理
// - Results.vue: 测试结果展示
```

### 6.3 系统架构特点

#### 6.3.1 单页应用架构
- **基于Vue Router**: 无刷新页面切换
- **组件化设计**: 高内聚低耦合
- **响应式布局**: 适配不同屏幕尺寸
- **本地存储**: 无需后端服务器

#### 6.3.2 数据管理
- **统一数据模型**: 版本控制和数据验证
- **本地持久化**: LocalStorage自动保存
- **文件导入导出**: 支持多种格式
- **数据完整性**: 关联数据自动维护

#### 6.3.3 用户界面
- **Element Plus**: 现代化UI组件
- **对话框管理**: 导入/导出/设置
- **状态反馈**: 操作成功/失败提示
- **错误处理**: 用户友好的错误信息

## 7. 技术选型理由（已实现版本）

### 7.1 Vue.js 3.4.0
- **成熟稳定**: 经过大量项目验证的生产级框架
- **Composition API**: 更好的逻辑复用和类型推导
- **性能优异**: 编译时优化和运行时性能提升
- **生态丰富**: 完整的工具链和第三方库支持
- **TypeScript**: 原生TypeScript支持，类型安全

### 7.2 Element Plus 2.4.4
- **Vue 3原生**: 完全为Vue 3设计，无兼容性问题
- **企业级组件**: 50+高质量组件，满足复杂业务需求
- **主题系统**: 支持深度定制和CSS变量
- **国际化**: 内置多语言支持，易于扩展
- **活跃维护**: 持续更新，社区支持良好

### 7.3 Vite 5.0.10
- **极速开发**: 基于原生ESM的即时热更新
- **优化构建**: Rollup打包，生成高度优化的代码
- **插件生态**: 丰富的插件系统，易于扩展
- **TypeScript**: 原生TypeScript支持，无需额外配置
- **现代标准**: 支持最新的Web标准和API

### 7.4 LocalStorage方案
- **简单可靠**: API简单易用，兼容性好
- **无需后端**: 完全前端实现，降低部署复杂度
- **即时响应**: 同步操作，无需异步等待
- **数据持久**: 浏览器关闭后数据仍然保留
- **容量适中**: 5-10MB容量足够存储测试数据

### 7.5 SheetJS 0.18.5
- **纯前端**: 无需后端支持，保护数据隐私
- **格式完整**: 支持Excel所有主要功能
- **浏览器兼容**: 支持所有现代浏览器
- **轻量级**: 相对较小的库体积
- **成熟稳定**: 经过大量项目验证

### 7.6 单页应用架构
- **用户体验**: 无刷新页面切换，流畅的用户体验
- **前后端分离**: 清晰的架构分层，易于维护
- **组件复用**: 高度组件化，提高开发效率
- **路由管理**: Vue Router提供完整的路由功能
- **状态管理**: 组件间状态传递和管理

## 8. 部署和访问 (已实现)

### 8.1 开发环境
```bash
# 进入项目目录
cd web-frontend

# 安装依赖
pnpm install

# 开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

### 8.2 生产部署
```bash
# 构建静态文件
pnpm build

# 构建产物在 dist/ 目录中
# 可部署到任何静态文件服务器
```

### 8.3 支持的部署平台
- **GitHub Pages**: 免费静态网站托管
- **Netlify**: 自动部署的静态网站托管
- **Vercel**: 前端优化的部署平台
- **阿里云OSS**: 阿里云对象存储服务
- **腾讯云COS**: 腾讯云对象存储服务
- **Nginx**: 自建Web服务器

### 8.4 访问方式
- **本地开发**: http://localhost:3005 (自动选择可用端口)
- **静态部署**: 支持所有静态文件托管平台
- **CDN加速**: 可配合CDN使用提升访问速度

### 8.5 浏览器兼容性
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **移动端**: iOS Safari, Chrome for Android

### 8.6 数据持久化
- **LocalStorage**: 数据存储在用户浏览器中
- **数据导出**: 支持完整数据导出备份
- **数据导入**: 支持从备份文件恢复数据
- **跨设备**: 通过导入导出实现数据迁移

## 9. 项目状态总结

### 9.1 已实现功能 (V2.0.0)
✅ **核心架构**: Vue 3 + Element Plus + Vite 完整搭建  
✅ **数据管理**: LocalStorage + LocalDataManager 完整实现  
✅ **文件操作**: FileManager 支持 JSON/Excel/CSV 导入导出  
✅ **页面组件**: 首页/编辑器/执行/结果 四个主要页面  
✅ **导航路由**: Vue Router 单页应用架构  
✅ **UI组件**: Element Plus 现代化界面  
✅ **错误处理**: 完整的错误捕获和用户提示  
✅ **构建部署**: Vite 构建，支持静态部署  

### 9.2 系统特点
- **零依赖部署**: 纯前端实现，无需后端服务器
- **数据安全**: 数据存储在用户本地浏览器
- **跨平台**: 支持所有现代浏览器
- **轻量级**: 快速加载，响应式界面
- **易扩展**: 模块化架构，便于功能扩展

### 9.3 使用场景
- **个人测试管理**: 个人项目的测试用例管理
- **小型团队协作**: 通过文件导入导出实现协作
- **教学演示**: CAPL测试概念的教学工具
- **原型验证**: 快速验证测试管理流程

### 9.4 后续发展方向

#### 9.4.1 短期优化
- **Monaco Editor**: 完善CAPL代码编辑器集成
- **测试执行**: 实现测试用例的执行引擎
- **结果展示**: 优化测试结果的展示方式
- **性能优化**: 大数据量下的性能提升

#### 9.4.2 中期扩展
- **TypeScript**: 迁移到TypeScript提高代码质量
- **单元测试**: 添加测试用例确保代码稳定性
- **PWA支持**: 添加离线使用和桌面快捷方式
- **主题系统**: 支持深色模式和自定义主题

#### 9.4.3 长期规划
- **后端集成**: 可选的后端服务器支持
- **多人协作**: 实时协作编辑功能
- **版本控制**: 测试用例的版本管理
- **API接口**: 提供标准化的API接口

这个Web前端设计完全移除了Electron依赖，采用纯Web技术栈，用户只需通过浏览器即可访问所有功能。数据存储在浏览器本地，支持数据导入导出，适合快速开发和部署，同时保持良好的用户体验。