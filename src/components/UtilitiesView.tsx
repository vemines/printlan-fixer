import React, { useState } from 'react';
import { 
  RefreshCw, 
  Trash2, 
  ShieldAlert, 
  LockKeyhole, 
  Key, 
  ShieldCheck, 
  UserCheck, 
  Wrench, 
  Cpu, 
  Layers, 
  Sliders, 
  Binary, 
  Printer, 
  Server, 
  HardDrive, 
  Cog,
  Play,
  Loader2,
  Users
} from 'lucide-react';
import { UtilityItem } from '../types/printer';
import { UTILITIES } from '../data/utilities';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { CredentialListModal } from './CredentialListModal';
import { UtilityDrawer } from './UtilityDrawer';

import { getUtilityTitle, getUtilityDesc, getUtilityActionLabel, getUtilityMeta } from '../i18n/dataTranslations';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface UtilitiesViewProps {
  onRunUtility: (util: UtilityItem) => void;
  lang: Language;
  loadingUtilId?: string | null;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({ 
  onRunUtility, 
  lang,
  loadingUtilId,
  searchQuery = '',
  onClearSearch,
}) => {
  const [showCredListModal, setShowCredListModal] = useState(false);
  const [selectedUtil, setSelectedUtil] = useState<UtilityItem | null>(null);
  const t = TRANSLATIONS[lang];

  const displayUtilities = UTILITIES;

  const filteredUtilities = React.useMemo(() => {
    if (!searchQuery.trim()) return displayUtilities;
    const q = searchQuery.toLowerCase().trim();
    return displayUtilities.filter((u) => {
      const title = getUtilityTitle(u, lang).toLowerCase();
      const desc = getUtilityDesc(u, lang).toLowerCase();
      return title.includes(q) || desc.includes(q) || u.id.toLowerCase().includes(q);
    });
  }, [displayUtilities, searchQuery, lang]);

  const getIcon = (name: string) => {
    switch (name) {
      case 'RefreshCw': return <RefreshCw className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'Trash2': return <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'LockKeyhole': return <LockKeyhole className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'Key': return <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'UserCheck': return <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'Wrench': return <Wrench className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'Layers': return <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
      case 'Sliders': return <Sliders className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />;
      case 'Binary': return <Binary className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'Printer': return <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Server': return <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'HardDrive': return <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'Cog': return <Cog className="w-4 h-4 text-slate-500" />;
      default: return <Wrench className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {filteredUtilities.length === 0 ? (
        <div className="rounded-[6px] p-10 text-center space-y-3 bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#2b3f62] shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t.noErrorsFound}
          </h3>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="px-3.5 py-1.5 rounded-[6px] text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
            >
              {t.clearSearch}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredUtilities.map((util) => {
          const isLoading = loadingUtilId === util.id;
          const isCredManager = util.id === 'util-credential-manager';
          const title = getUtilityTitle(util, lang);
          const desc = getUtilityDesc(util, lang);
          const meta = getUtilityMeta(util.id);
          const actionLabel = getUtilityActionLabel(util, lang);

          return (
            <div
              key={util.id}
              onClick={() => {
                if (isCredManager) {
                  setShowCredListModal(true);
                } else {
                  setSelectedUtil(util);
                }
              }}
              className="p-4 rounded-[6px] bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#2b3f62] flex flex-col justify-between shadow-xs hover:border-cyan-500/70 dark:hover:border-cyan-400 dark:hover:bg-[#172542] transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-[6px] bg-slate-100 dark:bg-[#0c1424] border border-slate-200 dark:border-[#20304a]">
                    {getIcon(util.iconName)}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors mb-1">
                  {title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed mb-3 whitespace-pre-line">
                  {desc}
                </p>
              </div>

              {/* Action button with loading state: Same BG Color, Different Text */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#223553]">
                {isCredManager ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCredListModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[6px] text-xs font-bold tracking-wider text-white bg-cyan-600 hover:bg-cyan-500 active:scale-98 transition-all shadow-xs cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{actionLabel}</span>
                  </button>
                ) : (
                  <button
                    disabled={isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunUtility(util);
                    }}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[6px] text-xs font-bold tracking-wider text-white transition-all shadow-xs cursor-pointer ${
                      isLoading 
                        ? 'bg-cyan-700 opacity-80 cursor-wait' 
                        : 'bg-cyan-600 hover:bg-cyan-500 active:scale-98'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.fixing}</span>
                      </>
                    ) : (
                      <>
                        {meta?.actionType === 'open' && <ExternalLink className="w-3.5 h-3.5" />}
                        <span>{actionLabel}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Tool Detail Modal (Shows steps, command scripts, copy cmd, and fix button) */}
      <UtilityDrawer
        util={selectedUtil}
        onClose={() => setSelectedUtil(null)}
        onRunUtility={onRunUtility}
        lang={lang}
        isLoading={loadingUtilId === selectedUtil?.id}
      />

      {/* Credential List Modal */}
      <CredentialListModal
        isOpen={showCredListModal}
        onClose={() => setShowCredListModal(false)}
        lang={lang}
        onAddCredential={(target, user, pass) => {
          const credUtil = UTILITIES.find(u => u.id === 'util-credential-manager');
          if (credUtil) {
            onRunUtility({
              ...credUtil,
              title: `Credential: \\\\${target}`,
              commands: {
                cmd: `cmdkey /add:${target} /user:${user} /pass:${pass || '""'}`
              }
            });
          }
        }}
      />

    </div>
  );
};
