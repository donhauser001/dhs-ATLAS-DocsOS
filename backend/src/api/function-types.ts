/**
 * 功能类型 API
 */

import { Router, Request, Response } from 'express';
import {
    getFunctionTypeConfig,
    getFunctionType,
    getAllFunctionTypes,
    addFunctionType,
    updateFunctionType,
    deleteFunctionType,
} from '../services/function-type-config.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
    try {
        const config = getFunctionTypeConfig();
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get config' });
    }
});

router.get('/all', (_req: Request, res: Response) => {
    try {
        const types = getAllFunctionTypes();
        res.json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get types' });
    }
});

router.get('/type/:id', (req: Request, res: Response) => {
    try {
        const type = getFunctionType(req.params.id);
        if (!type) {
            return res.status(404).json({ success: false, error: `Function type ${req.params.id} not found` });
        }
        res.json({ success: true, data: type });
    } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get type' });
    }
});

router.post('/types', (req: Request, res: Response) => {
    try {
        const { id, label, description, icon, category, supportedDisplays } = req.body;
        if (!id || !label || !category) {
            return res.status(400).json({ success: false, error: 'Missing required fields: id, label, category' });
        }
        const newType = addFunctionType({ id, label, description, icon, category, supportedDisplays });
        res.json({ success: true, data: newType });
    } catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to add type' });
    }
});

router.put('/types/:id', (req: Request, res: Response) => {
    try {
        const { label, description, icon, supportedDisplays } = req.body;
        const updated = updateFunctionType(req.params.id, { label, description, icon, supportedDisplays });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to update type' });
    }
});

router.delete('/types/:id', (req: Request, res: Response) => {
    try {
        deleteFunctionType(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete type' });
    }
});

export default router;

