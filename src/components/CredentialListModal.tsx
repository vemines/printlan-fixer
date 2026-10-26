import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Key, 
  Plus, 
  Wifi, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Trash2, 
  Server,
  User,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { 
  getStoredCredentials, 
  deleteStoredCredential, 
  testNetworkTarget,
  translateNetworkTargetMsg
} from '../services/tauriBridge';

interface CredentialItem {
  id: string;
  target: string;
  rawTarget?: string;
  user: string;
  type: string;
  status?: 'idle' | 'testing' | 'ok' | 'failed';
  statusMsg?: string;
}

interface CredentialListModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onAddCredential: (target: string, user: string, pass: string) => void;
}

export const CredentialListModal: React.FC<CredentialListModalProps> = ({
  isOpen,
  onClose,
  lang,
  onAddCredential,
}) => {
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loadCredentials = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getStoredCredentials();
      const mapped: CredentialItem[] = items.map((c) => ({
        id: c.id,
        target: c.target,
        rawTarget: c.raw_target,
        user: c.user,
        type: c.cred_type,
        status: 'idle',
      }));
      setCredentials(mapped);
    } catch (err) {
      console.error('Lỗi nạp credentials:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCredentials();
    }
  }, [isOpen, loadCredentials]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const t = TRANSLATIONS[lang];

  const handlePingTest = async (id: string, target: string) => {
    setCredentials(prev => prev.map(c => c.id === id ? { ...c, status: 'testing', statusMsg: undefined } : c));

    try {
      const res = await testNetworkTarget(target);
      setCredentials(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: res.success ? 'ok' : 'failed',
            statusMsg: translateNetworkTargetMsg(res.message, lang)
          };
        }
        return c;
      }));
    } catch {
      setCredentials(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'failed',
            statusMsg: t.credentialModal.connectionFailed
          };
        }
        return c;
      }));
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget.trim() || !newUser.trim()) return;

    const targetVal = newTarget.trim();
    const userVal = newUser.trim();
    const passVal = newPass.trim();

    onAddCredential(targetVal, userVal, passVal);
    setNewTarget('');
    setNewUser('');
    setNewPass('');
    setShowPassword(false);
    setShowAddForm(false);
    setTimeout(loadCredentials, 800);
  };

  const handleDelete = async (id: string, target: string, rawTarget?: string) => {
    setDeletingId(id);
    try {
      const deleteKey = rawTarget || target;
      const res = await deleteStoredCredential(deleteKey);
      const isSuccess = res.success && !res.stdout.toLowerCase().includes('element not found');
      if (isSuccess) {
        setCredentials(prev => prev.filter(c => c.id !== id));
      } else {
        console.error('Delete credential failed:', res.stderr || res.stdout);
      }
    } catch (err) {
      console.error('Delete credential error:', err);
    } finally {
      setDeletingId(null);
      await loadCredentials();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cred-modal-title"
        className="relative w-full max-w-xl bg-white dark:bg-[#111928] border border-slate-200 dark:border-[#2b3e5a] rounded-[6px] shadow-2xl p-5 z-10 space-y-4 max-h-[82vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2d42] pb-3 shrink-0">
          <div>
            <h3 id="cred-modal-title" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              {t.credModalTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              {t.credModalDesc}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadCredentials()}
              disabled={isLoading}
              title={t.credentialModal.refreshTitle}
              className="p-1.5 rounded-[6px] text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-500' : ''}`} />
            </button>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-[6px] shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addCred}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
          {credentials.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.credentialModal.emptyTitle}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t.credentialModal.emptyDesc}
              </p>
            </div>
          ) : (
            credentials.map((cred) => (
            <div
              key={cred.id}
              className="p-3 rounded-[6px] bg-slate-50 dark:bg-[#0a101b] border border-slate-200 dark:border-[#25364d] flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-[6px] bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{cred.target}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-300 bg-slate-200/60 dark:bg-[#182338] px-1.5 py-0.2 rounded-[6px] border border-transparent dark:border-[#293d5c]">{cred.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">
                    <User className="w-3 h-3" />
                    <span>User: <strong className="text-slate-700 dark:text-slate-100">{cred.user}</strong></span>
                  </div>
                  {cred.statusMsg && (
                    <div className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${
                      cred.status === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {cred.status === 'ok' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {cred.statusMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  disabled={cred.status === 'testing'}
                  onClick={() => handlePingTest(cred.id, cred.target)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-[#182338] hover:bg-slate-100 dark:hover:bg-[#202e48] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#293d5c] rounded-[6px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {cred.status === 'testing' ? (
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
                  ) : (
                    <Wifi className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  )}
                  <span>{t.pingCheck}</span>
                </button>

                <button
                  disabled={deletingId === cred.id}
                  onClick={() => handleDelete(cred.id, cred.target, cred.rawTarget)}
                  className="p-1 rounded-[6px] text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                  title={t.credentialModal.deleteTitle}
                >
                  {deletingId === cred.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1e2d42] shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {t.credentialModal.countText.replace('{count}', String(credentials.length))}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] text-xs font-semibold bg-slate-100 dark:bg-[#182338] hover:bg-slate-200 dark:hover:bg-[#202e48] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#293d5c] transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>

      {/* Modal Popup: Thêm Credential Mới (Fix BAD UX: Dialog chuyên dụng thay vì nhét ở đáy) */}
      {showAddForm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="absolute inset-0"
            onClick={() => {
              setShowPassword(false);
              setShowAddForm(false);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white dark:bg-[#111928] border border-cyan-500/30 rounded-[8px] shadow-2xl p-5 z-10 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2d42] pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 rounded-[6px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Plus className="w-4 h-4" />
                </div>
                <span>{t.credentialModal.addModalTitle}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowPassword(false);
                  setShowAddForm(false);
                }}
                className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{t.credentialModal.serverFieldLabel}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t.credentialModal.serverPlaceholder}
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-slate-50 dark:bg-[#0a101b] border border-slate-300 dark:border-[#293d5c] text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{t.credentialModal.userFieldLabel}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t.credentialModal.userPlaceholder}
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-slate-50 dark:bg-[#0a101b] border border-slate-300 dark:border-[#293d5c] text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{t.credentialModal.passFieldLabel}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.credentialModal.passPlaceholder}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3 pr-9 py-2 rounded-[6px] bg-slate-50 dark:bg-[#0a101b] border border-slate-300 dark:border-[#293d5c] text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                {t.credentialModal.note}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#1e2d42]">
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(false);
                    setShowAddForm(false);
                  }}
                  className="px-3.5 py-1.5 rounded-[6px] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer"
                >
                  {t.close}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{t.credentialModal.saveBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
