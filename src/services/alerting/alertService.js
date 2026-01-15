const EventEmitter = require('events');

/**
 * Alerting Service
 * Manages security alerts and notifications
 */

class AlertingService extends EventEmitter {
    constructor() {
        super();
        this.alerts = [];
        this.maxAlerts = 1000; // Keep last 1000 alerts in memory
        this.subscribers = new Map();
        
        // Alert severity levels
        this.SEVERITY = {
            LOW: 'LOW',
            MEDIUM: 'MEDIUM',
            HIGH: 'HIGH',
            CRITICAL: 'CRITICAL'
        };

        // Alert categories
        this.CATEGORY = {
            THREAT_DETECTED: 'THREAT_DETECTED',
            INTRUSION_ATTEMPT: 'INTRUSION_ATTEMPT',
            MALWARE_FOUND: 'MALWARE_FOUND',
            SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
            SYSTEM_ERROR: 'SYSTEM_ERROR',
            DATA_BREACH: 'DATA_BREACH',
            POLICY_VIOLATION: 'POLICY_VIOLATION'
        };

        // Initialize event listeners
        this.setupEventListeners();
    }

    /**
     * Setup internal event listeners
     */
    setupEventListeners() {
        this.on('alert', (alert) => {
            console.log(`[ALERT] ${alert.severity} - ${alert.title}`);
            this.notifySubscribers(alert);
        });
    }

    /**
     * Create and trigger a new alert
     */
    createAlert({
        title,
        description,
        severity = this.SEVERITY.MEDIUM,
        category,
        source,
        metadata = {},
        autoResolve = false,
        resolveAfter = 3600000 // 1 hour default
    }) {
        const alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title,
            description,
            severity,
            category,
            source,
            metadata,
            status: 'ACTIVE',
            createdAt: new Date(),
            resolvedAt: null,
            acknowledgedAt: null,
            acknowledgedBy: null
        };

        // Add to alerts array
        this.alerts.unshift(alert);

        // Maintain max alerts limit
        if (this.alerts.length > this.maxAlerts) {
            this.alerts = this.alerts.slice(0, this.maxAlerts);
        }

        // Emit alert event
        this.emit('alert', alert);

        // Auto-resolve if configured
        if (autoResolve) {
            setTimeout(() => {
                this.resolveAlert(alert.id, 'system', 'Auto-resolved after timeout');
            }, resolveAfter);
        }

        // TODO: Save to database
        // await prisma.alert.create({ data: alert });

