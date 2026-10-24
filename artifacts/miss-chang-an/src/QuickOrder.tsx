import { useMemo, useState } from 'react';
import { ArrowRight, Minus, Phone, Plus } from 'lucide-react';
import type { Category } from './types/menu';
import { formatCents, MAX_ITEM_QUANTITY, priceToCents } from './orderHelpers';

const thumbs: Record<string, string> = {
  'Chili oil-splashed noodles': 'chili-oil-noodles.webp',
  'Cumin lamb roujiamo': 'cumin-lamb-roujiamo.webp',
  "Xi'an lamb bread soup": 'lamb-bread-soup.webp',
  'Soup dumplings, 6': 'soup-dumplings.webp',
};

type Props = { categories: Category[]; chowbusUrl: string; phone: string };

export default function QuickOrder({ categories, chowbusUrl, phone }: Props) {
  const [active, setActive] = useState(categories[0].id);
  const [qty, setQty] = useState<Record<string, number>>({});
  const current = categories.find(c => c.id === active) ?? categories[0];

  const catalog = useMemo(() => {
    const map = new Map<string, { name: string; cents: number; from: boolean }>();
    categories.forEach(c => c.items.forEach(it => {
      try { map.set(it.id ?? it.name, { name: it.name, cents: priceToCents(it.price), from: /^from/i.test(it.price) }); } catch { /* skip unparseable price */ }
    }));
    return map;
  }, [categories]);

  const lines = Object.entries(qty).flatMap(([k, n]) => { const it = catalog.get(k); return it && n > 0 ? [{ key: k, ...it, qty: n }] : []; });
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.cents * l.qty, 0);
  const anyFrom = lines.some(l => l.from);

  function change(key: string, delta: number) {
    setQty(q => {
      const next = Math.max(0, Math.min(MAX_ITEM_QUANTITY, (q[key] ?? 0) + delta));
      const copy = { ...q };
      if (next === 0) delete copy[key]; else copy[key] = next;
      return copy;
    });
  }

  const base = import.meta.env.BASE_URL;

  return <section className="qo" id="order-here" aria-labelledby="qo-heading"><div className="wrap">
    <div className="qo-head reveal"><div><span className="eyebrow">Order here</span><h2 id="qo-heading">Build your order.</h2></div><p>Pick what you want, then finish on Chowbus or call the kitchen. Prices are starting prices.</p></div>
    <div className="qo-tabs" role="tablist" aria-label="Menu categories">
      {categories.map(c => <button key={c.id} type="button" role="tab" id={`qo-tab-${c.id}`} aria-selected={active === c.id} aria-controls="qo-panel" className={active === c.id ? 'on' : ''} onClick={() => setActive(c.id)} data-testid={`qo-tab-${c.id}`}>{c.title}</button>)}
    </div>
    <div className="qo-layout">
      <div id="qo-panel" role="tabpanel" aria-labelledby={`qo-tab-${current.id}`}>
        <div className="qo-cat"><h3>{current.title}</h3><span className="brush zh" aria-hidden="true">{current.character}</span></div>
        <ul className="qo-grid">
          {current.items.map(it => {
            const key = it.id ?? it.name;
            const n = qty[key] ?? 0;
            const photo = thumbs[it.name];
            return <li className={`qo-card ${it.soldOut ? 'sold' : ''} ${n ? 'has' : ''}`} key={key}>
              {photo && <img src={`${base}images/${photo}`} alt="" loading="lazy" decoding="async" />}
              <div className="qo-body">
                <h4>{it.name}{it.spice && <span className="spice">{it.spice}</span>}{it.isNew && <span className="new-tag">New</span>}</h4>
                {it.chinese && <span className="qo-zh zh" lang="zh">{it.chinese}</span>}
                {it.description && <p>{it.description}</p>}
              </div>
              <div className="qo-buy">
                <span className="qo-price">{it.soldOut ? 'Sold out' : it.price}</span>
                {it.soldOut ? null : n === 0
                  ? <button type="button" className="qo-add" aria-label={`Add ${it.name}`} onClick={() => change(key, 1)} data-testid={`qo-add-${key}`}><Plus size={18} aria-hidden="true" /></button>
                  : <span className="qo-step"><button type="button" aria-label={`Remove one ${it.name}`} onClick={() => change(key, -1)}><Minus size={15} aria-hidden="true" /></button><b aria-live="polite">{n}</b><button type="button" aria-label={`Add another ${it.name}`} onClick={() => change(key, 1)}><Plus size={15} aria-hidden="true" /></button></span>}
              </div>
            </li>;
          })}
        </ul>
      </div>
      <aside className="qo-cart" id="qo-cart" aria-label="Your order">
        <div className="qo-cart-head"><h3>Your order</h3>{count > 0 && <button type="button" className="qo-clear" onClick={() => setQty({})}>Clear</button>}</div>
        {lines.length === 0
          ? <p className="qo-empty">Nothing yet. Tap the plus on a dish to start.</p>
          : <ul className="qo-lines">{lines.map(l => <li key={l.key}><span>{l.qty} x {l.name}</span><span>{formatCents(l.cents * l.qty)}</span></li>)}</ul>}
        <div className="qo-total"><span>{anyFrom ? 'Subtotal, from' : 'Subtotal'}</span><strong>{formatCents(total)}</strong></div>
        {anyFrom && <p className="qo-note">Bun type, size and extras are picked on Chowbus and can change the price.</p>}
        <a className={`button button-red qo-go ${count === 0 ? 'off' : ''}`} href={chowbusUrl} target="_blank" rel="noopener noreferrer" aria-disabled={count === 0} data-testid="qo-chowbus">Finish on Chowbus <ArrowRight size={18} aria-hidden="true" /></a>
        <a className="qo-call" href={phone}><Phone size={16} aria-hidden="true" /> Or call (313) 825-7757</a>
        <p className="qo-fine">This builder is a preview. Your picks are not sent to the kitchen until you finish on Chowbus or call.</p>
      </aside>
    </div>
    {count > 0 && <a className="qo-bar" href="#qo-cart" data-testid="qo-bar"><span><b>{count}</b> {count === 1 ? 'item' : 'items'}</span><span>{formatCents(total)} <ArrowRight size={16} aria-hidden="true" /></span></a>}
  </div></section>;
}
