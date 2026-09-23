import { Building2, Landmark, Users, Hammer, Wallet, Flag } from 'lucide-react';
import { useKPIs } from '../hooks/useStore';
import { formatCurrency } from '../data/municipios';
export function KPICards() {
  const k = useKPIs();
  const cards = [
    { label: 'Municípios', value: k.total.toLocaleString('pt-BR'), note: 'no recorte selecionado', icon: Building2, tone: 'blue' },
    { label: 'Orleans Brandão', value: k.orleans, note: `${k.total ? Math.round(k.orleans / k.total * 100) : 0}% dos municípios selecionados`, icon: Landmark, tone: 'blue' },
    { label: 'Braide', value: k.braide, note: 'municípios no recorte', icon: Flag, tone: 'orange' },
    { label: 'Obras registradas', value: k.totalObras.toLocaleString('pt-BR'), note: 'no recorte selecionado', icon: Hammer, tone: 'green' },
    { label: 'Lideranças', value: k.totalLiderancas.toLocaleString('pt-BR'), note: 'cadastradas no recorte', icon: Users, tone: 'purple' },
    { label: 'Investimento informado', value: formatCurrency(k.totalInvestimento), note: 'soma dos valores disponíveis', icon: Wallet, tone: 'blue' },
  ];
  return <section className="kpi-grid" aria-label="Indicadores do recorte selecionado">
    {cards.map(({ label, value, note, icon: Icon, tone }) => <article className={`kpi-card tone-${tone}`} key={label}><div className="kpi-label"><Icon size={18} aria-hidden="true" />{label}</div><strong className="kpi-value">{value}</strong><span className="kpi-note">{note}</span></article>)}
  </section>;
}
