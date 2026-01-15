const WebSocket = require('ws');
const alertingService = require('./alerting/alertService');
const networkMonitor = require('./networkMonitor/monitor');

/**
 * WebSocket Service for Real-time Updates
 * Provides real-time dashboard updates
 */

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map();
        this.updateInterval = 5000; // 5 seconds
        this.intervalId = null;
    }

    /**
     * Initialize WebSocket server
     */
    initialize(server) {
        this.wss = new WebSocket.Server({
            server,
            path: '/ws'
        });

        this.setupWebSocketServer();
        this.setupAlertSubscriptions();
        this.startPeriodicUpdates();

        console.log('WebSocket server initialized on /ws');
    }

    /**
     * Setup WebSocket server event handlers
     */
    setupWebSocketServer() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const ip = req.socket.remoteAddress;

            console.log(`WebSocket client connected: ${clientId} from ${ip}`);

            // Store client with metadata
            this.clients.set(clientId, {
                ws,
                ip,
                connectedAt: new Date(),
                subscriptions: [],
                authenticated: false,
                userId: null
            });

            // Setup client handlers
            this.setupClientHandlers(ws, clientId);

            // Send welcome message
            this.sendToClient(clientId, {
                type: 'connected',
                clientId,
                message: 'WebSocket connection established',
                timestamp: new Date()
            });

            // Send initial dashboard data
            this.sendDashboardUpdate(clientId);
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }

    /**
     * Setup individual client event handlers
     */
    setupClientHandlers(ws, clientId) {
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                this.handleClientMessage(clientId, data);
            } catch (error) {
                this.sendToClient(clientId, {
                    type: 'error',
                    message: 'Invalid message format',
                    error: error.message
                });
            }
        });

        ws.on('close', () => {
            console.log(`WebSocket client disconnected: ${clientId}`);
            this.clients.delete(clientId);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket client error (${clientId}):`, error);
        });

        ws.on('pong', () => {
            // Update last activity
            const client = this.clients.get(clientId);
            if (client) {
                client.lastActivity = new Date();
            }
        });
    }

    /**
     * Handle incoming messages from clients
     */
    handleClientMessage(clientId, data) {
        const { type, payload } = data;

        switch (type) {
            case 'subscribe':
                this.handleSubscribe(clientId, payload);
                break;

            case 'unsubscribe':
                this.handleUnsubscribe(clientId, payload);
                break;

            case 'authenticate':
                this.handleAuthenticate(clientId, payload);
                break;

            case 'ping':
                this.sendToClient(clientId, { type: 'pong', timestamp: new Date() });
                break;

            case 'request_update':
                this.sendDashboardUpdate(clientId);
                break;

            default:
                this.sendToClient(clientId, {
                    type: 'error',
                    message: `Unknown message type: ${type}`
                });
        }
    }

    /**
     * Handle subscription requests
     */
    handleSubscribe(clientId, payload) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { channels = [] } = payload;

        channels.forEach(channel => {
            if (!client.subscriptions.includes(channel)) {
                client.subscriptions.push(channel);
            }
        });

        this.sendToClient(clientId, {
            type: 'subscribed',
            channels: client.subscriptions,
            timestamp: new Date()
        });
    }

    /**
     * Handle unsubscription requests
     */
    handleUnsubscribe(clientId, payload) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { channels = [] } = payload;

        client.subscriptions = client.subscriptions.filter(
            sub => !channels.includes(sub)
        );

        this.sendToClient(clientId, {
            type: 'unsubscribed',
            channels: client.subscriptions,
            timestamp: new Date()
        });
    }

    /**
     * Handle authentication
     */
    handleAuthenticate(clientId, payload) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { token, userId } = payload;

        // TODO: Verify JWT token
        // For now, just mark as authenticated if token exists
        if (token) {
            client.authenticated = true;
            client.userId = userId;

            this.sendToClient(clientId, {
                type: 'authenticated',
                userId,
                timestamp: new Date()
            });
        } else {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Authentication failed'
            });
        }
    }

    /**
     * Setup alert service subscriptions
     */
    setupAlertSubscriptions() {
        // Subscribe to new alerts
        alertingService.on('alert', (alert) => {
            this.broadcast({
                type: 'alert',
                data: alert
            }, ['alerts', 'dashboard']);
        });

        // Subscribe to alert acknowledgments
        alertingService.on('alert_acknowledged', (alert) => {
            this.broadcast({
                type: 'alert_acknowledged',
                data: alert
            }, ['alerts', 'dashboard']);
        });

        // Subscribe to alert resolutions
        alertingService.on('alert_resolved', (alert) => {
            this.broadcast({
                type: 'alert_resolved',
                data: alert
            }, ['alerts', 'dashboard']);
        });
    }

    /**
     * Start periodic dashboard updates
     */
    startPeriodicUpdates() {
        this.intervalId = setInterval(() => {
            this.broadcastDashboardUpdate();
        }, this.updateInterval);
    }

    /**
     * Stop periodic updates
     */
    stopPeriodicUpdates() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Send dashboard update to specific client
     */
    async sendDashboardUpdate(clientId) {
        const data = await this.getDashboardData();

        this.sendToClient(clientId, {
            type: 'dashboard_update',
            data,
            timestamp: new Date()
        });
    }

    /**
     * Broadcast dashboard update to all subscribed clients
     */
    async broadcastDashboardUpdate() {
        const data = await this.getDashboardData();

        this.broadcast({
            type: 'dashboard_update',
            data,
            timestamp: new Date()
        }, ['dashboard']);
    }

    /**
     * Get dashboard data
     */
    async getDashboardData() {
        const alertStats = alertingService.getStatistics();
        const networkStats = await networkMonitor.getStatistics();

        return {
            alerts: {
                active: alertStats.active,
                total: alertStats.total,
                bySeverity: alertStats.bySeverity,
                recent: alertStats.recent.slice(0, 5)
            },
            network: {
                totalEvents: networkStats.totalEvents,
                suspiciousEvents: networkStats.suspiciousEvents,
                protocols: networkStats.protocols,
                topSources: networkStats.topSources
            },
            system: {
                connectedClients: this.clients.size,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage()
            }
        };
    }

    /**
     * Send message to specific client
     */
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);

        if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`Error sending to client ${clientId}:`, error);
            }
        }
    }

    /**
     * Broadcast message to all clients
     */
    broadcast(message, channels = []) {
        this.clients.forEach((client, clientId) => {
            // If channels specified, only send to subscribed clients
            if (channels.length > 0) {
                const hasSubscription = channels.some(channel =>
                    client.subscriptions.includes(channel)
                );

                if (!hasSubscription) return;
            }

            this.sendToClient(clientId, message);
        });
    }

    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get connected clients info
     */
    getClientsInfo() {
        const clients = [];

        this.clients.forEach((client, clientId) => {
            clients.push({
                clientId,
                ip: client.ip,
                connectedAt: client.connectedAt,
                authenticated: client.authenticated,
                userId: client.userId,
                subscriptions: client.subscriptions,
                isActive: client.ws.readyState === WebSocket.OPEN
            });
        });

        return clients;
    }

    /**
     * Close all connections and cleanup
     */
    shutdown() {
        this.stopPeriodicUpdates();

        this.clients.forEach((client, clientId) => {
            client.ws.close(1000, 'Server shutting down');
        });

        this.clients.clear();

        if (this.wss) {
            this.wss.close();
        }

        console.log('WebSocket service shut down');
    }
}

module.exports = new WebSocketService();

