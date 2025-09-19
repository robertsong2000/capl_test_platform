# CAPL测试平台

一个基于Electron的CAPL测试用例管理和执行平台，专为汽车电子测试工程师设计。

## 功能特性

### 核心功能
- **项目管理**: 创建、编辑和管理测试项目
- **测试用例管理**: 设计和管理测试用例
- **测试步骤**: 详细的测试步骤定义
- **CAPL脚本编辑**: 内置CAPL脚本编辑器
- **CANoe集成**: 与Vector CANoe无缝集成
- **测试执行**: 自动化执行测试用例
- **结果分析**: 测试执行结果分析

### 技术特点
- **跨平台**: 基于Electron，支持Windows和macOS
- **本地数据库**: 使用SQLite存储测试数据
- **现代化UI**: 基于Vue.js和Element Plus
- **代码编辑器**: 集成Monaco Editor
- **IPC通信**: 安全的进程间通信

## 安装和运行

### 环境要求
- Node.js 16.0 或更高版本
- npm 7.0 或更高版本

### 安装步骤

1. 克隆项目到本地
```bash
git clone <repository-url>
cd capl-platform
```

2. 安装依赖
```bash
npm install
```

3. 启动应用
```bash
npm start
```

### 开发模式
```bash
# 启动开发模式（带开发者工具）
npm start -- --dev
```

## 使用指南

### 1. 项目管理
- 点击"新建项目"创建测试项目
- 输入项目名称和描述
- 项目创建后可以在左侧列表查看

### 2. 测试用例管理
- 选择项目后，点击"新建测试用例"
- 输入用例名称、描述和优先级
- 测试用例将显示在项目详情中

### 3. 测试步骤设计
- 选择测试用例后，可以添加测试步骤
- 每个步骤包含操作描述和预期结果
- 支持步骤编号和顺序调整

### 4. CAPL脚本编辑
- 内置Monaco Editor提供语法高亮
- 支持CAPL语法模板
- 实时编辑和保存

### 5. CANoe集成
- 在设置中配置CANoe安装路径
- 支持测试用例的自动执行
- 执行结果实时反馈

## 项目结构

```
capl-platform/
├── src/
│   ├── main.js              # Electron主进程
│   ├── db/
│   │   └── database.js      # 数据库管理
│   ├── renderer/
│   │   ├── index.html       # 主界面
│   │   └── renderer.js      # 渲染进程逻辑
│   ├── utils/
│   │   └── canoe.js         # CANoe集成
│   └── assets/              # 静态资源
├── package.json             # 项目配置
└── README.md               # 项目说明
```

## 数据库设计

### 主要数据表
- **projects**: 项目信息
- **test_cases**: 测试用例
- **test_steps**: 测试步骤
- **capl_scripts**: CAPL脚本
- **test_executions**: 测试执行记录
- **system_configs**: 系统配置

## 技术栈

- **Electron**: 桌面应用框架
- **Vue.js**: 前端框架
- **Element Plus**: UI组件库
- **Monaco Editor**: 代码编辑器
- **better-sqlite3**: 数据库驱动
- **Node.js**: 后端运行时

## 配置说明

### 系统配置
- CANoe安装路径
- 默认优先级设置
- 自动备份选项

### 数据库配置
- 本地SQLite数据库
- 自动创建表结构
- 默认数据初始化

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查文件权限
   - 确认数据库文件存在

2. **CANoe集成失败**
   - 验证CANoe安装路径
   - 检查CANoe版本兼容性

3. **应用启动失败**
   - 检查Node.js版本
   - 重新安装依赖包

### 日志查看
应用日志会在控制台输出，可以通过开发者工具查看详细信息。

## 更新日志

### v1.0.0 (2025-09-19)
- 初始版本发布
- 基础项目管理功能
- 测试用例管理
- CAPL脚本编辑
- CANoe集成
- 测试执行功能

## 贡献指南

欢迎提交Issue和Pull Request来改进项目。

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- 邮箱: <your-email>
- GitHub: <your-github>