# CANoe测试用例管理系统设计文档

## 1. 系统架构设计

### 1.1 整体架构
采用前后端分离的微服务架构，确保系统的可扩展性和维护性。

```
┌─────────────────────────────────────────────────────────────┐
│                    前端层 (Frontend)                        │
├─────────────────────────────────────────────────────────────┤
│  Web界面  │  CAPL编辑器 │  测试执行控制台 │  报告展示      │
├─────────────────────────────────────────────────────────────┤
│                   API网关 (Gateway)                         │
├─────────────────────────────────────────────────────────────┤
│              业务服务层 (Business Services)                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │测试用例服务 │ CAPL服务    │ 执行服务    │ 报告服务    │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   数据层 (Data Layer)                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ MySQL       │ Redis       │ 文件存储    │ 日志存储    │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   外部集成 (External)                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ CANoe COM   │ Excel导入   │ PDF导出     │ 邮件服务    │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选择

#### 前端技术栈
- **框架**: Vue.js 3.x + TypeScript
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4.x
- **HTTP客户端**: Axios
- **代码编辑器**: Monaco Editor（VS Code内核）
- **图表库**: ECharts
- **构建工具**: Vite

#### 后端技术栈
- **框架**: Spring Boot 2.7.x
- **安全框架**: Spring Security + JWT
- **数据库**: MySQL 8.0
- **缓存**: Redis 6.x
- **消息队列**: RabbitMQ
- **接口文档**: Swagger/OpenAPI 3.0
- **任务调度**: Quartz

#### 部署运维
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **监控**: Prometheus + Grafana
- **日志**: ELK Stack (Elasticsearch + Logstash + Kibana)

## 2. 数据库设计

### 2.1 数据库表结构

```sql
-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('ADMIN', 'TEST_ENGINEER', 'VIEWER') DEFAULT 'VIEWER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- 项目表
CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_project_name (name)
);

-- 测试用例表
CREATE TABLE test_cases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    status ENUM('DRAFT', 'ACTIVE', 'DEPRECATED') DEFAULT 'DRAFT',
    version INT DEFAULT 1,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_test_case_project (project_id),
    INDEX idx_test_case_name (name),
    INDEX idx_test_case_status (status)
);

-- 测试步骤表
CREATE TABLE test_steps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    test_case_id BIGINT NOT NULL,
    step_number INT NOT NULL,
    action_description TEXT NOT NULL,
    input_data TEXT,
    expected_result TEXT,
    timeout_seconds INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    INDEX idx_test_step_case (test_case_id),
    INDEX idx_test_step_number (test_case_id, step_number)
);

-- CAPL脚本表
CREATE TABLE capl_scripts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    code_content LONGTEXT NOT NULL,
    version INT DEFAULT 1,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_capl_script_name (name)
);

-- 测试用例与CAPL脚本关联表
CREATE TABLE test_case_capl_scripts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    test_case_id BIGINT NOT NULL,
    capl_script_id BIGINT NOT NULL,
    execution_order INT DEFAULT 1,
    execution_params TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (capl_script_id) REFERENCES capl_scripts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_test_case_script (test_case_id, capl_script_id),
    INDEX idx_test_case_script (test_case_id)
);

-- 测试执行记录表
CREATE TABLE test_executions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    test_case_id BIGINT NOT NULL,
    executed_by BIGINT NOT NULL,
    execution_status ENUM('PENDING', 'RUNNING', 'PASSED', 'FAILED', 'STOPPED', 'ERROR') DEFAULT 'PENDING',
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    duration_seconds INT NULL,
    total_steps INT DEFAULT 0,
    passed_steps INT DEFAULT 0,
    failed_steps INT DEFAULT 0,
    error_message TEXT,
    canoel_log_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id),
    FOREIGN KEY (executed_by) REFERENCES users(id),
    INDEX idx_execution_test_case (test_case_id),
    INDEX idx_execution_status (execution_status),
    INDEX idx_execution_time (start_time)
);

