const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../../capl_platform.db');

class DatabaseManager {
    constructor() {
        this.db = null;
    }

    // 初始化数据库
    async initializeDatabase() {
        try {
            // 创建数据库连接
            this.db = new Database(DB_PATH);
            console.log('数据库连接成功');
            await this.createTables();
        } catch (error) {
            console.error('数据库连接失败:', error);
            throw error;
        }
    }

    // 创建数据表
    async createTables() {
        const createTableSQL = `
            -- 项目表
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 测试用例表
            CREATE TABLE IF NOT EXISTS test_cases (
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
            CREATE TABLE IF NOT EXISTS test_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_case_id INTEGER NOT NULL,
                step_number INTEGER NOT NULL,
                action_description TEXT NOT NULL,
                expected_result TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
            );

            -- CAPL脚本表
            CREATE TABLE IF NOT EXISTS capl_scripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                code_content TEXT NOT NULL,
                file_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 测试用例与CAPL脚本关联表
            CREATE TABLE IF NOT EXISTS test_case_scripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_case_id INTEGER NOT NULL,
                capl_script_id INTEGER NOT NULL,
                execution_order INTEGER DEFAULT 1,
                FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
                FOREIGN KEY (capl_script_id) REFERENCES capl_scripts(id) ON DELETE CASCADE
            );

            -- 测试执行记录表
            CREATE TABLE IF NOT EXISTS test_executions (
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
            CREATE TABLE IF NOT EXISTS system_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                config_key TEXT UNIQUE NOT NULL,
                config_value TEXT,
                description TEXT
            );

            -- 创建索引
            CREATE INDEX IF NOT EXISTS idx_test_cases_project ON test_cases(project_id);
            CREATE INDEX IF NOT EXISTS idx_test_steps_case ON test_steps(test_case_id);
            CREATE INDEX IF NOT EXISTS idx_test_case_scripts_case ON test_case_scripts(test_case_id);
            CREATE INDEX IF NOT EXISTS idx_test_executions_case ON test_executions(test_case_id);
        `;

        try {
            this.db.exec(createTableSQL);
            console.log('数据表创建成功');
            await this.insertDefaultData();
        } catch (error) {
            console.error('创建数据表失败:', error);
            throw error;
        }
    }

    // 插入默认数据
    async insertDefaultData() {
        const defaultProjects = [
            { name: '默认项目', description: '系统默认创建的项目' }
        ];

        const defaultConfigs = [
            { config_key: 'canoe_path', config_value: '', description: 'CANoe安装路径' },
            { config_key: 'default_priority', config_value: 'MEDIUM', description: '默认优先级' },
            { config_key: 'auto_backup', config_value: 'true', description: '是否自动备份' }
        ];

        try {
            // 检查是否已有默认项目
            const existingProjects = await this.getProjects();
            if (existingProjects.length === 0) {
                for (const project of defaultProjects) {
                    await this.createProject(project);
                }
            }

            // 检查是否已有默认配置
            for (const config of defaultConfigs) {
                const existing = await this.getConfig(config.config_key);
                if (!existing) {
                    await this.setConfig(config.config_key, config.config_value, config.description);
                }
            }

            console.log('默认数据插入成功');
        } catch (error) {
            console.error('插入默认数据失败:', error);
            throw error;
        }
    }

    // 项目相关操作
    async getProjects() {
        try {
            const sql = 'SELECT * FROM projects ORDER BY created_at DESC';
            const stmt = this.db.prepare(sql);
            const rows = stmt.all();
            return rows;
        } catch (error) {
            console.error('获取项目列表失败:', error);
            throw error;
        }
    }

    async createProject(project) {
        try {
            const sql = 'INSERT INTO projects (name, description) VALUES (?, ?)';
            const stmt = this.db.prepare(sql);
            const result = stmt.run(project.name, project.description);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('创建项目失败:', error);
            throw error;
        }
    }

    async updateProject(project) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(sql, [project.name, project.description, project.id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async deleteProject(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM projects WHERE id = ?';
            this.db.run(sql, [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // 测试用例相关操作
    async getTestCases(projectId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM test_cases WHERE project_id = ? ORDER BY created_at DESC';
            this.db.all(sql, [projectId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getTestCase(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM test_cases WHERE id = ?';
            this.db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async createTestCase(testCase) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO test_cases (project_id, name, description, priority, status) VALUES (?, ?, ?, ?, ?)';
            this.db.run(sql, [
                testCase.project_id,
                testCase.name,
                testCase.description,
                testCase.priority || 'MEDIUM',
                testCase.status || 'ACTIVE'
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async updateTestCase(testCase) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE test_cases SET name = ?, description = ?, priority = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(sql, [
                testCase.name,
                testCase.description,
                testCase.priority,
                testCase.status,
                testCase.id
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async deleteTestCase(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM test_cases WHERE id = ?';
            this.db.run(sql, [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // 测试步骤相关操作
    async getTestSteps(testCaseId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM test_steps WHERE test_case_id = ? ORDER BY step_number';
            this.db.all(sql, [testCaseId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async createTestStep(step) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO test_steps (test_case_id, step_number, action_description, expected_result) VALUES (?, ?, ?, ?)';
            this.db.run(sql, [
                step.test_case_id,
                step.step_number,
                step.action_description,
                step.expected_result
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async updateTestStep(step) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE test_steps SET step_number = ?, action_description = ?, expected_result = ? WHERE id = ?';
            this.db.run(sql, [
                step.step_number,
                step.action_description,
                step.expected_result,
                step.id
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async deleteTestStep(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM test_steps WHERE id = ?';
            this.db.run(sql, [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // CAPL脚本相关操作
    async getCAPLScripts() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM capl_scripts ORDER BY created_at DESC';
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getCAPLScript(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM capl_scripts WHERE id = ?';
            this.db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async saveCAPLScript(script) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO capl_scripts (name, description, code_content, file_path) VALUES (?, ?, ?, ?)';
            this.db.run(sql, [
                script.name,
                script.description,
                script.code_content,
                script.file_path
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async updateCAPLScript(script) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE capl_scripts SET name = ?, description = ?, code_content = ?, file_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(sql, [
                script.name,
                script.description,
                script.code_content,
                script.file_path,
                script.id
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async deleteCAPLScript(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM capl_scripts WHERE id = ?';
            this.db.run(sql, [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // 系统配置相关操作
    async getConfig(key) {
        try {
            const sql = 'SELECT * FROM system_configs WHERE config_key = ?';
            const stmt = this.db.prepare(sql);
            const result = stmt.get(key);
            return result;
        } catch (error) {
            console.error('获取配置失败:', error);
            throw error;
        }
    }

    async setConfig(key, value, description = '') {
        try {
            const sql = 'INSERT OR REPLACE INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)';
            const stmt = this.db.prepare(sql);
            const result = stmt.run(key, value, description);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('设置配置失败:', error);
            throw error;
        }
    }

    // 关闭数据库连接
    close() {
        if (this.db) {
            try {
                this.db.close();
                console.log('数据库连接已关闭');
            } catch (error) {
                console.error('关闭数据库失败:', error);
            }
        }
    }
}

// 创建全局数据库管理器实例
const databaseManager = new DatabaseManager();

module.exports = {
    initializeDatabase: () => databaseManager.initializeDatabase(),
    databaseManager
};