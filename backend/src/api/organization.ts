import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { authenticate, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 相对于 backend/dist/api 目录往上三级到项目根目录
const REPOSITORY_PATH = process.env.REPOSITORY_PATH || path.resolve(__dirname, '../../../repository');

export const organizationRouter = Router();

// 企业资料文件路径
const getCompanyFilePath = () => path.join(REPOSITORY_PATH, 'workspace/组织/企业资料.yml');
const getDepartmentsFilePath = () => path.join(REPOSITORY_PATH, 'workspace/组织/部门.yml');
const getPositionsFilePath = () => path.join(REPOSITORY_PATH, 'workspace/组织/职位.yml');

/**
 * GET /api/organization/company
 * 获取企业资料
 */
organizationRouter.get('/company', authenticate, async (req: Request, res: Response) => {
  try {
    const filePath = getCompanyFilePath();
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.parse(content);

    res.json({
      success: true,
      data: {
        // 基本信息
        full_name: data.company?.full_name || '',
        short_name: data.company?.short_name || '',
        logo: data.company?.logo || '',
        description: data.company?.description || '',
        // 工商信息
        credit_code: data.registration?.credit_code || '',
        business_license_file: data.registration?.business_license_file || '',
        bank_name: data.registration?.bank_name || '',
        bank_account: data.registration?.bank_account || '',
        bank_permit_number: data.registration?.bank_permit_number || '',
        bank_permit_file: data.registration?.bank_permit_file || '',
        legal_person_name: data.registration?.legal_person_name || '',
        legal_person_phone: data.registration?.legal_person_phone || '',
        legal_person_id: data.registration?.legal_person_id || '',
        legal_person_id_file: data.registration?.legal_person_id_file || '',
        // 联系人
        contact_employee_id: data.contact?.employee_id || '',
        contact_name: data.contact?.name || '',
        contact_phone: data.contact?.phone || '',
        contact_email: data.contact?.email || '',
        // 地址
        registered_address: data.address?.registered || '',
        delivery_address: data.address?.delivery || '',
        // 开票资料
        invoice_title: data.invoice?.title || '',
        invoice_tax_number: data.invoice?.tax_number || '',
        invoice_bank_name: data.invoice?.bank_name || '',
        invoice_bank_account: data.invoice?.bank_account || '',
        invoice_address: data.invoice?.address || '',
        invoice_phone: data.invoice?.phone || '',
      },
    });
  } catch (error) {
    console.error('Get company info error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '获取企业资料失败' },
    });
  }
});

/**
 * PUT /api/organization/company
 * 更新企业资料
 */
organizationRouter.put(
  '/company',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const filePath = getCompanyFilePath();
      const {
        full_name,
        short_name,
        logo,
        description,
        credit_code,
        business_license_file,
        bank_name,
        bank_account,
        bank_permit_number,
        bank_permit_file,
        legal_person_name,
        legal_person_phone,
        legal_person_id,
        legal_person_id_file,
        contact_employee_id,
        contact_name,
        contact_phone,
        contact_email,
        registered_address,
        delivery_address,
        invoice_title,
        invoice_tax_number,
        invoice_bank_name,
        invoice_bank_account,
        invoice_address,
        invoice_phone,
      } = req.body;

      const data = {
        company: {
          full_name: full_name || '',
          short_name: short_name || '',
          logo: logo || '',
          description: description || '',
        },
        registration: {
          credit_code: credit_code || '',
          business_license_file: business_license_file || '',
          bank_name: bank_name || '',
          bank_account: bank_account || '',
          bank_permit_number: bank_permit_number || '',
          bank_permit_file: bank_permit_file || '',
          legal_person_name: legal_person_name || '',
          legal_person_phone: legal_person_phone || '',
          legal_person_id: legal_person_id || '',
          legal_person_id_file: legal_person_id_file || '',
        },
        contact: {
          employee_id: contact_employee_id || '',
          name: contact_name || '',
          phone: contact_phone || '',
          email: contact_email || '',
        },
        address: {
          registered: registered_address || '',
          delivery: delivery_address || '',
        },
        invoice: {
          title: invoice_title || '',
          tax_number: invoice_tax_number || '',
          bank_name: invoice_bank_name || '',
          bank_account: invoice_bank_account || '',
          address: invoice_address || '',
          phone: invoice_phone || '',
        },
      };

      // 使用 yaml 库生成 YAML，自动处理多行文本和特殊字符
      const yamlContent = yaml.stringify(data, {
        lineWidth: 0, // 不自动换行
        defaultStringType: 'QUOTE_DOUBLE', // 默认使用双引号
        defaultKeyType: 'PLAIN', // key 不加引号
      });

      await fs.writeFile(filePath, yamlContent, 'utf-8');

      res.json({
        success: true,
        message: '企业资料已更新',
      });
    } catch (error) {
      console.error('Update company info error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: '更新企业资料失败' },
      });
    }
  }
);

/**
 * GET /api/organization/departments
 * 获取部门列表
 */
organizationRouter.get('/departments', authenticate, async (req: Request, res: Response) => {
  try {
    const filePath = getDepartmentsFilePath();
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.parse(content);

    res.json({
      success: true,
      departments: data.departments || [],
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '获取部门列表失败' },
    });
  }
});

/**
 * POST /api/organization/departments
 * 创建部门
 */