-- 测试步骤执行结果表
CREATE TABLE test_step_results (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    test_execution_id BIGINT NOT NULL,
    test_step_id BIGINT NOT NULL,
    step_status ENUM('PASSED', 'FAILED', 'SKIPPED') NOT NULL,
    actual_result TEXT,
    error_message TEXT,
    execution_time_seconds INT NULL,
    screenshot_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_execution_id) REFERENCES test_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (test_step_id) REFERENCES test_steps(id),
    INDEX idx_step_result_execution (test_execution_id),
    INDEX idx_step_result_step (test_step_id)
);

-- 标签表
CREATE TABLE tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#409EFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tag_name (name)
);

-- 测试用例标签关联表
CREATE TABLE test_case_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    test_case_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_test_case_tag (test_case_id, tag_id)
);

-- 系统配置表
CREATE TABLE system_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 Redis缓存设计

```
# 用户会话缓存
user:session:{token} -> UserInfo (TTL: 24h)

# 测试用例缓存
test:case:{id} -> TestCaseInfo (TTL: 1h)
test:case:list:{project_id} -> List<TestCaseBrief> (TTL: 30min)

# CAPL脚本缓存
capl:script:{id} -> CAPLScriptInfo (TTL: 2h)
capl:script:list -> List<CAPLScriptBrief> (TTL: 1h)

# 执行状态缓存
test:execution:{id} -> ExecutionInfo (TTL: 10min)
test:execution:active:{user_id} -> List<ActiveExecution> (TTL: 5min)

# 系统配置缓存
config:{key} -> ConfigValue (TTL: 1h)
```

## 3. API接口设计

### 3.1 RESTful API规范

#### 用户认证接口
```
POST /api/auth/login          # 用户登录
POST /api/auth/logout         # 用户登出
POST /api/auth/refresh        # 刷新令牌
GET  /api/auth/profile        # 获取用户信息
PUT  /api/auth/profile       # 更新用户信息
```

#### 项目管理接口
```
GET    /api/projects                    # 获取项目列表
POST   /api/projects                    # 创建项目
GET    /api/projects/{id}               # 获取项目详情
PUT    /api/projects/{id}                # 更新项目
DELETE /api/projects/{id}               # 删除项目
```

#### 测试用例管理接口
```
GET    /api/test-cases                  # 获取测试用例列表
POST   /api/test-cases                  # 创建测试用例
GET    /api/test-cases/{id}             # 获取测试用例详情
PUT    /api/test-cases/{id}            # 更新测试用例
DELETE /api/test-cases/{id}             # 删除测试用例
POST   /api/test-cases/{id}/clone       # 克隆测试用例
GET    /api/test-cases/{id}/steps       # 获取测试步骤
POST   /api/test-cases/{id}/steps       # 添加测试步骤
PUT    /api/test-cases/{id}/steps/{step_id}  # 更新测试步骤
DELETE /api/test-cases/{id}/steps/{step_id}  # 删除测试步骤
```

#### CAPL脚本管理接口
```
GET    /api/capl-scripts                # 获取CAPL脚本列表
POST   /api/capl-scripts                # 创建CAPL脚本
GET    /api/capl-scripts/{id}            # 获取CAPL脚本详情
PUT    /api/capl-scripts/{id}           # 更新CAPL脚本
DELETE /api/capl-scripts/{id}            # 删除CAPL脚本
POST   /api/capl-scripts/{id}/validate  # 验证CAPL语法
POST   /api/capl-scripts/{id}/compile   # 编译CAPL脚本
```

#### 测试执行接口
```
POST /api/test-executions/start          # 开始测试执行
POST /api/test-executions/{id}/stop      # 停止测试执行
GET  /api/test-executions/{id}/status    # 获取执行状态
GET  /api/test-executions/{id}/results   # 获取执行结果
GET  /api/test-executions/{id}/log       # 获取执行日志
WebSocket /ws/test-execution            # 实时执行状态推送
```

