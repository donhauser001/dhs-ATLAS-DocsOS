/**
 * Proposal Preview - 变更提案预览
 * 
 * 显示待提交的变更，支持校验和执行
 */

import { useState } from 'react';
import { 
  createProposal, 
  validateProposal, 
  executeProposal,
  type UpdateYamlOp,
  type ValidationResult,
  type ExecuteResult 
} from '@/api/adl';

interface ProposalPreviewProps {
  docPath: string;
  changes: UpdateYamlOp[];
  onClose: () => void;
  onExecuted: () => void;
}

type Step = 'preview' | 'validating' | 'validated' | 'executing' | 'done' | 'error';

export function ProposalPreview({ docPath, changes, onClose, onExecuted }: ProposalPreviewProps) {
  const [step, setStep] = useState<Step>('preview');
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 创建并校验提案
  async function handleValidate() {
    setStep('validating');
    setError(null);
    
    try {
      // 创建提案
      const createResult = await createProposal({
        proposed_by: 'usr-genesis',
        proposed_at: new Date().toISOString(),
        target_file: docPath,
        ops: changes,
      });
      
      setProposalId(createResult.proposal_id);
      
      // 校验提案
      const validationResult = await validateProposal(createResult.proposal_id);
      setValidation(validationResult);
      setStep('validated');
    } catch (e) {
      setError(String(e));
      setStep('error');
    }
  }
  
  // 执行提案
  async function handleExecute() {
    if (!proposalId) return;
    
    setStep('executing');
    setError(null);
    
    try {
      const result = await executeProposal(proposalId);
      setExecuteResult(result);
      
      if (result.success) {
        setStep('done');
      } else {
        setError(result.error || 'Unknown error');
        setStep('error');
      }
    } catch (e) {
      setError(String(e));
      setStep('error');
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">变更提案</h2>
          <p className="text-sm text-slate-500">
            {docPath} · {changes.length} 个变更
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Changes List */}
          <div className="space-y-3">
            {changes.map((change, index) => (
              <div 
                key={index}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono text-slate-600">
                    {change.anchor}.{change.path}
                  </code>
                  <span className="text-xs text-slate-400">update_yaml</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">原值：</span>
                    <span className="text-red-600">{JSON.stringify(change.old_value)}</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div>
                    <span className="text-slate-500">新值：</span>
                    <span className="text-green-600">{JSON.stringify(change.value)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Validation Result */}
          {validation && (
            <div className={`mt-4 p-4 rounded-lg ${
              validation.valid 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`font-medium ${validation.valid ? 'text-green-800' : 'text-red-800'}`}>
                {validation.valid ? '校验通过' : '校验失败'}
              </div>
              {!validation.valid && validation.errors.length > 0 && (
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* Execute Result */}
          {executeResult && executeResult.success && (
            <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="font-medium text-green-800">执行成功</div>
              <div className="mt-1 text-sm text-green-700">
                Commit: <code className="font-mono">{executeResult.commit_hash}</code>
              </div>
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="font-medium text-red-800">错误</div>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {step === 'preview' && '准备提交'}
            {step === 'validating' && '正在校验...'}
            {step === 'validated' && (validation?.valid ? '校验通过，可以执行' : '校验失败')}
            {step === 'executing' && '正在执行...'}
            {step === 'done' && '执行完成'}
            {step === 'error' && '发生错误'}
          </div>
          
          <div className="flex items-center gap-3">
            {step === 'done' ? (
              <button
                onClick={onExecuted}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
              >
                完成
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm"
                  disabled={step === 'validating' || step === 'executing'}
                >
                  取消
                </button>
                
                {step === 'preview' && (
                  <button
                    onClick={handleValidate}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
                  >
                    校验提案
                  </button>
                )}
                
                {step === 'validated' && validation?.valid && (
                  <button
                    onClick={handleExecute}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    执行变更
                  </button>
                )}
                
                {step === 'error' && (
                  <button
                    onClick={() => setStep('preview')}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
                  >
                    重试
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProposalPreview;

