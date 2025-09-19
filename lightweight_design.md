# CANoe测试用例管理系统 - 轻量级设计方案

## 1. 简化架构设计

### 1.1 整体架构
采用桌面应用 + 本地数据库的轻量级架构，无需复杂的服务器部署。

```
┌─────────────────────────────────────────────────────────────┐
│                  桌面应用程序 (Electron)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │  测试用例   │  CAPL编辑器  │  测试执行   │  结果展示   │  │
│  │  管理界面   │  (Monaco)   │  控制台     │  界面       │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    本地服务层                                │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │  数据管理   │  CANoe集成  │  文件操作   │  配置管理   │  │
│  │  (SQLite)   │  (COM接口)  │  (Excel)    │  (JSON)     │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选择（简化版）

#### 前端技术栈
- **框架**: Electron + Vue.js 3
- **UI组件**: Element Plus
- **代码编辑器**: Monaco Editor
- **数据库**: SQLite (本地文件数据库)
- **文件存储**: 本地文件系统
- **配置**: JSON文件

#### 后端集成
- **CANoe集成**: Windows COM接口
- **Excel操作**: 使用现有的Excel处理库
- **报告生成**: HTML模板 + PDF导出

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
- ✅ 单个测试用例执行
- ✅ 调用CANoe执行
- ✅ 基本的结果收集
- ❌ 批量执行（后续版本）
- ❌ 并发执行（后续版本）

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

## 3. 数据库设计（简化版）

### 3.1 SQLite数据库结构

```sql
-- 项目表
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 测试用例表
CREATE TABLE test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 测试步骤表
CREATE TABLE test_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_case_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    action_description TEXT NOT NULL,
    expected_result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
);

-- CAPL脚本表
CREATE TABLE capl_scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    code_content TEXT NOT NULL,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 测试用例与CAPL脚本关联表
CREATE TABLE test_case_scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_case_id INTEGER NOT NULL,
    capl_script_id INTEGER NOT NULL,
    execution_order INTEGER DEFAULT 1,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (capl_script_id) REFERENCES capl_scripts(id) ON DELETE CASCADE
);

-- 测试执行记录表
CREATE TABLE test_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_case_id INTEGER NOT NULL,
    execution_status TEXT DEFAULT 'PENDING',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    result_summary TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
);

-- 系统配置表
CREATE TABLE system_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT
);
```

## 4. 核心模块设计

### 4.1 数据访问层
```javascript
// 使用SQLite的轻量级封装
class DatabaseManager {
    constructor() {
        this.db = new sqlite3.Database('capl_platform.db');
    }
    
    // 测试用例相关操作
    async getTestCases(projectId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM test_cases WHERE project_id = ? ORDER BY created_at DESC',
                [projectId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    async createTestCase(testCase) {
        const { project_id, name, description, priority } = testCase;
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO test_cases (project_id, name, description, priority) VALUES (?, ?, ?, ?)',
                [project_id, name, description, priority],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
    
    // CAPL脚本相关操作
    async saveCAPLScript(script) {
        const { name, description, code_content, file_path } = script;
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO capl_scripts (name, description, code_content, file_path) VALUES (?, ?, ?, ?)',
                [name, description, code_content, file_path],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
}
```

### 4.2 CANoe集成模块
```javascript
// CANoe COM接口封装
class CANoeIntegration {
    constructor() {
        this.canoe = null;
        this.isConnected = false;
    }
    
    async connect() {
        try {
            // 使用Node-API调用Windows COM接口
            this.canoe = await this.initializeCANoeCOM();
            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('CANoe连接失败:', error);
            return false;
        }
    }
    
    async executeCAPLScript(scriptPath, testCaseName) {
        if (!this.isConnected) {
            throw new Error('CANoe未连接');
        }
        
        try {
            // 加载CAPL脚本
            await this.canoe.loadCAPL(scriptPath);
            
            // 启动测试
            const result = await this.canoe.startTest(testCaseName);
            
            // 收集结果
            return {
                status: result.status,
                log: result.log,
                duration: result.duration
            };
        } catch (error) {
            return {
                status: 'ERROR',
                error: error.message,
                log: error.log || ''
            };
        }
    }
    
    async disconnect() {
        if (this.canoe) {
            await this.canoe.quit();
            this.canoe = null;
            this.isConnected = false;
        }
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

## 6. 开发计划（简化版）

### 6.1 第一阶段（2周）- 基础框架
- [ ] Electron + Vue.js项目搭建
- [ ] SQLite数据库集成
- [ ] 基础界面框架
- [ ] 项目树组件

### 6.2 第二阶段（2周）- 测试用例管理
- [ ] 测试用例CRUD操作
- [ ] 测试步骤管理
- [ ] 简单的搜索和筛选
- [ ] Excel导入导出

### 6.3 第三阶段（2周）- CAPL编辑器
- [ ] Monaco Editor集成
- [ ] CAPL语法高亮
- [ ] 基本的代码编辑功能
- [ ] 脚本与用例关联

### 6.4 第四阶段（2周）- CANoe集成
- [ ] Windows COM接口调用
- [ ] 基本的测试执行功能
- [ ] 结果收集和显示
- [ ] 简单的报告生成

### 6.5 第五阶段（1周）- 优化和打包
- [ ] 界面优化
- [ ] 性能优化
- [ ] 应用打包
- [ ] 用户文档

## 7. 技术选型理由

### 7.1 Electron优势
- **跨平台**: 支持Windows、macOS、Linux
- **Web技术**: 使用HTML/CSS/JavaScript开发
- **本地访问**: 可直接访问文件系统和系统API
- **打包简单**: 可打包成独立的桌面应用

### 7.2 SQLite优势
- **零配置**: 无需安装和配置数据库服务器
- **轻量级**: 单文件数据库，适合桌面应用
- **可靠性**: 经过验证的嵌入式数据库
- **性能**: 对于小规模数据性能优秀

### 7.3 Monaco Editor优势
- **VS Code内核**: 与VS Code相同的编辑器
- **功能丰富**: 语法高亮、代码折叠、查找替换等
- **可扩展**: 支持自定义语法和主题
- **性能优秀**: 大文件编辑性能良好

## 8. 部署和分发

### 8.1 应用打包
```bash
# 使用electron-builder打包
npm run build
npm run dist

# 生成安装包
# Windows: .exe安装包
# macOS: .dmg安装包  
# Linux: .AppImage或.deb包
```

### 8.2 分发方式
- **直接下载**: 提供安装包下载
- **自动更新**: 集成自动更新功能
- **绿色版**: 提供免安装版本
- **便携版**: USB便携版本

## 9. 后续扩展计划

### 9.1 功能扩展
- **网络协作**: 支持多用户协作
- **版本控制**: Git集成
- **高级分析**: 测试数据分析
- **CI/CD集成**: 持续集成支持

### 9.2 技术升级
- **服务端版本**: 迁移到B/S架构
- **云同步**: 云端数据同步
- **移动端**: 移动端查看应用
- **AI辅助**: 智能测试建议

这个轻量级设计保留了核心功能，去除了复杂的分布式架构，更适合快速开发和部署。