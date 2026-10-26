import React from 'react';
import { Server, Monitor, Wrench } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

export type MainTabType = 'server' | 'client' | 'utilities';

interface TabsNavProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  lang: Language;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  onTabChange,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  const tabs = [
    {
      id: 'server' as MainTabType,
      label: t.tabServer,
      icon: Server,
    },
    {
      id: 'client' as MainTabType,
      label: t.tabClient,
      icon: Monitor,
    },
    {
      id: 'utilities' as MainTabType,
      label: t.tabTools,
      icon: Wrench,
    },
  ];

  return (
    <div className="w-full flex justify-center">
      {/* Centered Segmented Control */}
      <div className="inline-flex items-center shadow-xs">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          // Segment borders and border-radius rules per item
          const segmentItemClass =
            idx === 0
              ? 'border border-r-0 border-slate-300 dark:border-[#2a3f62] !rounded-l-[6px] !rounded-r-none'
              : idx === 1
                ? 'border border-slate-300 dark:border-[#2a3f62] !rounded-none'
                : 'border border-l-0 border-slate-300 dark:border-[#2a3f62] !rounded-r-[6px] !rounded-l-none';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-3 py-3 px-7 overflow-hidden transition-all cursor-pointer select-none text-xs font-semibold ${segmentItemClass} ${isActive
                ? 'bg-cyan-600 dark:bg-cyan-600 text-white font-bold z-10 shadow-xs'
                : 'bg-white dark:bg-[#131f37] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2b4c] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
              />

              <span className="tracking-wider">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
