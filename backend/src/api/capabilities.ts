/**
 * 能力类型 API
 */

import { Router, Request, Response } from 'express';
import {
    getCapabilityConfig,
    getCapability,
    getAllCapabilities,
    addCapability,
    updateCapability,
    deleteCapability,
} from '../services/capability-config.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
    try {
        const config = getCapabilityConfig();
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get config' });
    }
});

router.get('/all', (_req: Request, res: Response) => {
    try {
        const caps = getAllCapabilities();
        res.json({ success: true, data: caps });
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get capabilities' });
    }
});

router.get('/capability/:id', (req: Request, res: Response) => {
    try {
        const cap = getCapability(req.params.id);
        if (!cap) {
            return res.status(404).json({ success: false, error: `Capability ${req.params.id} not found` });
        }
        res.json({ success: true, data: cap });
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get capability' });
    }
});

router.post('/capabilities', (req: Request, res: Response) => {
    try {
        const { id, label, description, icon, category, configHints } = req.body;
        if (!id || !label || !category) {
            return res.status(400).json({ success: false, error: 'Missing required fields: id, label, category' });
        }
        const newCap = addCapability({ id, label, description, icon, category, configHints });
        res.json({ success: true, data: newCap });
    } catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to add capability' });
    }
});

router.put('/capabilities/:id', (req: Request, res: Response) => {
    try {
        const { label, description, icon, configHints } = req.body;
        const updated = updateCapability(req.params.id, { label, description, icon, configHints });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to update capability' });
    }
});

router.delete('/capabilities/:id', (req: Request, res: Response) => {
    try {
        deleteCapability(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete capability' });
    }
});

export default router;

