import { useState } from 'react';
import { Button } from './Button';
import { X, Instagram } from 'lucide-react';

interface AddCompanyModalProps {
  onClose: () => void;
  onAdd: (username: string) => void;
}

export function AddCompanyModal({ onClose, onAdd }: AddCompanyModalProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(username.replace('@', ''));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card w-full max-w-md rounded-lg shadow-2xl overflow-hidden border border-border/50">
        <div className="bg-gradient-to-br from-[#007cb2] to-[#005a82] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white">Adicionar Empresa</h2>
            <p className="text-white/70 text-sm mt-0.5">O nome e avatar serão buscados automaticamente</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-foreground flex items-center gap-2">
              <Instagram className="w-4 h-4 text-muted-foreground" />
              Username do Instagram
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                placeholder="techsolutions"
                required
                autoFocus
                className="w-full pl-8 pr-4 py-2.5 rounded-md border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Adicionar Empresa
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
