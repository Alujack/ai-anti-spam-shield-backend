/**
 * Rate Limiting Middleware
 * Protects API from abuse and DDoS attacks
 */

class RateLimiter {
    constructor() {
        this.requests = new Map(); // Store request counts per IP
        this.cleanupInterval = 60000; // Cleanup old entries every minute

        // Start cleanup interval
        setInterval(() => this.cleanup(), this.cleanupInterval);
    }

    /**
     * Create rate limiting middleware
     */
    createLimiter(options = {}) {
        const {
            windowMs = 15 * 60 * 1000, // 15 minutes default
            max = 100, // 100 requests per window default
            message = 'Too many requests, please try again later.',
            statusCode = 429,
            skipSuccessfulRequests = false,
            skipFailedRequests = false,
            keyGenerator = (req) => req.ip || req.connection.remoteAddress,
            handler = (req, res) => {
                res.status(statusCode).json({
                    success: false,
                    message,
                    error: 'Rate limit exceeded',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }
        } = options;

        return (req, res, next) => {
            const key = keyGenerator(req);
            const now = Date.now();

            // Get or create request record for this key
            if (!this.requests.has(key)) {
                this.requests.set(key, []);
            }

            const requestTimestamps = this.requests.get(key);

            // Remove old requests outside the time window
            const validRequests = requestTimestamps.filter(timestamp => {
                return (now - timestamp) < windowMs;
            });

            // Check if limit exceeded
            if (validRequests.length >= max) {
                return handler(req, res, next);
            }

            // Add current request timestamp
            validRequests.push(now);
            this.requests.set(key, validRequests);

            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, max - validRequests.length));
            res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

            // Handle response to update counts
            const originalSend = res.send;
            res.send = function (data) {
                // Skip counting based on response
                if (
                    (skipSuccessfulRequests && res.statusCode < 400) ||
                    (skipFailedRequests && res.statusCode >= 400)
                ) {
                    const timestamps = this.requests.get(key);
                    timestamps.pop(); // Remove the last added timestamp
                    this.requests.set(key, timestamps);
                }

                return originalSend.call(res, data);
            }.bind(this);

            next();
        };
    }

    /**
     * Strict rate limiter for sensitive endpoints
     */
    strictLimiter() {
        return this.createLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // Only 5 requests per 15 minutes
            message: 'Too many requests to this endpoint. Please try again later.'
        });
    }

    /**
     * Auth rate limiter for login/register endpoints
     */
    authLimiter() {
        return this.createLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // 10 auth attempts per 15 minutes
            message: 'Too many authentication attempts. Please try again later.',
            skipSuccessfulRequests: true // Don't count successful logins
        });
    }

    /**
     * API rate limiter for general API endpoints
     */
    apiLimiter() {
        return this.createLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // 100 requests per 15 minutes
            message: 'API rate limit exceeded. Please try again later.'
        });
    }

    /**
     * File upload rate limiter
     */
    uploadLimiter() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 20, // 20 file uploads per hour
            message: 'File upload limit exceeded. Please try again later.'
        });
    }

    /**
     * Scan rate limiter
     */
    scanLimiter() {
        return this.createLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 50, // 50 scans per hour
            message: 'Scan limit exceeded. Please try again later.'
        });
    }

    /**
     * Cleanup old entries
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour

        let cleaned = 0;

        for (const [key, timestamps] of this.requests.entries()) {
            // Remove entries older than maxAge
            const validTimestamps = timestamps.filter(timestamp => {
                return (now - timestamp) < maxAge;
            });

            if (validTimestamps.length === 0) {
                this.requests.delete(key);
                cleaned++;
            } else {
                this.requests.set(key, validTimestamps);
            }
        }

        if (cleaned > 0) {
            console.log(`Rate limiter cleaned up ${cleaned} old entries`);
        }
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            trackedIPs: this.requests.size,
            totalRequests: Array.from(this.requests.values()).reduce((sum, arr) => sum + arr.length, 0)
        };
    }

    /**
     * Reset limits for specific key (useful for testing or admin override)
     */
    resetKey(key) {
        this.requests.delete(key);
        return { message: `Rate limit reset for key: ${key}` };
    }

    /**
     * Reset all limits
     */
    resetAll() {
        const count = this.requests.size;
        this.requests.clear();
        return { message: `Rate limits reset for ${count} keys` };
    }

    /**
     * Get rate limit info for specific key
     */
    getKeyInfo(key) {
        const timestamps = this.requests.get(key) || [];
        return {
            key,
            requestCount: timestamps.length,
            timestamps,
            oldestRequest: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
            newestRequest: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null
        };
    }

    /**
     * Create custom limiter with IP whitelist
     */
    createWhitelistedLimiter(options = {}, whitelist = []) {
        const baseLimiter = this.createLimiter(options);

        return (req, res, next) => {
            const ip = options.keyGenerator ? options.keyGenerator(req) : (req.ip || req.connection.remoteAddress);

            // Skip rate limiting for whitelisted IPs
            if (whitelist.includes(ip)) {
                return next();
            }

            return baseLimiter(req, res, next);
        };
    }

    /**
     * Create custom limiter with user-based limits
     */
    createUserLimiter(options = {}) {
        return this.createLimiter({
            ...options,
            keyGenerator: (req) => {
                // Use user ID if authenticated, otherwise use IP
                return req.user?.id || req.ip || req.connection.remoteAddress;
            }
        });
    }
}

// Export singleton instance
module.exports = new RateLimiter();

