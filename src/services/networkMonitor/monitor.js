/**
 * Network Monitoring Service
 * Monitors network traffic for threats
 */

class NetworkMonitor {
    constructor() {
        this.isMonitoring = false;
        this.events = [];
    }
    
    async startMonitoring() {
        this.isMonitoring = true;
        console.log('Network monitoring started');
        
        // Start packet capture (placeholder)
        // In production, integrate with tools like:
        // - node-pcap
        // - cap
        // - Python service with scapy
        
        return { success: true, message: 'Monitoring started' };
    }
    
    async stopMonitoring() {
        this.isMonitoring = false;
        console.log('Network monitoring stopped');
        return { success: true, message: 'Monitoring stopped' };
    }
    
    async getEvents(filters = {}) {
        // Return network events
        return {
            events: this.events,
            total: this.events.length,
            suspicious: this.events.filter(e => e.isSuspicious).length
        };
    }
    
    async getStatistics() {
        return {
            totalEvents: this.events.length,
            suspiciousEvents: this.events.filter(e => e.isSuspicious).length,
            protocols: this.getProtocolDistribution(),
            topSources: this.getTopSources()
        };
    }
    
    getProtocolDistribution() {
        const protocols = {};
        this.events.forEach(event => {
            protocols[event.protocol] = (protocols[event.protocol] || 0) + 1;
        });
        return protocols;
    }
    
    getTopSources() {
        const sources = {};
        this.events.forEach(event => {
            sources[event.sourceIp] = (sources[event.sourceIp] || 0) + 1;
        });
        return Object.entries(sources)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, count }));
    }
}

module.exports = new NetworkMonitor();
