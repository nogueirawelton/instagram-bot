import { Building2, Eye, Instagram, Plus, RefreshCw, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddCompanyModal } from "../components/AddCompanyModal";
import { CompanyCard } from "../components/CompanyCard";
import { api } from "../services/api";
import { Company } from "../types";

export function HomePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await api.getAllCompanies();
      setCompanies(data);
    } catch {
      toast.error("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCompany = async (id: string) => {
    setSyncing(id);
    const toastId = toast.loading("Sincronizando perfil…");
    try {
      await api.syncCompany(id);
      toast.success("Empresa sincronizada com sucesso", { id: toastId });
      await loadCompanies();
    } catch {
      toast.error("Erro ao sincronizar empresa", { id: toastId });
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await api.syncAllCompanies();
      toast.warning("Sync iniciado em background — atualize a lista em alguns instantes");
    } catch {
      toast.error("Erro ao iniciar sync");
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover esta empresa?")) {
      try {
        await api.removeCompany(id);
        toast.success("Empresa removida com sucesso");
        await loadCompanies();
      } catch {
        toast.error("Erro ao remover empresa");
      }
    }
  };

  const handleAddCompany = async (username: string) => {
    const toastId = toast.loading("Buscando dados do perfil…");
    try {
      await api.addCompany(username);
      toast.success("Empresa adicionada com sucesso", { id: toastId });
      await loadCompanies();
    } catch {
      toast.error("Erro ao adicionar empresa", { id: toastId });
    }
  };

  const totalPosts = companies.reduce((sum, c) => sum + c.postsCount, 0);
  const totalVisible = companies.reduce((sum, c) => sum + c.visiblePostsCount, 0);

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
          <p className="text-muted-foreground text-sm">Carregando empresas…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#007cb2] via-[#0090cc] to-[#005a82] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-white/20 backdrop-blur flex items-center justify-center">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white">Internit Instagram Manager</h1>
                <p className="text-white/60 text-sm">
                  Gerencie os posts das empresas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncAll}
                disabled={syncingAll}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/15 hover:bg-white/25 text-white text-sm transition-all disabled:opacity-50 disabled:pointer-events-none border border-white/20"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncingAll ? "animate-spin" : ""}`}
                />
                Sincronizar Todas
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#c32e4e] hover:bg-[#a82541] text-white text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.97] border border-white/10"
              >
                <Plus className="w-4 h-4" />
                Nova Empresa
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {companies.length > 0 && (
          <div className="border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-8">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Building2 className="w-4 h-4" />
                <span>
                  <span className="text-white font-semibold">
                    {companies.length}
                  </span>{" "}
                  {companies.length === 1 ? "empresa" : "empresas"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Zap className="w-4 h-4" />
                <span>
                  <span className="text-white font-semibold">{totalPosts}</span>{" "}
                  posts totais
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Eye className="w-4 h-4" />
                <span>
                  <span className="text-white font-semibold">
                    {totalVisible}
                  </span>{" "}
                  visíveis
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Instagram className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-foreground mb-2">Nenhuma empresa cadastrada</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-xs">
              Adicione sua primeira empresa para começar a gerenciar os posts do
              Instagram.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-[#006a9a] transition-all shadow-md hover:shadow-lg active:scale-[0.97]"
            >
              <Plus className="w-5 h-5" />
              Adicionar Primeira Empresa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onSync={handleSyncCompany}
                onDelete={handleDeleteCompany}
                isSyncing={syncing === company.id}
              />
            ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCompany}
        />
      )}
    </div>
  );
}