        return alert;
    }

    /**
     * Create threat detection alert
     */
    alertThreatDetected({
        threatType,
        severity,
        confidence,
        source,
        details
    }) {
        return this.createAlert({
            title: `${threatType} Threat Detected`,
            description: `A ${threatType.toLowerCase()} threat was detected with ${(confidence * 100).toFixed(1)}% confidence.`,
            severity,
            category: this.CATEGORY.THREAT_DETECTED,
            source,
            metadata: {
                threatType,
                confidence,
                details
            }
        });
    }

    /**
     * Create malware detection alert
     */
    alertMalwareFound({
        fileName,
        fileHash,
        severity,
        scanResult,
        virusTotalScore
    }) {
        return this.createAlert({
            title: 'Malware Detected',
            description: `File "${fileName}" was flagged as malicious.`,
            severity,
            category: this.CATEGORY.MALWARE_FOUND,
            source: 'file_scanner',
            metadata: {
                fileName,
                fileHash,
                scanResult,
                virusTotalScore
            }
        });
    }

    /**
     * Create intrusion attempt alert
     */
    alertIntrusionAttempt({
        sourceIp,
        attackType,
        severity,
        details
    }) {
        return this.createAlert({
            title: `${attackType} Intrusion Attempt`,
            description: `Intrusion attempt detected from IP ${sourceIp}`,
            severity,
            category: this.CATEGORY.INTRUSION_ATTEMPT,
            source: 'network_monitor',
            metadata: {
                sourceIp,
                attackType,
                details
            }
        });
    }

    /**
     * Create suspicious activity alert
     */
    alertSuspiciousActivity({
        userId,
        activity,
        riskScore,
        details
    }) {
        return this.createAlert({
            title: 'Suspicious User Activity',
            description: `Unusual activity detected for user ${userId}`,
            severity: riskScore > 0.7 ? this.SEVERITY.HIGH : this.SEVERITY.MEDIUM,
            category: this.CATEGORY.SUSPICIOUS_ACTIVITY,
            source: 'behavior_analyzer',
            metadata: {
                userId,
                activity,
                riskScore,
                details
            }
        });
    }

    /**
     * Get active alerts
     */
    getActiveAlerts(filters = {}) {
        let filtered = this.alerts.filter(a => a.status === 'ACTIVE');

        if (filters.severity) {
            filtered = filtered.filter(a => a.severity === filters.severity);
        }

        if (filters.category) {
            filtered = filtered.filter(a => a.category === filters.category);
        }

        if (filters.source) {
            filtered = filtered.filter(a => a.source === filters.source);
        }

        return filtered;
    }

    /**
     * Get alert by ID
     */
    getAlertById(alertId) {
        return this.alerts.find(a => a.id === alertId);
    }

    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId, userId) {
        const alert = this.alerts.find(a => a.id === alertId);
        
        if (alert) {
            alert.acknowledgedAt = new Date();
            alert.acknowledgedBy = userId;
            
            this.emit('alert_acknowledged', alert);
            return alert;
        }
        
        return null;
    }

    /**
     * Resolve alert
     */
    resolveAlert(alertId, userId, resolution) {
        const alert = this.alerts.find(a => a.id === alertId);
        
        if (alert) {
            alert.status = 'RESOLVED';
            alert.resolvedAt = new Date();
            alert.resolvedBy = userId;
            alert.resolution = resolution;
            
            this.emit('alert_resolved', alert);
            return alert;
        }
        
        return null;
    }

    /**
     * Subscribe to alerts
     */
    subscribe(subscriberId, callback) {
        this.subscribers.set(subscriberId, callback);
        return () => this.unsubscribe(subscriberId);
    }

    /**
     * Unsubscribe from alerts
     */
    unsubscribe(subscriberId) {
        return this.subscribers.delete(subscriberId);
    }

    /**
     * Notify all subscribers of new alert
     */
    notifySubscribers(alert) {
        this.subscribers.forEach((callback, subscriberId) => {
            try {
                callback(alert);
            } catch (error) {
                console.error(`Error notifying subscriber ${subscriberId}:`, error);
            }
        });
    }

    /**
     * Get alert statistics
     */
    getStatistics() {
        const activeAlerts = this.alerts.filter(a => a.status === 'ACTIVE');
        
        return {
            total: this.alerts.length,
            active: activeAlerts.length,
            resolved: this.alerts.filter(a => a.status === 'RESOLVED').length,
            bySeverity: {
                low: this.alerts.filter(a => a.severity === this.SEVERITY.LOW).length,
                medium: this.alerts.filter(a => a.severity === this.SEVERITY.MEDIUM).length,
                high: this.alerts.filter(a => a.severity === this.SEVERITY.HIGH).length,
                critical: this.alerts.filter(a => a.severity === this.SEVERITY.CRITICAL).length
            },
            byCategory: this.getCategoryStats(),
            recent: this.alerts.slice(0, 10)
        };
    }

    /**
     * Get category statistics
     */
    getCategoryStats() {
        const stats = {};
        
        Object.values(this.CATEGORY).forEach(category => {
            stats[category.toLowerCase()] = this.alerts.filter(a => a.category === category).length;
        });
        
        return stats;
    }

    /**
     * Clear resolved alerts
     */
    clearResolvedAlerts() {
        const beforeCount = this.alerts.length;
        this.alerts = this.alerts.filter(a => a.status === 'ACTIVE');
        const cleared = beforeCount - this.alerts.length;
        
        return {
            message: `Cleared ${cleared} resolved alerts`,
            remaining: this.alerts.length
        };
    }

    /**
     * Send email notification (placeholder)
     */
    async sendEmailNotification(alert, recipients) {
        // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        console.log(`Email notification would be sent to: ${recipients.join(', ')}`);
        console.log(`Alert: ${alert.title}`);
        
        return {
            sent: false,
            message: 'Email service not configured'
        };
    }

    /**
     * Send SMS notification (placeholder)
     */
    async sendSMSNotification(alert, phoneNumbers) {
        // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
        console.log(`SMS notification would be sent to: ${phoneNumbers.join(', ')}`);
        console.log(`Alert: ${alert.title}`);
        
        return {
            sent: false,
            message: 'SMS service not configured'
        };
    }

    /**
     * Send webhook notification (placeholder)
     */
    async sendWebhookNotification(alert, webhookUrl) {
        // TODO: Send HTTP POST to webhook URL
        console.log(`Webhook notification would be sent to: ${webhookUrl}`);
        console.log(`Alert: ${alert.title}`);
        
        return {
            sent: false,
            message: 'Webhook not implemented'
        };
    }
}

module.exports = new AlertingService();

