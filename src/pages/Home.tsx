import { useState } from 'react';
import { Lock, Eye, EyeOff, Church, Wallet } from 'lucide-react';
import type { Config } from '@/types';

interface HomeProps {
  config: Config | null;
  onLogin: () => void;
}

export function Home({ config, onLogin }: HomeProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config && password === config.mdp_acces) {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-500/30 mb-6 transform hover:scale-105 transition-transform duration-300">
            <Church className="w-11 h-11 text-emerald-950" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-amber-100 tracking-wide">
            {config?.nom_communaute || 'ÉGLISE GLOIRE DE DIEU'}
          </h1>
          <p className="text-emerald-300 mt-1 text-sm tracking-widest uppercase">
            {config?.paroisse || 'PAROISSE DE KYESHERO'}
          </p>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent mx-auto mt-4"></div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-emerald-100">
              <Wallet className="w-6 h-6 text-amber-400" />
              <h2 className="text-3xl font-bold tracking-tight">GESTION FINANCE</h2>
            </div>
          </div>

          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Connexion
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-emerald-200 text-sm font-medium mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    autoFocus
                    className={`w-full px-4 py-3 pr-12 bg-emerald-950/50 border rounded-xl text-white placeholder-emerald-400/50 focus:outline-none focus:ring-2 transition-all ${
                      error
                        ? 'border-red-400 focus:ring-red-400/30'
                        : 'border-white/10 focus:border-amber-400/50 focus:ring-amber-400/20'
                    }`}
                    placeholder="Entrez le mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-amber-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {error && (
                  <p className="text-red-300 text-sm mt-2 animate-[fadeIn_0.2s_ease]">
                    Mot de passe incorrect
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Se connecter
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-emerald-400/50 text-xs mt-8">
          Système de gestion financière — Franc Congolais (FC)
        </p>
      </div>
    </div>
  );
}
