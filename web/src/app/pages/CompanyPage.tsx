import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { PostCard } from '../components/PostCard';
import { ArrowLeft, RefreshCw, Eye, EyeOff, Instagram, CheckSquare, Square, GripVertical, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { Company, InstagramPost } from '../types';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type FilterType = 'all' | 'visible' | 'hidden';

function SortableCard({
  post,
  onToggleVisibility,
  selectionMode,
}: {
  post: InstagramPost;
  onToggleVisibility: (postId: string, isVisible: boolean) => void;
  selectionMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: post.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <PostCard
        post={post}
        onToggleVisibility={onToggleVisibility}
        selectionMode={selectionMode}
        reorderMode
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

export function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [orderedPosts, setOrderedPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { loadCompany(); }, [id]);

  useEffect(() => {
    if (company) setOrderedPosts(company.posts);
  }, [company]);

  const loadCompany = async () => {
    if (!id) return;
    try {
      const data = await api.getCompany(id);
      setCompany(data || null);
    } catch {
      toast.error('Erro ao carregar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!id) return;
    setSyncing(true);
    try {
      await api.syncCompany(id);
      toast.success('Posts sincronizados com sucesso');
      await loadCompany();
    } catch {
      toast.error('Erro ao sincronizar posts');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm(`Remover ${company?.name ?? id}?`)) return;
    try {
      await api.removeCompany(id);
      toast.success('Empresa removida com sucesso');
      navigate('/');
    } catch {
      toast.error('Erro ao remover empresa');
    }
  };

  const handleToggleVisibility = async (postId: string, isVisible: boolean) => {
    if (!id) return;
    try {
      await api.togglePostVisibility(id, postId, isVisible);
      setOrderedPosts(prev => prev.map(p => p.id === postId ? { ...p, isVisible } : p));
      setCompany(prev => prev ? { ...prev, posts: prev.posts.map(p => p.id === postId ? { ...p, isVisible } : p) } : null);
      toast.success(isVisible ? 'Post marcado como visível' : 'Post marcado como oculto');
    } catch {
      toast.error('Erro ao atualizar visibilidade');
    }
  };

  const handleToggleAll = async (visible: boolean) => {
    if (!company) return;
    try {
      await Promise.all(orderedPosts.map(p => api.togglePostVisibility(company.id, p.id, visible)));
      setOrderedPosts(prev => prev.map(p => ({ ...p, isVisible: visible })));
      setCompany(prev => prev ? { ...prev, posts: prev.posts.map(p => ({ ...p, isVisible: visible })) } : null);
      toast.success(visible ? 'Todos os posts marcados como visíveis' : 'Todos os posts marcados como ocultos');
    } catch {
      toast.error('Erro ao atualizar visibilidade');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedPosts(prev => {
      const oldIndex = prev.findIndex(p => p.id === active.id);
      const newIndex = prev.findIndex(p => p.id === over.id);
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      api.reorderPosts(id!, newOrder.map(p => p.id));
      return newOrder;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
              <Instagram className="w-7 h-7 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-lg border-2 border-primary/30 animate-ping" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando posts…</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Empresa não encontrada</p>
        <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-[#006a9a] transition-all">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </Link>
      </div>
    );
  }

  const visibleCount = orderedPosts.filter(p => p.isVisible).length;
  const hiddenCount = orderedPosts.length - visibleCount;

  const filteredPosts = orderedPosts.filter(p => {
    if (filter === 'visible') return p.isVisible;
    if (filter === 'hidden') return !p.isVisible;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#007cb2] via-[#0090cc] to-[#005a82] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors mb-5">
            <ArrowLeft className="w-4 h-4" />
            Todas as Empresas
          </Link>

          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <img
                src={company.avatar}
                alt={company.name}
                className="w-20 h-20 rounded-lg object-cover border-4 border-white/20 shadow-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=ffffff&color=007cb2&size=128`;
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
                <Instagram className="w-3.5 h-3.5 text-[#007cb2]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-white">{company.name}</h1>
              <p className="text-white/70 text-sm mt-0.5">{company.username}</p>

              <div className="mt-3 flex items-center gap-5">
                <div className="text-center">
                  <p className="text-white text-lg leading-tight">{orderedPosts.length}</p>
                  <p className="text-white/60 text-xs">posts</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <p className="text-white text-lg leading-tight">{visibleCount}</p>
                  <p className="text-white/60 text-xs">visíveis</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <p className="text-white text-lg leading-tight">{hiddenCount}</p>
                  <p className="text-white/60 text-xs">ocultos</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/10 hover:bg-red-500/80 text-white text-sm transition-all border border-white/20"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/15 hover:bg-white/25 text-white text-sm transition-all disabled:opacity-50 border border-white/20"
              >
                <RefreshCw className={clsx('w-4 h-4', syncing && 'animate-spin')} />
                Sincronizar
              </button>
              <button
                onClick={() => { setSelectionMode(!selectionMode); setReorderMode(false); }}
                disabled={reorderMode}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all shadow-md active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none',
                  selectionMode
                    ? 'bg-white text-[#007cb2] hover:bg-white/90'
                    : 'bg-[#c32e4e] hover:bg-[#a82541] text-white border border-white/10'
                )}
              >
                {selectionMode ? <><CheckSquare className="w-4 h-4" /> Concluir</> : <><Square className="w-4 h-4" /> Selecionar</>}
              </button>
              <button
                onClick={() => { setReorderMode(!reorderMode); setSelectionMode(false); }}
                disabled={selectionMode}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all shadow-md active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none',
                  reorderMode
                    ? 'bg-white text-[#007cb2] hover:bg-white/90'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                )}
              >
                <GripVertical className="w-4 h-4" />
                {reorderMode ? 'Concluir' : 'Reordenar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            {(['all', 'visible', 'hidden'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-4 py-1.5 rounded-lg text-sm transition-all',
                  filter === f ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f === 'all' && `Todos (${orderedPosts.length})`}
                {f === 'visible' && `Visíveis (${visibleCount})`}
                {f === 'hidden' && `Ocultos (${hiddenCount})`}
              </button>
            ))}
          </div>

          {selectionMode && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Seleção rápida:</span>
              <button
                onClick={() => handleToggleAll(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                Mostrar todos
              </button>
              <button
                onClick={() => handleToggleAll(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-secondary transition-all"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Ocultar todos
              </button>
            </div>
          )}

          {reorderMode && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              Arraste pelo ícone para reordenar
            </p>
          )}
        </div>
      </div>

      {/* Posts */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {selectionMode && (
          <div className="mb-6 px-4 py-3 rounded-md bg-primary/8 border border-primary/20 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm text-primary">
              Modo de seleção ativo — clique nos posts para alternar a visibilidade
            </p>
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mb-4">
              <Instagram className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {filter === 'all' ? 'Nenhum post encontrado' : `Nenhum post ${filter === 'visible' ? 'visível' : 'oculto'}`}
            </p>
            {filter === 'all' && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-[#006a9a] transition-all disabled:opacity-50"
              >
                <RefreshCw className={clsx('w-4 h-4', syncing && 'animate-spin')} />
                Sincronizar Posts
              </button>
            )}
          </div>
        ) : reorderMode ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredPosts.map(p => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredPosts.map(post => (
                  <SortableCard
                    key={post.id}
                    post={post}
                    onToggleVisibility={handleToggleVisibility}
                    selectionMode={false}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onToggleVisibility={handleToggleVisibility}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
