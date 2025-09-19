const { ipcRenderer } = require('electron');

// 初始化Vue应用
new Vue({
    el: '#app',
    data: {
        // 项目数据
        projects: [],
        currentProject: null,
        
        // 测试用例数据
        testCases: [],
        currentTestCase: null,
        
        // 测试步骤数据
        testSteps: [],
        
        // 对话框状态
        showNewProjectDialog: false,
        showNewTestCaseDialog: false,
        showSettingsDialog: false,
        showCAPLEditor: false,
        
        // 表单数据
        newProject: {
            name: '',
            description: ''
        },
        newTestCase: {
            name: '',
            description: '',
            priority: 'MEDIUM'
        },
        
        // 设置
        settings: {
            canoe_path: '',
            default_priority: 'MEDIUM',
            auto_backup: true
        },
        
        // CAPL编辑器
        caplEditor: null,
        currentCAPLScript: null
    },
    
    mounted() {
        this.initializeApp();
        this.setupIPCListeners();
    },
    
    methods: {
        // 批量替换消息提示函数
        showMessage(content, type = 'info') {
            if (typeof content === 'string') {
                this.$message({
                    message: content,
                    type: type
                });
            } else {
                this.$message(content);
            }
        },
        
        // 简化消息调用的辅助函数
        showError(message) {
            this.showMessage(message, 'error');
        },
        
        showSuccess(message) {
            this.showMessage(message, 'success');
        },
        
        showWarning(message) {
            this.showMessage(message, 'warning');
        },
        
        showInfo(message) {
            this.showMessage(message, 'info');
        },
        
        // 初始化应用
        async initializeApp() {
            try {
                // 加载项目列表
                await this.loadProjects();
                
                // 加载系统设置
                await this.loadSettings();
                
                // 初始化CAPL编辑器
                this.initializeCAPEditor();
                
                console.log('应用初始化完成');
            } catch (error) {
                console.error('应用初始化失败:', error);
                this.showError('应用初始化失败: ' + error.message);
            }
        },
        
        // 设置IPC监听器
        setupIPCListeners() {
            // 监听数据库操作结果
            ipcRenderer.on('db-operation-result', (event, result) => {
                if (result.success) {
                    this.handleDBSuccess(result);
                } else {
                    this.handleDBError(result.error);
                }
            });
            
            // 监听文件选择结果
            ipcRenderer.on('file-selected', (event, result) => {
                if (result.success && result.filePath) {
                    this.settings.canoe_path = result.filePath;
                }
            });
            
            // 监听CANoe执行结果
            ipcRenderer.on('canoe-execution-result', (event, result) => {
                this.handleCANoeExecutionResult(result);
            });
        },
        
        // 初始化CAPL编辑器
        initializeCAPEditor() {
            if (typeof monaco !== 'undefined') {
                require.config({ paths: { vs: '../../node_modules/monaco-editor/min/vs' } });
                require(['vs/editor/editor.main'], () => {
                    this.createCAPEditor();
                });
            }
        },
        
        // 创建CAPL编辑器
        createCAPEditor() {
            const editorContainer = this.$refs.caplEditor;
            if (editorContainer) {
                this.caplEditor = monaco.editor.create(editorContainer, {
                    value: this.getDefaultCAPLCode(),
                    language: 'javascript', // 暂时使用JavaScript语法高亮
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: {
                        enabled: false
                    }
                });
                
                // 监听编辑器内容变化
                this.caplEditor.onDidChangeModelContent(() => {
                    // 可以在这里添加自动保存逻辑
                });
            }
        },
        
        // 获取默认CAPL代码模板
        getDefaultCAPLCode() {
            return `/* CAPL脚本示例 */
variables
{
  // 定义变量
  int counter = 0;
  message CAN_Message msg;
}

on start
{
  // 程序启动时执行
  write("CAPL脚本开始执行");
}

on message CAN1.*
{
  // 接收到CAN消息时执行
  write("接收到CAN消息: %X", this.ID);
}

on key 'a'
{
  // 按下'a'键时执行
  counter++;
  write("计数器: %d", counter);
}

on timer myTimer
{
  // 定时器触发时执行
  write("定时器触发");
}`;
        },
        
        // 加载项目列表
        async loadProjects() {
            try {
                const result = await this.sendDBOperation('getProjects');
                if (result.success) {
                    this.projects = result.data;
                }
            } catch (error) {
                console.error('加载项目列表失败:', error);
                throw error;
            }
        },
        
        // 选择项目
        async selectProject(project) {
            this.currentProject = project;
            this.currentTestCase = null;
            this.testSteps = [];
            
            try {
                await this.loadTestCases(project.id);
            } catch (error) {
                console.error('加载测试用例失败:', error);
                this.showError('加载测试用例失败: ' + error.message);
            }
        },
        
        // 加载测试用例
        async loadTestCases(projectId) {
            try {
                const result = await this.sendDBOperation('getTestCases', { projectId });
                if (result.success) {
                    this.testCases = result.data;
                }
            } catch (error) {
                console.error('加载测试用例失败:', error);
                throw error;
            }
        },
        
        // 创建项目
        async createProject() {
            if (!this.newProject.name) {
                this.showWarning('请输入项目名称');
                return;
            }
            
            try {
                const result = await this.sendDBOperation('createProject', {
                    name: this.newProject.name,
                    description: this.newProject.description
                });
                
                if (result.success) {
                    this.showNewProjectDialog = false;
                    this.newProject = { name: '', description: '' };
                    await this.loadProjects();
                    this.showSuccess('项目创建成功');
                }
            } catch (error) {
                console.error('创建项目失败:', error);
                this.showError('创建项目失败: ' + error.message);
            }
        },
        
        // 编辑项目
        editProject() {
            if (this.currentProject) {
                this.newProject = {
                    name: this.currentProject.name,
                    description: this.currentProject.description
                };
                this.showNewProjectDialog = true;
            }
        },
        
        // 更新项目
        async updateProject() {
            if (!this.newProject.name) {
                this.showWarning('项目名称不能为空');
                return;
            }
            
            try {
                const result = await this.sendDBOperation('updateProject', {
                    id: this.currentProject.id,
                    name: this.newProject.name,
                    description: this.newProject.description
                });
                
                if (result.success) {
                    this.showNewProjectDialog = false;
                    this.newProject = { name: '', description: '' };
                    await this.loadProjects();
                    this.showSuccess('项目更新成功');
                }
            } catch (error) {
                console.error('更新项目失败:', error);
                this.showError('更新项目失败: ' + error.message);
            }
        },
        
        // 删除项目
        async deleteProject() {
            if (!this.currentProject) return;
            
            try {
                const result = await this.sendDBOperation('deleteProject', {
                    id: this.currentProject.id
                });
                
                if (result.success) {
                    this.currentProject = null;
                    this.testCases = [];
                    this.currentTestCase = null;
                    this.testSteps = [];
                    await this.loadProjects();
                    this.showSuccess('项目删除成功');
                }
            } catch (error) {
                console.error('删除项目失败:', error);
                this.showError('删除项目失败: ' + error.message);
            }
        },
        
        // 选择测试用例
        async selectTestCase(testCase) {
            this.currentTestCase = testCase;
            
            try {
                await this.loadTestSteps(testCase.id);
                await this.loadCAPLScript(testCase.id);
            } catch (error) {
                console.error('加载测试用例详情失败:', error);
                this.showError('加载测试用例详情失败: ' + error.message);
            }
        },
        
        // 加载测试步骤
        async loadTestSteps(testCaseId) {
            try {
                const result = await this.sendDBOperation('getTestSteps', { testCaseId });
                if (result.success) {
                    this.testSteps = result.data;
                }
            } catch (error) {
                console.error('加载测试步骤失败:', error);
                throw error;
            }
        },
        
        // 创建测试用例
        async createTestCase() {
            if (!this.newTestCase.name) {
                this.showWarning('请输入用例名称');
                return;
            }
            
            if (!this.currentProject) {
                this.showWarning('请先选择项目');
                return;
            }
            
            try {
                const result = await this.sendDBOperation('createTestCase', {
                    projectId: this.currentProject.id,
                    name: this.newTestCase.name,
                    description: this.newTestCase.description,
                    priority: this.newTestCase.priority
                });
                
                if (result.success) {
                    this.showNewTestCaseDialog = false;
                    this.newTestCase = { name: '', description: '', priority: 'MEDIUM' };
                    await this.loadTestCases(this.currentProject.id);
                    this.showSuccess('测试用例创建成功');
                }
            } catch (error) {
                console.error('创建测试用例失败:', error);
                this.showError('创建测试用例失败: ' + error.message);
            }
        },
        
        // 编辑测试用例
        editTestCase() {
            if (this.currentTestCase) {
                this.newTestCase = {
                    name: this.currentTestCase.name,
                    description: this.currentTestCase.description,
                    priority: this.currentTestCase.priority
                };
                this.showNewTestCaseDialog = true;
            }
        },
        
        // 更新测试用例
        async updateTestCase() {
            if (!this.newTestCase.name) {
                this.showWarning('用例名称不能为空');
                return;
            }
            
            try {
                const result = await this.sendDBOperation('updateTestCase', {
                    id: this.currentTestCase.id,
                    name: this.newTestCase.name,
                    description: this.newTestCase.description,
                    priority: this.newTestCase.priority
                });
                
                if (result.success) {
                    this.showNewTestCaseDialog = false;
                    this.newTestCase = { name: '', description: '', priority: 'MEDIUM' };
                    await this.loadTestCases(this.currentProject.id);
                    this.showSuccess('测试用例更新成功');
                }
            } catch (error) {
                console.error('更新测试用例失败:', error);
                this.showError('更新测试用例失败: ' + error.message);
            }
        },
        
        // 删除测试用例
        async deleteTestCase(testCase) {
            const targetTestCase = testCase || this.currentTestCase;
            if (!targetTestCase) return;
            
            try {
                const result = await this.sendDBOperation('deleteTestCase', {
                    id: targetTestCase.id
                });
                
                if (result.success) {
                    if (this.currentTestCase && this.currentTestCase.id === targetTestCase.id) {
                        this.currentTestCase = null;
                        this.testSteps = [];
                    }
                    await this.loadTestCases(this.currentProject.id);
                    this.showSuccess('测试用例删除成功');
                }
            } catch (error) {
                console.error('删除测试用例失败:', error);
                this.showError('删除测试用例失败: ' + error.message);
            }
        },
        
        // 添加测试步骤
        async addTestStep() {
            const actionDescription = prompt('请输入操作描述:');
            if (!actionDescription) {
                this.showWarning('步骤描述不能为空');
                return;
            }
            
            const expectedResult = prompt('请输入预期结果（可选）:');
            
            try {
                const result = await this.sendDBOperation('createTestStep', {
                    testCaseId: this.currentTestCase.id,
                    stepNumber: this.testSteps.length + 1,
                    actionDescription: actionDescription,
                    expectedResult: expectedResult
                });
                
                if (result.success) {
                    await this.loadTestSteps(this.currentTestCase.id);
                    this.showSuccess('测试步骤添加成功');
                }
            } catch (error) {
                console.error('添加测试步骤失败:', error);
                this.showError('添加测试步骤失败: ' + error.message);
            }
        },
        
        // 编辑测试步骤
        async editTestStep(step) {
            const actionDescription = prompt('请输入操作描述:', step.action_description);
            if (!actionDescription) {
                this.showWarning('步骤描述不能为空');
                return;
            }
            
            const expectedResult = prompt('请输入预期结果（可选）:', step.expected_result || '');
            
            try {
                const result = await this.sendDBOperation('updateTestStep', {
                    id: step.id,
                    actionDescription: actionDescription,
                    expectedResult: expectedResult
                });
                
                if (result.success) {
                    await this.loadTestSteps(this.currentTestCase.id);
                    this.showSuccess('测试步骤更新成功');
                }
            } catch (error) {
                console.error('更新测试步骤失败:', error);
                this.showError('更新测试步骤失败: ' + error.message);
            }
        },
        
        // 删除测试步骤
        async deleteTestStep(step) {
            try {
                const result = await this.sendDBOperation('deleteTestStep', {
                    id: step.id
                });
                
                if (result.success) {
                    await this.loadTestSteps(this.currentTestCase.id);
                    this.showSuccess('测试步骤删除成功');
                }
            } catch (error) {
                console.error('删除测试步骤失败:', error);
                this.showError('删除测试步骤失败: ' + error.message);
            }
        },
        
        // 保存CAPL脚本
        async saveCAPLScript() {
            if (!this.caplEditor) {
                this.showWarning('CAPL编辑器未初始化');
                return;
            }
            
            const scriptContent = this.caplEditor.getValue();
            if (!scriptContent) {
                this.showWarning('脚本内容不能为空');
                return;
            }
            
            try {
                const result = await this.sendDBOperation('saveCAPLScript', {
                    testCaseId: this.currentTestCase.id,
                    content: scriptContent
                });
                
                if (result.success) {
                    this.showSuccess('CAPL脚本保存成功');
                }
            } catch (error) {
                console.error('保存CAPL脚本失败:', error);
                this.showError('保存CAPL脚本失败: ' + error.message);
            }
        },
        
        // 加载CAPL脚本
        async loadCAPLScript(testCaseId) {
            try {
                const result = await this.sendDBOperation('getCAPLScript', { testCaseId });
                if (result.success && result.data) {
                    this.currentCAPLScript = result.data;
                    if (this.caplEditor) {
                        this.caplEditor.setValue(result.data.content);
                    }
                }
            } catch (error) {
                console.error('加载CAPL脚本失败:', error);
                // 不显示错误消息，因为可能没有脚本
            }
        },
        
        // 执行测试用例
        async runTestCase() {
            if (!this.currentTestCase) {
                this.showWarning('请先选择测试用例');
                return;
            }
            
            if (this.testSteps.length === 0) {
                this.showWarning('测试用例没有测试步骤');
                return;
            }
            
            try {
                // 获取CAPL脚本
                let caplScript = '';
                if (this.currentCAPLScript && this.currentCAPLScript.content) {
                    caplScript = this.currentCAPLScript.content;
                } else {
                    caplScript = this.getDefaultCAPLCode();
                }
                
                this.showInfo('测试用例执行中，请稍候...');
                
                // 发送执行请求到主进程
                ipcRenderer.send('execute-canoe-test', {
                    testCase: this.currentTestCase,
                    testSteps: this.testSteps,
                    caplScript: caplScript,
                    canoePath: this.settings.canoe_path
                });
                
            } catch (error) {
                console.error('执行测试用例失败:', error);
                this.showError('执行测试用例失败: ' + error.message);
            }
        },
        
        // 处理CANoe执行结果
        handleCANoeExecutionResult(result) {
            if (result.success) {
                this.showSuccess(`测试执行完成: ${result.message}`);
            } else {
                this.showError(`测试执行失败: ${result.error}`);
            }
        },
        
        // 返回项目视图
        backToProject() {
            this.currentTestCase = null;
            this.testSteps = [];
        },
        
        // 选择CANoe路径
        selectCANoePath() {
            ipcRenderer.send('select-file', {
                title: '选择CANoe安装路径',
                defaultPath: this.settings.canoe_path,
                properties: ['openFile']
            });
        },
        
        // 加载设置
        async loadSettings() {
            try {
                const result = await this.sendDBOperation('getConfig', { key: 'settings' });
                if (result.success && result.data) {
                    this.settings = { ...this.settings, ...JSON.parse(result.data.value) };
                }
            } catch (error) {
                console.error('加载设置失败:', error);
                // 使用默认设置
            }
        },
        
        // 保存设置
        async saveSettings() {
            try {
                const result = await this.sendDBOperation('setConfig', {
                    key: 'settings',
                    value: JSON.stringify(this.settings)
                });
                
                if (result.success) {
                    this.showSettingsDialog = false;
                    this.showSuccess('设置保存成功');
                }
            } catch (error) {
                console.error('保存设置失败:', error);
                this.showError('保存设置失败: ' + error.message);
            }
        },
        
        // 发送数据库操作请求
        sendDBOperation(operation, data = {}) {
            return new Promise((resolve, reject) => {
                const callback = (event, result) => {
                    if (result.operation === operation) {
                        ipcRenderer.removeListener('db-operation-result', callback);
                        resolve(result);
                    }
                };
                
                ipcRenderer.on('db-operation-result', callback);
                
                ipcRenderer.send('db-operation', {
                    operation: operation,
                    data: data
                });
                
                // 超时处理
                setTimeout(() => {
                    ipcRenderer.removeListener('db-operation-result', callback);
                    reject(new Error('数据库操作超时'));
                }, 10000);
            });
        },
        
        // 处理数据库操作成功
        handleDBSuccess(result) {
            console.log('数据库操作成功:', result.operation);
        },
        
        // 处理数据库操作错误
        handleDBError(error) {
            console.error('数据库操作失败:', error);
            this.showError('数据库操作失败: ' + error);
        }
    }
});