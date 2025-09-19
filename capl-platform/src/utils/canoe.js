const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class CANoeIntegration {
    constructor() {
        this.canoePath = null;
        this.isRunning = false;
        this.currentProcess = null;
    }

    // 设置CANoe路径
    setCANoePath(canoePath) {
        this.canoePath = canoePath;
    }

    // 验证CANoe路径
    validateCANoePath() {
        if (!this.canoePath) {
            throw new Error('CANoe路径未设置');
        }

        const canoeExePath = path.join(this.canoePath, 'CANoe64.exe');
        if (!fs.existsSync(canoeExePath)) {
            throw new Error('CANoe64.exe 未找到，请检查CANoe安装路径');
        }

        return true;
    }

    // 创建CAPL脚本文件
    createCAPLScriptFile(scriptContent, scriptName) {
        try {
            // 创建临时目录
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // 生成脚本文件路径
            const scriptFileName = `${scriptName}_${Date.now()}.can`;
            const scriptFilePath = path.join(tempDir, scriptFileName);

            // 写入脚本内容
            fs.writeFileSync(scriptFilePath, scriptContent, 'utf8');

            console.log(`CAPL脚本文件创建成功: ${scriptFilePath}`);
            return scriptFilePath;
        } catch (error) {
            console.error('创建CAPL脚本文件失败:', error);
            throw new Error(`创建CAPL脚本文件失败: ${error.message}`);
        }
    }

    // 创建CANoe配置文件
    createCANoeConfig(configData) {
        try {
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // 生成配置文件路径
            const configFileName = `test_config_${Date.now()}.cfg`;
            const configFilePath = path.join(tempDir, configFileName);

            // 创建基本的CANoe配置文件
            const configContent = this.generateCANoeConfigContent(configData);
            fs.writeFileSync(configFilePath, configContent, 'utf8');

            console.log(`CANoe配置文件创建成功: ${configFilePath}`);
            return configFilePath;
        } catch (error) {
            console.error('创建CANoe配置文件失败:', error);
            throw new Error(`创建CANoe配置文件失败: ${error.message}`);
        }
    }

    // 生成CANoe配置内容
    generateCANoeConfigContent(configData) {
        // 这里应该生成实际的CANoe配置内容
        // 由于CANoe配置文件格式复杂，这里提供一个简化版本
        return `// CANoe测试配置文件
// 生成时间: ${new Date().toISOString()}

// 网络配置
Network = {
    // CAN通道配置
    CAN1 = {
        Baudrate = 500000,
        DataBaudrate = 2000000,
        SamplePoint = 0.875,
        SyncJumpWidth = 1
    }
}

// 测试模块配置
TestModules = {
    TestModule1 = {
        CAPLFile = "${configData.caplFilePath}",
        TestCase = "${configData.testCaseName}"
    }
}

// 测试配置
TestConfiguration = {
    StartMeasurement = true,
    StopMeasurementOnTestComplete = true,
    GenerateReport = true,
    ReportPath = "${configData.reportPath}"
}`;
    }

    // 执行测试用例
    async executeTestCase(testCaseData) {
        try {
            // 验证CANoe路径
            this.validateCANoePath();

            // 检查是否已经在运行
            if (this.isRunning) {
                throw new Error('测试执行正在进行中，请等待当前测试完成');
            }

            console.log('开始执行测试用例:', testCaseData.testCaseName);

            // 创建CAPL脚本文件
            const caplFilePath = this.createCAPLScriptFile(
                testCaseData.caplCode,
                testCaseData.testCaseName
            );

            // 创建CANoe配置文件
            const configData = {
                caplFilePath: caplFilePath,
                testCaseName: testCaseData.testCaseName,
                reportPath: path.join(__dirname, '../../reports', `test_report_${Date.now()}.html`)
            };

            const configFilePath = this.createCANoeConfig(configData);

            // 执行CANoe测试
            const result = await this.runCANoeTest(configFilePath, configData.reportPath);

            return {
                success: true,
                message: '测试执行完成',
                details: {
                    testCaseName: testCaseData.testCaseName,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    status: result.status,
                    reportPath: configData.reportPath,
                    caplFilePath: caplFilePath,
                    configFilePath: configFilePath
                }
            };

        } catch (error) {
            console.error('执行测试用例失败:', error);
            return {
                success: false,
                error: error.message,
                details: {
                    testCaseName: testCaseData.testCaseName,
                    errorTime: new Date().toISOString()
                }
            };
        }
    }

    // 运行CANoe测试
    runCANoeTest(configFilePath, reportPath) {
        return new Promise((resolve, reject) => {
            try {
                this.isRunning = true;
                const startTime = new Date();

                // 构建CANoe命令
                const canoeExePath = path.join(this.canoePath, 'CANoe64.exe');
                const command = `"${canoeExePath}" /s /p "${configFilePath}"`;

                console.log('执行CANoe命令:', command);

                // 执行命令
                this.currentProcess = exec(command, {
                    timeout: 300000, // 5分钟超时
                    maxBuffer: 1024 * 1024 // 1MB缓冲区
                });

                let stdout = '';
                let stderr = '';

                // 监听标准输出
                this.currentProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                    console.log('CANoe输出:', data.toString());
                });

                // 监听错误输出
                this.currentProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                    console.error('CANoe错误:', data.toString());
                });

                // 监听进程退出
                this.currentProcess.on('close', (code) => {
                    this.isRunning = false;
                    this.currentProcess = null;

                    const endTime = new Date();
                    const duration = endTime - startTime;

                    console.log(`CANoe进程退出，退出码: ${code}`);
                    console.log(`执行时间: ${duration}ms`);

                    if (code === 0) {
                        resolve({
                            success: true,
                            status: 'PASSED',
                            startTime: startTime.toISOString(),
                            endTime: endTime.toISOString(),
                            duration: duration,
                            stdout: stdout,
                            stderr: stderr
                        });
                    } else {
                        resolve({
                            success: false,
                            status: 'FAILED',
                            startTime: startTime.toISOString(),
                            endTime: endTime.toISOString(),
                            duration: duration,
                            errorCode: code,
                            stdout: stdout,
                            stderr: stderr
                        });
                    }
                });

                // 监听进程错误
                this.currentProcess.on('error', (error) => {
                    this.isRunning = false;
                    this.currentProcess = null;
                    console.error('CANoe进程错误:', error);
                    reject(new Error(`CANoe进程启动失败: ${error.message}`));
                });

            } catch (error) {
                this.isRunning = false;
                this.currentProcess = null;
                reject(error);
            }
        });
    }

    // 停止当前测试
    stopCurrentTest() {
        return new Promise((resolve, reject) => {
            if (!this.isRunning || !this.currentProcess) {
                resolve({ success: true, message: '没有正在运行的测试' });
                return;
            }

            try {
                console.log('正在停止CANoe测试...');
                
                // 尝试优雅地终止进程
                this.currentProcess.kill('SIGTERM');
                
                // 设置超时，如果进程没有正常退出，则强制终止
                setTimeout(() => {
                    if (this.currentProcess) {
                        console.log('强制终止CANoe进程');
                        this.currentProcess.kill('SIGKILL');
                    }
                }, 5000);

                resolve({ success: true, message: '测试停止请求已发送' });
            } catch (error) {
                console.error('停止测试失败:', error);
                reject(new Error(`停止测试失败: ${error.message}`));
            }
        });
    }

    // 检查CANoe是否可用
    checkCANoeAvailability() {
        try {
            this.validateCANoePath();
            return { available: true, message: 'CANoe可用' };
        } catch (error) {
            return { available: false, message: error.message };
        }
    }

    // 获取CANoe版本信息
    async getCANoeVersion() {
        return new Promise((resolve, reject) => {
            try {
                this.validateCANoePath();
                const canoeExePath = path.join(this.canoePath, 'CANoe64.exe');
                
                exec(`"${canoeExePath}" /?`, (error, stdout, stderr) => {
                    if (error) {
                        console.error('获取CANoe版本信息失败:', error);
                        reject(new Error(`获取CANoe版本信息失败: ${error.message}`));
                        return;
                    }

                    // 解析版本信息
                    const versionInfo = this.parseCANoeVersion(stdout);
                    resolve(versionInfo);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // 解析CANoe版本信息
    parseCANoeVersion(output) {
        // 这里应该解析CANoe输出的版本信息
        // 由于实际输出格式可能不同，这里提供一个简化版本
        const lines = output.split('\\n');
        let version = 'Unknown';
        let build = 'Unknown';

        for (const line of lines) {
            if (line.includes('Version')) {
                const match = line.match(/Version[\\s:]+([0-9.]+)/);
                if (match) {
                    version = match[1];
                }
            }
            if (line.includes('Build')) {
                const match = line.match(/Build[\\s:]+([0-9.]+)/);
                if (match) {
                    build = match[1];
                }
            }
        }

        return {
            version: version,
            build: build,
            fullOutput: output
        };
    }

    // 清理临时文件
    cleanupTempFiles() {
        try {
            const tempDir = path.join(__dirname, '../../temp');
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                const now = Date.now();
                const maxAge = 24 * 60 * 60 * 1000; // 24小时

                for (const file of files) {
                    const filePath = path.join(tempDir, file);
                    const stats = fs.statSync(filePath);
                    const fileAge = now - stats.mtime.getTime();

                    if (fileAge > maxAge) {
                        fs.unlinkSync(filePath);
                        console.log(`删除过期临时文件: ${file}`);
                    }
                }
            }
        } catch (error) {
            console.error('清理临时文件失败:', error);
        }
    }
}

// 创建全局CANoe集成实例
const canoeIntegration = new CANoeIntegration();

module.exports = {
    CANoeIntegration,
    canoeIntegration
};