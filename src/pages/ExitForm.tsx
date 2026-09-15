import { useState } from 'react';
import { ArrowLeft, Save, X, Calendar, Tag, DollarSign, FileText, Lock, User, Phone, CheckCircle2 } from 'lucide-react';
import type { Config } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { todayISO, formatFC } from '@/utils/format';
import { generateRecuSortie } from '@/services/pdf';

interface ExitFormProps {
  config: Config;
  onBack: () => void;
}

export function ExitForm({ config, onBack }: ExitFormProps) {
  const { addSortie } = useFinance();
  const [date, setDate] = useState(todayISO());
  const [nature, setNature] = useState('');
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [nomOperateur, setNomOperateur] = useState('');
  const [telOperateur, setTelOperateur] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== config.mdp_sortie) {
      setError('Mot de passe de confirmation incorrect');
      return;
    }
    const montantNum = parseInt(montant, 10);
    if (!montantNum || montantNum <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }
    if (!nature.trim() || !nomOperateur.trim() || !telOperateur.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const result = await addSortie({
      date,
      nature: nature.trim(),
      montant: montantNum,
      description: description || null,
      nom_operateur: nomOperateur.trim(),
      telephone_operateur: telOperateur.trim(),
    });
    if (result) {
      generateRecuSortie(config, result);
      setSuccess(true);
      setTimeout(() => onBack(), 1800);
    } else {
      setError('Erreur lors de l\'enregistrement');
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center animate-[fadeIn_0.3s_ease]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Sortie enregistrée</h3>
          <p className="text-gray-500 mt-1">Le reçu PDF a été téléchargé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Enregistrer une Sortie</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 text-red-600" /> Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 text-red-600" /> Nature du décaissement
          </label>
          <input
            type="text"
            value={nature}
            onChange={(e) => setNature(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            placeholder="Ex: Achat de matériel, paiement facture..."
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 text-red-600" /> Montant (FC)
          </label>
          <input
            type="number"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-lg font-semibold"
          />
          {montant && parseInt(montant, 10) > 0 && (
            <p className="text-sm text-red-600 mt-1 font-medium">{formatFC(parseInt(montant, 10))}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 text-red-600" /> Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
            placeholder="Raison du décaissement..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-red-600" /> Nom de l'opérateur
            </label>
            <input
              type="text"
              value={nomOperateur}
              onChange={(e) => setNomOperateur(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              placeholder="Nom complet"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 text-red-600" /> Téléphone
            </label>
            <input
              type="tel"
              value={telOperateur}
              onChange={(e) => setTelOperateur(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              placeholder="+243 ..."
            />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Lock className="w-4 h-4 text-red-600" /> Mot de passe de confirmation
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            placeholder="Confirmez avec le mot de passe de sortie"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" /> Enregistrer
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" /> Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
