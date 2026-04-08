import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { Archive, Pin, Trash2, Edit2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

const getProjectVariant = (project: any) => {
  if (project?.state?.workflowVariant) return project.state.workflowVariant;
  return project?.state?.workflowType === 'gem' ? 'gem' : 'promo';
};

const getProjectBorderClass = (project: any) => {
  const variant = getProjectVariant(project);
  if (variant === 'gem') return 'border-blue-500';
  if (variant === 'promo-story') return 'border-emerald-500';
  return 'border-orange-500';
};

const getProjectRoute = (project: any) => {
  const variant = getProjectVariant(project);
  const step = project?.state?.currentStep || 1;

  if (variant === 'gem') {
    if (step === 8) return '/step-music';
    return `/step${step}`;
  }

  if (variant === 'promo-story') {
    if (step === 1) return '/promo-story/step1';
    if (step === 2) return '/promo-story/step2';
    if (step === 3) return '/promo-story/step3';
    if (step === 4) return '/promo-story/step4';
    if (step === 5) return '/step-music';
    return '/promo-story/step1';
  }

  if (step === 1) return '/step2a';
  if (step === 2) return '/step3a';
  if (step === 3) return '/step4a';
  if (step === 4) return '/step5a';
  if (step === 5) return '/step-music';
  return '/step2a';
};

export default function ProjectArchive() {
  const { projectHistory, pinProject, deleteProject, renameProject, loadProject } = useProjectStore();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const handleRename = (id: string, name: string) => {
    renameProject(id, name);
    setEditingId(null);
  };

  const handleLoadProject = (project: any) => {
    loadProject(project.id);
    navigate(getProjectRoute(project));
  };

  return (
    <div className="p-8 space-y-8">
      <div className="cursor-pointer" onClick={() => navigate('/')}>
        <h1 className="text-2xl font-bold text-white tracking-tight">GEM</h1>
        <p className="text-sm text-neutral-400">Generative Engine for Motion</p>
      </div>

      <div className="flex items-center gap-3 text-white">
        <Archive className="w-8 h-8 text-indigo-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">專案封存區</h1>
          <p className="text-sm text-neutral-400">保留已正式建檔的歷史專案與進度快照</p>
        </div>
      </div>

      {projectHistory.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl text-neutral-500">
          <Archive className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>目前還沒有任何已封存專案。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-5">
          {[...projectHistory]
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
            .map((project) => (
              <div
                key={project.id}
                className={clsx(
                  'aspect-square bg-neutral-900 border-2 rounded-2xl p-6 flex flex-col hover:scale-105 transition-transform cursor-pointer relative',
                  getProjectBorderClass(project)
                )}
                onClick={() => handleLoadProject(project)}
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); pinProject(project.id); }} className="p-1 hover:bg-neutral-800 rounded">
                    <Pin className={clsx('w-4 h-4', project.pinned ? 'text-yellow-500' : 'text-neutral-500')} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="p-1 hover:bg-neutral-800 rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(project.id);
                      setNewName(project.name);
                    }}
                    className="p-1 hover:bg-neutral-800 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>

                {editingId === project.id ? (
                  <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-neutral-800 text-white px-2 py-1 rounded w-full"
                    />
                    <button onClick={() => handleRename(project.id, newName)}>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </button>
                  </div>
                ) : (
                  <h3
                    className="text-lg font-bold text-white mb-2"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingId(project.id);
                      setNewName(project.name);
                    }}
                  >
                    {project.name || '未命名專案'}
                  </h3>
                )}

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  {getProjectVariant(project)}
                </p>
                <p className="mt-3 text-sm text-neutral-400 flex-1 overflow-hidden">
                  {project.description || '尚未填寫專案描述'}
                </p>
                <div className="text-xs text-neutral-500 font-mono mt-2">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