### 3.2 请求响应格式

#### 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid-string"
}
```

#### 分页响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "size": 10,
    "pages": 10
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 4. 前端架构设计

### 4.1 项目结构
```
src/
├── api/                    # API接口定义
│   ├── auth.ts
│   ├── project.ts
│   ├── test-case.ts
│   ├── capl-script.ts
│   └── execution.ts
├── assets/                 # 静态资源
├── components/             # 通用组件
│   ├── common/
│   ├── editor/
│   ├── table/
│   └── chart/
├── layouts/                # 布局组件
├── router/                 # 路由配置
├── stores/                 # 状态管理
│   ├── auth.ts
│   ├── project.ts
│   └── test-case.ts
├── styles/                 # 样式文件
├── types/                  # TypeScript类型定义
├── utils/                  # 工具函数
├── views/                  # 页面组件
│   ├── auth/
│   ├── dashboard/
│   ├── project/
│   ├── test-case/
│   ├── capl-editor/
│   ├── execution/
│   └── report/
└── main.ts                 # 入口文件
```

### 4.2 核心组件设计

#### CAPL编辑器组件
```typescript
interface CAPLEditorProps {
  value: string;
  language: string;
  theme: string;
  readonly: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}

interface CAPLEditorEmits {
  'validate': (errors: ValidationError[]) => void;
  'compile': (result: CompileResult) => void;
}
```

#### 测试执行控制台组件
```typescript
interface ExecutionConsoleProps {
  executionId: string;
  autoScroll: boolean;
  showTimestamp: boolean;
}

interface ExecutionConsoleEmits {
  'command': (command: string) => void;
  'stop': () => void;
}
```

## 5. 后端架构设计

### 5.1 项目结构
```
src/
├── main/java/com/capl/platform/
│   ├── config/             # 配置类
│   │   ├── SecurityConfig.java
│   │   ├── RedisConfig.java
│   │   └── WebSocketConfig.java
│   ├── controller/         # 控制器
│   │   ├── AuthController.java
│   │   ├── ProjectController.java
│   │   └── TestCaseController.java
│   ├── service/            # 业务服务
│   │   ├── impl/           # 服务实现
│   │   └── interfaces/     # 服务接口
│   ├── repository/         # 数据访问层
│   │   ├── entity/         # 实体类
│   │   ├── mapper/         # MyBatis映射
│   │   └── dao/            # 数据访问对象
│   ├── model/              # 数据模型
│   │   ├── dto/            # 数据传输对象
│   │   ├── vo/             # 值对象
│   │   └── enums/          # 枚举类
│   ├── exception/          # 异常处理
│   ├── interceptor/        # 拦截器
│   ├── aspect/             # 切面编程
│   ├── util/               # 工具类
│   └── Application.java    # 启动类
```

### 5.2 核心服务设计

#### CANoe集成服务
```java
@Service
public class CANoeIntegrationService {
    
    public boolean startCANoe(String configPath) {
        // 启动CANoe实例
    }
    
    public boolean loadCAPLScript(String scriptPath) {
        // 加载CAPL脚本
    }
    
    public boolean executeTest(String testCaseId) {
        // 执行测试用例
    }
    
    public String getExecutionLog(String executionId) {
        // 获取执行日志
    }
    
    public void stopCANoe() {
        // 停止CANoe
    }
}
```

#### CAPL编译服务
```java
@Service
public class CAPLCompilationService {
    
    public CompilationResult compileScript(String scriptContent) {
        // 调用CAPL编译器
    }
    
    public List<ValidationError> validateSyntax(String scriptContent) {
        // 语法验证
    }
    
    public boolean checkLibraryDependencies(String scriptContent) {
        // 检查库依赖
    }
}
```

## 6. 实时通信设计

### 6.1 WebSocket协议设计

#### 连接建立
```javascript
// 客户端连接
const socket = new WebSocket('ws://localhost:8080/ws/test-execution');

