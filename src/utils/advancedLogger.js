const fs = require('fs');
const path = require('path');
const util = require('util');

/**
 * Advanced Logging Service
 * Centralized logging with levels, file rotation, and formatting
 */

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };
        this.currentLevel = this.levels.INFO;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxFiles = 5;
        
        // Ensure log directory exists
        this.ensureLogDirectory();
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Set log level
     */
    setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.currentLevel = this.levels[level];
        }
    }

    /**
     * Format log message
     */
    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        
        return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
    }

    /**
     * Write to log file
     */
    writeToFile(level, message, meta) {
        const fileName = `${level.toLowerCase()}.log`;
        const filePath = path.join(this.logDir, fileName);
        const formattedMessage = this.formatMessage(level, message, meta);

        try {
            // Check file size and rotate if needed
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (stats.size >= this.maxFileSize) {
                    this.rotateLogFile(filePath);
                }
            }

            // Append to file
            fs.appendFileSync(filePath, formattedMessage);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    /**
     * Rotate log file when it reaches max size
     */
    rotateLogFile(filePath) {
        const dir = path.dirname(filePath);
        const baseName = path.basename(filePath, '.log');
        const ext = '.log';

        // Shift existing rotated files
        for (let i = this.maxFiles - 1; i > 0; i--) {
            const oldPath = path.join(dir, `${baseName}.${i}${ext}`);
            const newPath = path.join(dir, `${baseName}.${i + 1}${ext}`);
            
            if (fs.existsSync(oldPath)) {
                if (i === this.maxFiles - 1) {
                    fs.unlinkSync(oldPath); // Delete oldest
                } else {
                    fs.renameSync(oldPath, newPath);
                }
            }
        }

        // Move current log to .1
        fs.renameSync(filePath, path.join(dir, `${baseName}.1${ext}`));
    }

    /**
     * Log error
     */
    error(message, meta = {}) {
        if (this.currentLevel >= this.levels.ERROR) {
            console.error(`[ERROR] ${message}`, meta);
            this.writeToFile('ERROR', message, meta);
        }
    }

    /**
     * Log warning
     */
    warn(message, meta = {}) {
        if (this.currentLevel >= this.levels.WARN) {
            console.warn(`[WARN] ${message}`, meta);
            this.writeToFile('WARN', message, meta);
        }
    }

    /**
     * Log info
     */
    info(message, meta = {}) {
        if (this.currentLevel >= this.levels.INFO) {
            console.log(`[INFO] ${message}`, meta);
            this.writeToFile('INFO', message, meta);
        }
    }

    /**
     * Log debug
     */
    debug(message, meta = {}) {
        if (this.currentLevel >= this.levels.DEBUG) {
            console.log(`[DEBUG] ${message}`, meta);
            this.writeToFile('DEBUG', message, meta);
        }
    }

    /**
     * Log trace
     */
    trace(message, meta = {}) {
        if (this.currentLevel >= this.levels.TRACE) {
            console.log(`[TRACE] ${message}`, meta);
            this.writeToFile('TRACE', message, meta);
        }
    }

    /**
     * Log security event
     */
    security(message, meta = {}) {
        console.log(`[SECURITY] ${message}`, meta);
        this.writeToFile('SECURITY', message, meta);
    }

    /**
     * Log audit event
     */
    audit(action, userId, resource, meta = {}) {
        const auditMessage = `User ${userId} performed ${action} on ${resource}`;
        const auditMeta = {
            ...meta,
            action,
            userId,
            resource,
            timestamp: new Date()
        };
        
        console.log(`[AUDIT] ${auditMessage}`, auditMeta);
        this.writeToFile('AUDIT', auditMessage, auditMeta);
    }

    /**
     * Log HTTP request
     */
    http(req, res, responseTime) {
        const message = `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`;
        const meta = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        
        if (res.statusCode >= 400) {
            this.warn(message, meta);
        } else {
            this.info(message, meta);
        }
    }

    /**
     * Get log files
     */
    getLogFiles() {
        try {
            const files = fs.readdirSync(this.logDir);
            return files.filter(file => file.endsWith('.log')).map(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime,
                    path: filePath
                };
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * Read log file
     */
    readLogFile(fileName, lines = 100) {
        try {
            const filePath = path.join(this.logDir, fileName);
            
            if (!fs.existsSync(filePath)) {
                return [];
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const allLines = content.split('\n').filter(line => line.trim());
            
            // Return last N lines
            return allLines.slice(-lines);
        } catch (error) {
            this.error('Error reading log file', { fileName, error: error.message });
            return [];
        }
    }

    /**
     * Search logs
     */
    searchLogs(query, level = null) {
        const results = [];
        const files = this.getLogFiles();

        files.forEach(file => {
            if (level && !file.name.startsWith(level.toLowerCase())) {
                return;
            }

            const lines = this.readLogFile(file.name, 1000);
            lines.forEach(line => {
                if (line.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        file: file.name,
                        line
                    });
                }
            });
        });

        return results;
    }

    /**
     * Clear old logs
     */
    clearOldLogs(daysOld = 30) {
        const files = this.getLogFiles();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        let deleted = 0;

        files.forEach(file => {
            if (file.modified < cutoffDate) {
                try {
                    fs.unlinkSync(file.path);
                    deleted++;
                } catch (error) {
                    this.error('Error deleting old log', { file: file.name, error: error.message });
                }
            }
        });

        return { deleted, message: `Deleted ${deleted} old log files` };
    }

    /**
     * Get log statistics
     */
    getStatistics() {
        const files = this.getLogFiles();
        
        return {
            totalFiles: files.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0),
            files: files.map(file => ({
                name: file.name,
                size: file.size,
                sizeFormatted: this.formatBytes(file.size),
                modified: file.modified
            }))
        };
    }

    /**
     * Format bytes to human-readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Export singleton instance
module.exports = new Logger();

