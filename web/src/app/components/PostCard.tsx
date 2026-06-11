import { Eye, EyeOff, CheckCircle2, GripVertical, Pin } from 'lucide-react';
import { InstagramPost } from '../types';
import { clsx } from 'clsx';

interface PostCardProps {
  post: InstagramPost;
  onToggleVisibility: (postId: string, isVisible: boolean) => void;
  selectionMode?: boolean;
  reorderMode?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}

export function PostCard({
  post,
  onToggleVisibility,
  selectionMode = false,
  reorderMode = false,
  dragHandleProps,
  isDragging = false,
}: PostCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div
      className={clsx(
        'bg-card rounded-lg overflow-hidden shadow-sm transition-all duration-200 border border-border/50',
        selectionMode && 'cursor-pointer',
        selectionMode && post.isVisible && 'hover:shadow-lg hover:border-primary/30 ring-2 ring-primary/20',
        selectionMode && !post.isVisible && 'opacity-60 hover:opacity-80',
        reorderMode && 'ring-2 ring-border',
        isDragging && 'shadow-2xl ring-primary/40',
        !selectionMode && !reorderMode && 'hover:shadow-md'
      )}
      onClick={() => selectionMode && onToggleVisibility(post.id, !post.isVisible)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={post.imageUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />

        {post.pinned && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white rounded-md px-1.5 py-1 flex items-center gap-1">
            <Pin className="w-3 h-3 fill-white" />
            <span className="text-xs leading-none">Fixado</span>
          </div>
        )}

        {reorderMode && (
          <div
            {...dragHandleProps}
            className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white rounded-md p-1.5 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {selectionMode && (
          <div
            className={clsx(
              'absolute inset-0 flex items-center justify-center transition-all duration-200',
              post.isVisible ? 'bg-transparent hover:bg-primary/10' : 'bg-black/50'
            )}
          >
            {post.isVisible ? (
              <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-1 shadow-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white">
                <EyeOff className="w-8 h-8 drop-shadow-lg" />
                <span className="text-xs bg-black/60 px-2 py-1 rounded-full">Oculto</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        {!selectionMode && !reorderMode && (
          <span className={clsx(
            'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
            post.isVisible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            {post.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {post.isVisible ? 'Visível' : 'Oculto'}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{formatDate(post.timestamp)}</span>
      </div>
    </div>
  );
}
