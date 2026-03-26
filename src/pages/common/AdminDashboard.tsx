import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { BarChart3, TrendingUp, CalendarRange } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_COPY, APP_NAME, APP_FULL_NAME } from '../../config/workflowCopy';

type AggregatedUsage = {
  calls: number;
  promptTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
};

const toDateInputValue = (value: Date) => value.toISOString().slice(0, 10);
const getDayStart = (value: string) => new Date(`${value}T00:00:00`);
const getDayEnd = (value: string) => new Date(`${value}T23:59:59.999`);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const usageHistory = useProjectStore((state) => state.usageHistory);
  const today = React.useMemo(() => toDateInputValue(new Date()), []);
  const [startDate, setStartDate] = React.useState(today);
  const [endDate, setEndDate] = React.useState(today);

  const normalizedRange = React.useMemo(() => {
    if (!startDate || !endDate) return { startDate, endDate };
    return startDate <= endDate ? { startDate, endDate } : { startDate: endDate, endDate: startDate };
  }, [endDate, startDate]);

  const filteredEntries = React.useMemo(() => {
    const start = normalizedRange.startDate ? getDayStart(normalizedRange.startDate) : null;
    const end = normalizedRange.endDate ? getDayEnd(normalizedRange.endDate) : null;

    return usageHistory.filter((entry) => {
      const timestamp = new Date(entry.timestamp);
      if (Number.isNaN(timestamp.getTime())) return false;
      if (start && timestamp < start) return false;
      if (end && timestamp > end) return false;
      return true;
    });
  }, [normalizedRange.endDate, normalizedRange.startDate, usageHistory]);

  const aggregatedByModel = React.useMemo(() => {
    return filteredEntries.reduce<Record<string, AggregatedUsage>>((acc, entry) => {
      const prev = acc[entry.model] || {
        calls: 0,
        promptTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
      };

      acc[entry.model] = {
        calls: prev.calls + entry.calls,
        promptTokens: prev.promptTokens + entry.promptTokens,
        outputTokens: prev.outputTokens + entry.outputTokens,
        estimatedCostUsd: prev.estimatedCostUsd + entry.estimatedCostUsd,
      };

      return acc;
    }, {});
  }, [filteredEntries]);

  const totalCalls = filteredEntries.reduce((sum, entry) => sum + entry.calls, 0);
  const totalPromptTokens = filteredEntries.reduce((sum, entry) => sum + entry.promptTokens, 0);
  const totalOutputTokens = filteredEntries.reduce((sum, entry) => sum + entry.outputTokens, 0);
  const totalEstimatedCost = filteredEntries.reduce((sum, entry) => sum + entry.estimatedCostUsd, 0);
  const modelRows = Object.entries(aggregatedByModel).sort((a, b) => b[1].calls - a[1].calls);

  return (
    <div className="p-8 space-y-8">
      <div className="cursor-pointer" onClick={() => navigate('/')}>
        <h1 className="text-2xl font-bold text-white tracking-tight">{APP_NAME}</h1>
        <p className="text-sm text-neutral-400">{APP_FULL_NAME}</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3 text-white">
          <BarChart3 className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ADMIN_COPY.title}</h1>
            <p className="text-sm text-neutral-400">{ADMIN_COPY.subtitle}</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex items-center gap-2 text-neutral-300">
            <CalendarRange className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium">日期區間</span>
          </div>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            開始日期
            <input
              type="date"
              value={normalizedRange.startDate}
              max={normalizedRange.endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            結束日期
            <input
              type="date"
              value={normalizedRange.endDate}
              min={normalizedRange.startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="text-neutral-400 text-sm mb-1">{ADMIN_COPY.calls}</div>
          <div className="text-4xl font-bold text-white">{totalCalls}</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="text-neutral-400 text-sm mb-1">{ADMIN_COPY.cost}</div>
          <div className="text-4xl font-bold text-orange-500">${totalEstimatedCost.toFixed(4)}</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="text-neutral-400 text-sm mb-1">{ADMIN_COPY.promptTokens}</div>
          <div className="text-4xl font-bold text-indigo-400">{totalPromptTokens.toLocaleString()}</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="text-neutral-400 text-sm mb-1">{ADMIN_COPY.outputTokens}</div>
          <div className="text-4xl font-bold text-emerald-400">{totalOutputTokens.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          {ADMIN_COPY.breakdown}
        </h3>

        {modelRows.length === 0 ? (
          <div className="text-neutral-400 text-sm">{ADMIN_COPY.empty}</div>
        ) : (
          <div className="space-y-4">
            {modelRows.map(([model, usage]) => (
              <div
                key={model}
                className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 lg:flex-row lg:items-center lg:gap-4"
              >
                <div className="w-full lg:w-40 text-sm text-neutral-300 font-mono break-all">{model}</div>
                <div className="flex-1 h-4 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${(usage.calls / (totalCalls || 1)) * 100}%` }}
                  />
                </div>
                <div className="w-full lg:w-24 text-sm font-bold text-white lg:text-right">{usage.calls} 次</div>
                <div className="w-full lg:w-36 text-sm text-neutral-300 lg:text-right">
                  {usage.promptTokens.toLocaleString()} / {usage.outputTokens.toLocaleString()}
                </div>
                <div className="w-full lg:w-24 text-sm font-bold text-orange-400 lg:text-right">
                  ${usage.estimatedCostUsd.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
