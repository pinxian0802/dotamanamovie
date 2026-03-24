import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { BarChart3, TrendingUp, AlertCircle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { apiUsage, geminiUsage } = useProjectStore();
  const navigate = useNavigate();

  const totalCalls = Object.values(apiUsage).reduce((a, b) => a + b, 0);
  const totalPromptTokens = Object.values(geminiUsage).reduce((a, b) => a + b.promptTokens, 0);
  const totalOutputTokens = Object.values(geminiUsage).reduce((a, b) => a + b.outputTokens, 0);
  const totalEstimatedCost = Object.values(geminiUsage).reduce((a, b) => a + b.estimatedCostUsd, 0);

  return (
    <div className="p-8 space-y-8">
      <div className="cursor-pointer" onClick={() => navigate('/')}>
        <h1 className="text-2xl font-bold text-white tracking-tight">GEM Animation</h1>
        <p className="text-sm text-neutral-400">AI 動畫工作流整合平台</p>
      </div>
      <div className="flex items-center gap-3 text-white">
        <BarChart3 className="w-8 h-8 text-orange-500" />
        <h1 className="text-3xl font-bold tracking-tight">API 用量監控儀表板</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="text-neutral-400 text-sm mb-1">今日總 API 呼叫次數</div>
          <div className="text-4xl font-bold text-white">{totalCalls}</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="text-neutral-400 text-sm mb-1">預估成本 (USD)</div>
          <div className="text-4xl font-bold text-orange-500">${totalEstimatedCost.toFixed(4)}</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="text-neutral-400 text-sm mb-1">Prompt Tokens</div>
          <div className="text-4xl font-bold text-indigo-400">{totalPromptTokens.toLocaleString()}</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="text-neutral-400 text-sm mb-1">Output Tokens</div>
          <div className="text-4xl font-bold text-emerald-400">{totalOutputTokens.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          模型用量統計
        </h3>
        <div className="space-y-4">
          {Object.entries(geminiUsage).map(([model, usage]) => (
            <div key={model} className="flex items-center gap-4">
              <div className="w-32 text-sm text-neutral-400 font-mono">{model}</div>
              <div className="flex-1 h-4 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600" 
                  style={{ width: `${(usage.calls / (totalCalls || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="w-20 text-right text-sm font-bold text-white">{usage.calls} 次</div>
              <div className="w-24 text-right text-sm text-neutral-300">{usage.promptTokens.toLocaleString()} / {usage.outputTokens.toLocaleString()}</div>
              <div className="w-24 text-right text-sm font-bold text-orange-400">${usage.estimatedCostUsd.toFixed(4)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
