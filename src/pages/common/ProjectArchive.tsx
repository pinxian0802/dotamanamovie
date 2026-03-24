import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { Archive, Pin, Trash2, Edit2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

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
    const type = project.state.workflowType;
    const step = project.state.currentStep || 1;
    
    if (type === 'gem') {
      if (step === 8) navigate('/step-music');
      else navigate(`/step${step}`);
    } else if (type === 'promo') {
      if (step === 1) navigate('/step2a');
      else if (step === 2) navigate('/step3a');
      else if (step === 3) navigate('/step4a');
      else if (step === 4) navigate('/step5a');
      else if (step === 5) navigate('/step-music');
      else navigate('/step2a');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="cursor-pointer" onClick={() => navigate('/')}>
        <h1 className="text-2xl font-bold text-white tracking-tight">GEM Animation</h1>
        <p className="text-sm text-neutral-400">AI 動畫工作流整合平台</p>
      </div>
      <div className="flex items-center gap-3 text-white">
        <Archive className="w-8 h-8 text-indigo-500" />
        <h1 className="text-3xl font-bold tracking-tight">歷史專案庫</h1>
      </div>

      {projectHistory.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl text-neutral-500">
          <Archive className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>尚無歷史專案紀錄</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-6">
          {[...projectHistory].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map((project) => (
            <div 
              key={project.id} 
              className={clsx(
                "aspect-square bg-neutral-900 border-2 rounded-2xl p-6 flex flex-col hover:scale-105 transition-transform cursor-pointer relative",
                project.state?.workflowType === 'gem' ? "border-blue-500" : "border-orange-500"
              )}
              onClick={() => handleLoadProject(project)}
            >
              <div className="absolute top-2 right-2 flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); pinProject(project.id); }} className="p-1 hover:bg-neutral-800 rounded">
                  <Pin className={clsx("w-4 h-4", project.pinned ? "text-yellow-500" : "text-neutral-500")} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="p-1 hover:bg-neutral-800 rounded">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setEditingId(project.id); setNewName(project.name); }} className="p-1 hover:bg-neutral-800 rounded">
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
                  <button onClick={() => handleRename(project.id, newName)}><Check className="w-4 h-4 text-emerald-500" /></button>
                </div>
              ) : (
                <h3 className="text-lg font-bold text-white mb-2" onDoubleClick={(e) => { e.stopPropagation(); setEditingId(project.id); setNewName(project.name); }}>
                  {project.name || '未命名專案'}
                </h3>
              )}
              
              <p className="text-sm text-neutral-400 flex-1 overflow-hidden">{project.description || '無大綱'}</p>
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