organizationRouter.post(
  '/departments',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, code, description } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: '部门名称和代码为必填项' },
        });
      }

      const filePath = getDepartmentsFilePath();
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.parse(content) || { departments: [] };

      // 检查代码是否重复
      if (data.departments?.some((d: any) => d.code === code)) {
        return res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE_CODE', message: '部门代码已存在' },
        });
      }

      const newDept = {
        id: `dept-${Date.now()}`,
        name,
        code,
        description: description || '',
        status: 'active',
        created_at: new Date().toISOString().split('T')[0],
      };

      data.departments = data.departments || [];
      data.departments.push(newDept);

      await fs.writeFile(filePath, yaml.stringify(data), 'utf-8');

      res.json({ success: true, department: newDept });
    } catch (error) {
      console.error('Create department error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: '创建部门失败' },
      });
    }
  }
);

/**
 * PUT /api/organization/departments/:id
 * 更新部门
 */
organizationRouter.put(
  '/departments/:id',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, code, description, status } = req.body;

      const filePath = getDepartmentsFilePath();
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.parse(content);

      const index = data.departments?.findIndex((d: any) => d.id === id);
      if (index === -1 || index === undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '部门不存在' },
        });
      }

      // 检查代码是否与其他部门重复
      if (code && data.departments.some((d: any, i: number) => d.code === code && i !== index)) {
        return res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE_CODE', message: '部门代码已存在' },
        });
      }

      data.departments[index] = {
        ...data.departments[index],
        ...(name && { name }),
        ...(code && { code }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      };

      await fs.writeFile(filePath, yaml.stringify(data), 'utf-8');

      res.json({ success: true, department: data.departments[index] });
    } catch (error) {
      console.error('Update department error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: '更新部门失败' },
      });
    }
  }
);

/**
 * DELETE /api/organization/departments/:id
 * 删除部门
 */
organizationRouter.delete(
  '/departments/:id',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const filePath = getDepartmentsFilePath();
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.parse(content);

      const index = data.departments?.findIndex((d: any) => d.id === id);
      if (index === -1 || index === undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '部门不存在' },
        });
      }

      data.departments.splice(index, 1);
      await fs.writeFile(filePath, yaml.stringify(data), 'utf-8');

      res.json({ success: true, message: '部门已删除' });
    } catch (error) {
      console.error('Delete department error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: '删除部门失败' },
      });
    }
  }
);

/**
 * GET /api/organization/positions
 * 获取职位列表
 */
organizationRouter.get('/positions', authenticate, async (req: Request, res: Response) => {
  try {
    const filePath = getPositionsFilePath();
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.parse(content);

    res.json({
      success: true,
      positions: data.positions || [],
    });
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '获取职位列表失败' },
    });
  }
});

/**
 * POST /api/organization/positions
 * 创建职位
 */
organizationRouter.post(
  '/positions',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, code, level, department_code, description } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: '职位名称和代码为必填项' },
        });
      }

      const filePath = getPositionsFilePath();
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.parse(content) || { positions: [] };

      // 检查代码是否重复
      if (data.positions?.some((p: any) => p.code === code)) {
        return res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE_CODE', message: '职位代码已存在' },
        });
      }

      const newPos = {
        id: `pos-${Date.now()}`,
        name,
        code,
        level: level || 5,
        department_code: department_code || '',
        description: description || '',
        status: 'active',
        created_at: new Date().toISOString().split('T')[0],
      };

      data.positions = data.positions || [];
      data.positions.push(newPos);

      await fs.writeFile(filePath, yaml.stringify(data), 'utf-8');

      res.json({ success: true, position: newPos });
    } catch (error) {
      console.error('Create position error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: '创建职位失败' },
      });
    }
  }
);

/**
 * PUT /api/organization/positions/:id
 * 更新职位
 */
organizationRouter.put(
  '/positions/:id',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, code, level, department_code, description, status } = req.body;

      const filePath = getPositionsFilePath();
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.parse(content);

      const index = data.positions?.findIndex((p: any) => p.id === id);
      if (index === -1 || index === undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '职位不存在' },
        });
      }

      // 检查代码是否与其他职位重复
      if (code && data.positions.some((p: any, i: number) => p.code === code && i !== index)) {
        return res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE_CODE', message: '职位代码已存在' },
        });
      }

      data.positions[index] = {
        ...data.positions[index],
        ...(name && { name }),
        ...(code && { code }),
        ...(level !== undefined && { level }),
        ...(department_code !== undefined && { department_code }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      };

      await fs.writeFile(filePath, yaml.stringify(data), 'utf-8');

      res.json({ success: true, position: data.positions[index] });
    } catch (error) {
      console.error('Update position error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: '更新职位失败' },
      });
    }
  }
);

/**
 * DELETE /api/organization/positions/:id
 * 删除职位
 */
organizationRouter.delete(
  '/positions/:id',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const filePath = getPositionsFilePath();
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.parse(content);

      const index = data.positions?.findIndex((p: any) => p.id === id);
      if (index === -1 || index === undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '职位不存在' },
        });
      }

      data.positions.splice(index, 1);
      await fs.writeFile(filePath, yaml.stringify(data), 'utf-8');

      res.json({ success: true, message: '职位已删除' });
    } catch (error) {
      console.error('Delete position error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: '删除职位失败' },
      });
    }
  }
);

