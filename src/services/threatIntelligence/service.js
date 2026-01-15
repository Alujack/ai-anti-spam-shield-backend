const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Threat Intelligence Service
 * Integrates with external threat intelligence sources
 */

class ThreatIntelligenceService {
    constructor() {
        this.virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY || '';
        this.abuseIPDBKey = process.env.ABUSEIPDB_API_KEY || '';
        this.cache = new Map(); // Simple in-memory cache
        this.cacheExpiry = 3600000; // 1 hour in milliseconds
    }

    /**
     * Check IP reputation using AbuseIPDB
     */
    async checkIPReputation(ip) {
        const cacheKey = `ip_${ip}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        if (!this.abuseIPDBKey) {
            return {
                source: 'abuseipdb',
                checked: false,
                message: 'API key not configured'
            };
        }

        try {
            const response = await axios.get(
                `https://api.abuseipdb.com/api/v2/check`,
                {
                    params: {
                        ipAddress: ip,
                        maxAgeInDays: 90
                    },
                    headers: {
                        'Key': this.abuseIPDBKey,
                        'Accept': 'application/json'
                    },
                    timeout: 5000
                }
            );

            const result = {
                source: 'abuseipdb',
                ip,
                abuseScore: response.data.data.abuseConfidenceScore,
                totalReports: response.data.data.totalReports,
                countryCode: response.data.data.countryCode,
                isWhitelisted: response.data.data.isWhitelisted,
                isTor: response.data.data.isTor,
                isSuspicious: response.data.data.abuseConfidenceScore > 50,
                checkedAt: new Date()
            };

            // Cache the result
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('AbuseIPDB check failed:', error.message);
            return {
                source: 'abuseipdb',
                ip,
                error: error.message,
                checked: false
            };
        }
    }

    /**
     * Check file hash using VirusTotal
     */
    async checkFileHash(fileHash) {
        const cacheKey = `hash_${fileHash}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        if (!this.virusTotalApiKey) {
            return {
                source: 'virustotal',
                checked: false,
                message: 'API key not configured'
            };
        }

        try {
            const response = await axios.get(
                `https://www.virustotal.com/api/v3/files/${fileHash}`,
                {
                    headers: {
                        'x-apikey': this.virusTotalApiKey
                    },
                    timeout: 5000
                }
            );

            const stats = response.data.data.attributes.last_analysis_stats;
            const result = {
                source: 'virustotal',
                fileHash,
                malicious: stats.malicious || 0,
                suspicious: stats.suspicious || 0,
                undetected: stats.undetected || 0,
                harmless: stats.harmless || 0,
                totalScans: Object.values(stats).reduce((a, b) => a + b, 0),
                detectionRate: ((stats.malicious + stats.suspicious) / Object.values(stats).reduce((a, b) => a + b, 0)) * 100,
                isMalicious: (stats.malicious + stats.suspicious) > 0,
                checkedAt: new Date()
            };

            // Cache the result
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return {
                    source: 'virustotal',
                    fileHash,
                    found: false,
                    message: 'File hash not found in VirusTotal database'
                };
            }
            
            console.error('VirusTotal check failed:', error.message);
            return {
                source: 'virustotal',
                fileHash,
                error: error.message,
                checked: false
            };
        }
    }

    /**
     * Check URL reputation using VirusTotal
     */
    async checkURLReputation(url) {
        const cacheKey = `url_${url}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        if (!this.virusTotalApiKey) {
            return {
                source: 'virustotal',
                checked: false,
                message: 'API key not configured'
            };
        }

        try {
            // First, submit URL for analysis
            const submitResponse = await axios.post(
                'https://www.virustotal.com/api/v3/urls',
                new URLSearchParams({ url }),
                {
                    headers: {
                        'x-apikey': this.virusTotalApiKey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 5000
                }
            );

            const analysisId = submitResponse.data.data.id;

            // Get analysis results
            const analysisResponse = await axios.get(
                `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
                {
                    headers: {
                        'x-apikey': this.virusTotalApiKey
                    },
                    timeout: 5000
                }
            );

            const stats = analysisResponse.data.data.attributes.stats;
            const result = {
                source: 'virustotal',
                url,
                malicious: stats.malicious || 0,
                suspicious: stats.suspicious || 0,
                undetected: stats.undetected || 0,
                harmless: stats.harmless || 0,
                totalScans: Object.values(stats).reduce((a, b) => a + b, 0),
                detectionRate: ((stats.malicious + stats.suspicious) / Object.values(stats).reduce((a, b) => a + b, 0)) * 100,
                isMalicious: (stats.malicious + stats.suspicious) > 0,
                checkedAt: new Date()
            };

            // Cache the result
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('VirusTotal URL check failed:', error.message);
            return {
                source: 'virustotal',
                url,
                error: error.message,
                checked: false
            };
        }
    }

    /**
     * Get comprehensive threat intelligence for IP
     */
    async getThreatIntelForIP(ip) {
        const [abuseIPDB] = await Promise.all([
            this.checkIPReputation(ip)
        ]);

        return {
            ip,
            sources: {
                abuseipdb: abuseIPDB
            },
            overallThreatScore: abuseIPDB.abuseScore || 0,
            isThreat: abuseIPDB.isSuspicious || false,
            analyzedAt: new Date()
        };
    }

    /**
     * Get comprehensive threat intelligence for file
     */
    async getThreatIntelForFile(fileHash) {
        const virusTotal = await this.checkFileHash(fileHash);

        return {
            fileHash,
            sources: {
                virustotal: virusTotal
            },
            overallThreatScore: virusTotal.detectionRate || 0,
            isThreat: virusTotal.isMalicious || false,
            analyzedAt: new Date()
        };
    }

    /**
     * Clear cache (useful for testing or manual refresh)
     */
    clearCache() {
        this.cache.clear();
        return { message: 'Cache cleared successfully' };
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            cacheExpiry: this.cacheExpiry,
            cachedItems: Array.from(this.cache.keys())
        };
    }
}

module.exports = new ThreatIntelligenceService();

