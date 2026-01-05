/**
 * Password API - 密码加密服务
 * 
 * 提供密码哈希和验证功能
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * POST /api/password/hash
 * 对密码进行 bcrypt 哈希
 */
router.post('/hash', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password || typeof password !== 'string') {
            return res.status(400).json({ error: '密码不能为空' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: '密码长度至少为6位' });
        }

        // 生成盐并哈希密码
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        res.json({ hash });
    } catch (error) {
        console.error('[Password API] Hash error:', error);
        res.status(500).json({ error: '密码加密失败' });
    }
});

/**
 * POST /api/password/verify
 * 验证密码是否匹配
 */
router.post('/verify', async (req, res) => {
    try {
        const { password, hash } = req.body;

        if (!password || !hash) {
            return res.status(400).json({ error: '密码和哈希值不能为空' });
        }

        const match = await bcrypt.compare(password, hash);

        res.json({ match });
    } catch (error) {
        console.error('[Password API] Verify error:', error);
        res.status(500).json({ error: '密码验证失败' });
    }
});

/**
 * POST /api/password/generate
 * 生成随机强密码
 */
router.post('/generate', (req, res) => {
    try {
        const { length = 16 } = req.body;

        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const allChars = lowercase + uppercase + numbers + special;
        
        // 确保至少包含每种类型的字符
        let password = '';
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];
        
        // 填充剩余字符
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // 打乱顺序
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        res.json({ password });
    } catch (error) {
        console.error('[Password API] Generate error:', error);
        res.status(500).json({ error: '密码生成失败' });
    }
});

export default router;


