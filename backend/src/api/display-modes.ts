/**
 * 显现模式 API
 */

import { Router, Request, Response } from 'express';
import {
    getDisplayModeConfig,
    getDisplayMode,
    getAllDisplayModes,
    addDisplayMode,
    updateDisplayMode,
    deleteDisplayMode,
} from '../services/display-mode-config.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
    try {
        const config = getDisplayModeConfig();
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get config' });
    }
});

router.get('/all', (_req: Request, res: Response) => {
    try {
        const modes = getAllDisplayModes();
        res.json({ success: true, data: modes });
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get modes' });
    }
});

router.get('/mode/:id', (req: Request, res: Response) => {
    try {
        const mode = getDisplayMode(req.params.id);
        if (!mode) {
            return res.status(404).json({ success: false, error: `Display mode ${req.params.id} not found` });
        }
        res.json({ success: true, data: mode });
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get mode' });
    }
});

router.post('/modes', (req: Request, res: Response) => {
    try {
        const { id, label, description, icon, category, configHints } = req.body;
        if (!id || !label || !category) {
            return res.status(400).json({ success: false, error: 'Missing required fields: id, label, category' });
        }
        const newMode = addDisplayMode({ id, label, description, icon, category, configHints });
        res.json({ success: true, data: newMode });
    } catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to add mode' });
    }
});

router.put('/modes/:id', (req: Request, res: Response) => {
    try {
        const { label, description, icon, configHints } = req.body;
        const updated = updateDisplayMode(req.params.id, { label, description, icon, configHints });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to update mode' });
    }
});

router.delete('/modes/:id', (req: Request, res: Response) => {
    try {
        deleteDisplayMode(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete mode' });
    }
});

export default router;

