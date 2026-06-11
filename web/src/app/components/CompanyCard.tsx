import { clsx } from "clsx";
import { ChevronRight, Eye, Instagram, RefreshCw, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Company } from "../types";

interface CompanyCardProps {
  company: Company;
  onSync: (id: string) => void;
  onDelete: (id: string) => void;
  isSyncing?: boolean;
}

export function CompanyCard({
  company,
  onSync,
  onDelete,
  isSyncing,
}: CompanyCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const visibleRatio =
    company.postsCount > 0
      ? (company.visiblePostsCount / company.postsCount) * 100
      : 0;

  return (
    <div className="bg-card rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50">
      <div className="relative h-20 bg-gradient-to-br from-[#007cb2] to-[#005a82]">
        <div className="absolute inset-0 opacity-10">
          <Instagram className="absolute -right-4 -top-4 w-28 h-28 text-white" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-0 flex items-end">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border-4 border-white shadow-lg translate-y-6 bg-muted">
            <img
              src={company.avatar}
              alt={company.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=007cb2&color=fff&size=128`;
              }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 pt-9 pb-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-foreground">{company.name}</h3>
            <p className="text-muted-foreground text-sm mt-0.5">
              {company.username}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-3 shrink-0">
            <button
              onClick={() => onSync(company.id)}
              disabled={isSyncing}
              className={clsx(
                "p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all",
                "disabled:opacity-40 disabled:pointer-events-none",
              )}
              title="Sincronizar"
            >
              <RefreshCw
                className={clsx("w-4 h-4", isSyncing && "animate-spin")}
              />
            </button>
            <button
              onClick={() => onDelete(company.id)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-muted/60 rounded-md px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Posts totais</p>
            <p className="text-foreground mt-0.5 tabular-nums">
              {company.postsCount}
            </p>
          </div>
          <div
            className="rounded-md px-3 py-2.5"
            style={{ background: "rgba(0,124,178,0.08)" }}
          >
            <p className="text-xs" style={{ color: "rgba(0,124,178,0.7)" }}>
              Visíveis
            </p>
            <p className="mt-0.5 tabular-nums text-primary">
              {company.visiblePostsCount}
              <span
                className="text-xs ml-1"
                style={{ color: "rgba(0,124,178,0.5)" }}
              >
                / {company.postsCount}
              </span>
            </p>
          </div>
        </div>

        {company.postsCount > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${visibleRatio}%` }}
              />
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Sincronizado em {formatDate(company.lastSync)}
        </p>

        <Link to={`/company/${company.id}`} className="block mt-4">
          <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-[#006a9a] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.97]">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>Ver Posts</span>
            </span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
