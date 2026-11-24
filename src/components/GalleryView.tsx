import React, { useState } from 'react';
import { Player } from '@remotion/player';
import {
  ArrowUpRight,
  Copy,
  Download,
  FilePlus2,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { COMPOSITIONS } from '../remotion/registry';
import { ASPECT_PRESETS, type StudioProject } from '../remotion/types';
import { projectToCompositionProps } from '../utils/projectStorage';

interface GalleryViewProps {
  projects: StudioProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateBlankProject: () => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onExportProjectJson: (project: StudioProject) => void;
  onTriggerImportJson: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateBlankProject,
  onDuplicateProject,
  onDeleteProject,
  onExportProjectJson,
  onTriggerImportJson,
}) => {
  const [query, setQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = projects.filter((proj) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      proj.title.toLowerCase().includes(q) ||
      proj.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Semua Komposisi &amp; Proyek Lokal
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Kelola template MQTT &amp; WebSocket maupun komposisi kustom yang tersimpan di browser Anda. Arahkan kursor pada pratinjau untuk memutar animasi secara langsung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari komposisi..."
                aria-label="Cari komposisi"
                className="w-full rounded-md bg-[#111827] border border-white/10 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={onTriggerImportJson}
              className="px-3 py-2 rounded-md border border-white/15 bg-[#111827] hover:bg-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Impor JSON</span>
            </button>

            <button
              type="button"
              onClick={onCreateBlankProject}
              className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Komposisi Baru</span>
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-white/10 rounded-lg p-12 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-slate-300">
              Tidak ada komposisi yang cocok dengan kata kunci &ldquo;{query}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
            >
              Tampilkan Semua Komposisi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((proj) => {
              const comp =
                COMPOSITIONS[proj.compositionId ?? 'MqttWebSocketExplainer'];
              const aspect = ASPECT_PRESETS[proj.aspectId];
              const isSelected = proj.id === activeProjectId;
              const isHovering = hoveredId === proj.id;
              const previewProps = {
                ...projectToCompositionProps(proj),
                audioVolume: 0,
                soundFxVolume: 0,
              };
              const initialFrame = Math.min(
                Math.max(0, proj.durationInFrames - 1),
                proj.clips[0]?.from ? proj.clips[0].from + 15 : 24
              );

              return (
                <article
                  key={proj.id}
                  onMouseEnter={() => setHoveredId(proj.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`rounded-lg border transition-colors bg-[#0F141F] overflow-hidden flex flex-col ${
                    isSelected
                      ? 'border-blue-500/70'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <div
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #1E293B 25%, transparent 25%), linear-gradient(-45deg, #1E293B 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1E293B 75%), linear-gradient(-45deg, transparent 75%, #1E293B 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      backgroundColor: '#0F172A',
                    }}
                    className="relative aspect-video border-b border-white/10 overflow-hidden flex items-center justify-center"
                  >
                    <Player
                      component={comp.component}
                      inputProps={previewProps}
                      durationInFrames={proj.durationInFrames}
                      fps={proj.fps}
                      compositionWidth={aspect.width}
                      compositionHeight={aspect.height}
                      autoPlay={isHovering}
                      loop
                      initialFrame={initialFrame}
                      controls={false}
                      style={{
                        width: proj.aspectId === '9:16' ? '32%' : '100%',
                        height: '100%',
                      }}
                    />
                  </div>

                  <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                        <span>
                          {proj.isDefaultTemplate
                            ? proj.compositionId === 'UiUxEngineerExplainer'
                              ? 'Template UI/UX'
                              : proj.compositionId === 'SseProtocolExplainer'
                                ? 'Template SSE'
                                : 'Template MQTT'
                            : 'Komposisi Kustom'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {aspect.width}×{aspect.height}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{proj.fps} fps</span>
                        <span aria-hidden="true">·</span>
                        <span>{(proj.durationInFrames / proj.fps).toFixed(1)} dtk</span>
                      </div>
                      <h2 className="text-lg font-semibold text-white mt-1.5">
                        {proj.title}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono tabular-nums text-slate-400 mr-1">
                          {proj.clips.length} Layer
                        </span>
                        <button
                          type="button"
                          onClick={() => onDuplicateProject(proj.id)}
                          title="Duplikat komposisi"
                          className="p-1.5 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 text-slate-300 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onExportProjectJson(proj)}
                          title="Ekspor file .kinetik.json"
                          className="p-1.5 rounded border border-white/10 bg-[#0B0F17] hover:bg-white/10 text-slate-300 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {projects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteProject(proj.id)}
                            title="Hapus komposisi"
                            className="p-1.5 rounded border border-white/10 bg-[#0B0F17] hover:bg-red-500/20 hover:border-red-500/40 text-slate-300 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectProject(proj.id)}
                        className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Buka di Studio</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
