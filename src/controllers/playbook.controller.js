const playbookEngine = require('../services/incidentResponse/playbooks');
const logger = require('../utils/advancedLogger');

/**
 * Get all playbooks
 */
exports.getAllPlaybooks = async (req, res) => {
    try {
        const playbooks = playbookEngine.getAllPlaybooks();
        
        res.json({
            success: true,
            count: playbooks.length,
            playbooks
        });
    } catch (error) {
        logger.error('Error fetching playbooks', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch playbooks'
        });
    }
};

/**
 * Get single playbook
 */
exports.getPlaybook = async (req, res) => {
    try {
        const { id } = req.params;
        const playbook = playbookEngine.getPlaybook(id);
        
        if (!playbook) {
            return res.status(404).json({
                success: false,
                error: 'Playbook not found'
            });
        }
        
        res.json({
            success: true,
            playbook
        });
    } catch (error) {
        logger.error('Error fetching playbook', { error: error.message, playbookId: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch playbook'
        });
    }
};

/**
 * Execute a playbook
 */
exports.executePlaybook = async (req, res) => {
    try {
        const { id } = req.params;
        const { threat, context = {} } = req.body;
        
        if (!threat) {
            return res.status(400).json({
                success: false,
                error: 'Threat data is required'
            });
        }
        
        logger.info(`Manual playbook execution requested: ${id}`, { 
            userId: req.user?.id, 
            threatId: threat.id 
        });
        
        const result = await playbookEngine.executePlaybook(id, threat, context);
        
        if (result.success) {
            logger.audit('Playbook executed successfully', {
                playbookId: id,
                executionId: result.execution.id,
                userId: req.user?.id,
                threatId: threat.id
            });
        }
        
        res.json(result);
    } catch (error) {
        logger.error('Error executing playbook', { 
            error: error.message, 
            playbookId: req.params.id 
        });
        res.status(500).json({
            success: false,
            error: 'Failed to execute playbook'
        });
    }
};

/**
 * Auto-execute playbook based on threat
 */
exports.autoExecutePlaybook = async (req, res) => {
    try {
        const { threat, context = {} } = req.body;
        
        if (!threat || !threat.threatType || !threat.severity) {
            return res.status(400).json({
                success: false,
                error: 'Valid threat data (threatType, severity) is required'
            });
        }
        
        logger.info('Auto-execution requested for threat', { 
            threatType: threat.threatType,
            severity: threat.severity,
            userId: req.user?.id
        });
        
        const result = await playbookEngine.autoExecutePlaybook(threat, context);
        
        if (result.success) {
            logger.audit('Playbook auto-executed', {
                executionId: result.execution?.id,
                threatId: threat.id,
                userId: req.user?.id
            });
        }
        
        res.json(result);
    } catch (error) {
        logger.error('Error in auto-execute playbook', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to auto-execute playbook'
        });
    }
};

/**
 * Toggle playbook enabled/disabled
 */
exports.togglePlaybook = async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;
        
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'enabled must be a boolean'
            });
        }
        
        const playbook = playbookEngine.togglePlaybook(id, enabled);
        
        logger.audit(`Playbook ${enabled ? 'enabled' : 'disabled'}`, {
            playbookId: id,
            playbookName: playbook.name,
            userId: req.user?.id
        });
        
        res.json({
            success: true,
            playbook
        });
    } catch (error) {
        logger.error('Error toggling playbook', { 
            error: error.message, 
            playbookId: req.params.id 
        });
        
        if (error.message === 'Playbook not found') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to toggle playbook'
        });
    }
};

/**
 * Get execution history
 */
exports.getExecutionHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const history = playbookEngine.getExecutionHistory(limit);
        
        res.json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        logger.error('Error fetching execution history', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch execution history'
        });
    }
};

/**
 * Get playbook history (executions for specific playbook)
 */
exports.getPlaybookHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        
        const allHistory = playbookEngine.getExecutionHistory(limit * 2);
        const playbookHistory = allHistory
            .filter(exec => exec.playbookId === id)
            .slice(0, limit);
        
        res.json({
            success: true,
            playbookId: id,
            count: playbookHistory.length,
            history: playbookHistory
        });
    } catch (error) {
        logger.error('Error fetching playbook history', { 
            error: error.message, 
            playbookId: req.params.id 
        });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch playbook history'
        });
    }
};

/**
 * Get statistics
 */
exports.getStatistics = async (req, res) => {
    try {
        const statistics = playbookEngine.getStatistics();
        
        res.json({
            success: true,
            statistics
        });
    } catch (error) {
        logger.error('Error fetching playbook statistics', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
};

