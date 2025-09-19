const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { databaseManager } = require('./db/database');



// 保持窗口对象的全局引用
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'CAPL测试平台',
    show: false // 先不显示窗口，等加载完成后再显示
  });

  // 加载应用界面
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // 窗口加载完成后再显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 开发环境下打开开发者工具
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 窗口关闭时清理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron应用准备就绪
app.whenReady().then(async () => {
  try {
    // 初始化数据库
    await databaseManager.initializeDatabase();
    console.log('数据库初始化成功');
    
    // 创建主窗口
    createWindow();
    
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// CANoe Integration
const { CANoeIntegration } = require('./utils/canoe');
const canoeIntegration = new CANoeIntegration();

// CANoe相关IPC处理
ipcMain.on('select-canoe-path', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: '选择CANoe安装路径',
        properties: ['openDirectory'],
        defaultPath: 'C:\\Program Files'
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        event.reply('file-selected', {
            success: true,
            filePath: selectedPath
        });
    }
});

ipcMain.on('execute-test-case', async (event, testData) => {
    try {
        console.log('开始执行测试用例:', testData.testCaseName);
        
        // 从数据库获取CANoe路径
        const canoePathConfig = await databaseManager.databaseManager.getConfig('canoe_path');
        if (canoePathConfig && canoePathConfig.config_value) {
            canoeIntegration.setCANoePath(canoePathConfig.config_value);
        }
        
        // 执行测试
        const result = await canoeIntegration.executeTestCase(testData);
        
        // 发送结果到渲染进程
        event.reply('canoe-execution-result', result);
        
    } catch (error) {
        console.error('执行测试用例失败:', error);
        event.reply('canoe-execution-result', {
            success: false,
            error: error.message
        });
    }
});

// 数据库操作IPC处理
ipcMain.on('db-operation', async (event, { requestId, operation, data }) => {
    try {
        console.log(`执行数据库操作: ${operation}`);
        const result = await databaseManager.databaseManager[operation](data);
        event.reply('db-operation-result', { 
            requestId, 
            success: true, 
            data: result,
            operation 
        });
    } catch (error) {
        console.error(`数据库操作失败: ${operation}`, error);
        event.reply('db-operation-result', { 
            requestId, 
            success: false, 
            error: error.message,
            operation 
        });
    }
});

// CANoe集成IPC处理
ipcMain.handle('canoe-connect', async () => {
  return await canoeIntegration.connect();
});

ipcMain.handle('canoe-disconnect', async () => {
  return await canoeIntegration.disconnect();
});

ipcMain.handle('canoe-execute-script', async (event, scriptPath, testCaseName) => {
  return await canoeIntegration.executeCAPLScript(scriptPath, testCaseName);
});

ipcMain.handle('canoe-get-status', async () => {
  return canoeIntegration.getStatus();
});

// 文件操作IPC处理

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});