socket.onopen = function(event) {
  console.log('WebSocket连接已建立');
};
```

#### 消息格式
```json
{
  "type": "execution_update",
  "executionId": "12345",
  "data": {
    "status": "running",
    "currentStep": 3,
    "totalSteps": 10,
    "progress": 30
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 消息类型
- `execution_start`: 测试执行开始
- `execution_update`: 执行状态更新
- `execution_complete`: 测试执行完成
- `execution_error`: 执行错误
- `log_message`: 日志消息

## 7. 安全设计

### 7.1 认证授权
- **JWT Token**: 使用JWT进行用户认证
- **RBAC**: 基于角色的访问控制
- **API权限**: 接口级别的权限控制
- **数据权限**: 数据行级别的权限控制

### 7.2 数据安全
- **数据加密**: 敏感数据加密存储
- **传输加密**: HTTPS协议
- **SQL注入**: 参数化查询
- **XSS防护**: 输入验证和输出编码

### 7.3 审计日志
- **用户操作日志**: 记录用户所有操作
- **系统日志**: 记录系统运行状态
- **安全日志**: 记录安全相关事件
- **日志分析**: 异常行为检测

## 8. 性能优化设计

### 8.1 缓存策略
- **页面缓存**: 静态页面缓存
- **数据缓存**: 热点数据缓存
- **查询缓存**: 复杂查询结果缓存
- **CDN加速**: 静态资源CDN分发

### 8.2 数据库优化
- **索引优化**: 合理的索引设计
- **查询优化**: SQL查询优化
- **读写分离**: 主从数据库架构
- **分库分表**: 大数据量分片

### 8.3 前端优化
- **代码分割**: 按需加载
- **图片优化**: 图片压缩和懒加载
- **资源压缩**: JS/CSS压缩
- **浏览器缓存**: 合理的缓存策略

## 9. 监控与运维设计

### 9.1 应用监控
- **性能监控**: 响应时间、吞吐量
- **错误监控**: 异常和错误统计
- **业务监控**: 关键业务指标
- **用户行为监控**: 用户操作分析

### 9.2 系统监控
- **服务器监控**: CPU、内存、磁盘
- **网络监控**: 网络流量、延迟
- **数据库监控**: 连接数、查询性能
- **中间件监控**: Redis、RabbitMQ状态

### 9.3 告警机制
- **阈值告警**: 关键指标超过阈值
- **异常告警**: 系统异常通知
- **业务告警**: 业务异常通知
- **告警升级**: 多级告警机制

## 10. 部署架构

### 10.1 容器化部署
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: capl_platform
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### 10.2 生产环境架构
- **负载均衡**: Nginx负载均衡
- **高可用**: 多实例部署
- **数据备份**: 定期数据备份
- **灾备恢复**: 异地容灾备份

## 11. 扩展性设计

### 11.1 水平扩展
- **无状态服务**: 服务无状态设计
- **数据库扩展**: 读写分离、分库分表
- **缓存扩展**: Redis集群模式
- **文件存储**: 分布式文件系统

### 11.2 功能扩展
- **插件机制**: 支持功能插件
- **API扩展**: 开放的API接口
- **自定义字段**: 支持业务字段扩展
- **工作流引擎**: 支持自定义流程

## 12. 开发规范

### 12.1 编码规范
- **命名规范**: 统一的命名规则
- **代码格式**: 统一的代码格式
- **注释规范**: 必要的代码注释
- **文档规范**: 完整的开发文档

### 12.2 测试规范
- **单元测试**: 核心功能单元测试
- **集成测试**: 接口集成测试
- **性能测试**: 关键功能性能测试
- **安全测试**: 安全性测试

### 12.3 版本管理
- **Git工作流**: Git Flow工作流
- **版本号规范**: 语义化版本号
- **发布流程**: 标准化发布流程
- **回滚机制**: 快速回滚机制