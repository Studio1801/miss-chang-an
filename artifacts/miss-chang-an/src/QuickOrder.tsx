import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from 'lucide-react';
import type { Category } from './types/menu';
import { formatCents, isValidPhone, MAX_ITEM_QUANTITY, priceToCents } from './orderHelpers';
import './quick-order-flow.css';

const thumbs: Record<string, string> = {
  'Chili oil-splashed noodles': 'chili-oil-noodles.webp',
  'Cumin lamb roujiamo': 'cumin-lamb-roujiamo.webp',
  "Xi'an lamb bread soup": 'lamb-bread-soup.webp',
  'Soup dumplings, 6': 'soup-dumplings.webp',
};

type Props = { categories: Category[]; chowbusUrl: string; phone: string; paused?: boolean };

export default function QuickOrder({ categories, chowbusUrl, phone, paused }: Props) {
  const [active, setActive] = useState(categories[0].id);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'dishes' | 'details' | 'review' | 'done'>('dishes');
  const [name, setName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const submitted = useRef(false);
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

  function confirmOrder() {
    if (submitted.current || !lines.length || paused) return;
    setError('');
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('mca-orders') || '[]');
      if (!Array.isArray(saved)) throw new Error('Invalid saved order list');
      const id = `web-${crypto.randomUUID()}`;
      const order = {
        id, at: Date.now(), name: name.trim(), phone: pickupPhone.trim(),
        notes: notes.trim(), total, status: 'new',
        lines: lines.map(line => ({ key: line.key, name: line.name, qty: line.qty, cents: line.cents })),
      };
      localStorage.setItem('mca-orders', JSON.stringify([...saved, order].slice(-50)));
      submitted.current = true;
      setOrderId(id);
      setStep('done');
    } catch {
      setError('The demo order could not be saved. Enable site storage in this browser and try again.');
    }
  }

  function restart() {
    submitted.current = false;
    setQty({}); setName(''); setPickupPhone(''); setNotes(''); setError(''); setOrderId(''); setStep('dishes');
  }

  const summary = <ul className="qo-lines">{lines.map(line => <li key={line.key}><span>{line.qty} × {line.name}</span><strong>{formatCents(line.cents * line.qty)}{line.from ? '+' : ''}</strong></li>)}</ul>;

  return <section className="qo" id="order-here" aria-labelledby="qo-heading"><div className="wrap">
    {paused && <p className="qo-paused" role="status">Ordering is paused right now because the kitchen is busy.</p>}
    <div className="qo-head"><div><span className="eyebrow">Pickup ordering demo</span><h2 id="qo-heading">A simple way to order.</h2></div><p>Choose dishes, add pickup details, and confirm—all right here.</p></div>
    <ol className="qo-progress" aria-label="Order steps">{(['dishes', 'details', 'review'] as const).map((value, index) => <li key={value} aria-current={step === value ? 'step' : undefined}><span>{index + 1}</span>{['Choose dishes', 'Pickup details', 'Review'][index]}</li>)}</ol>
    {step === 'dishes' && <div className="qo-stage" key="dishes">
    <div className="qo-tabs" role="tablist" aria-label="Menu categories">
      {categories.map(c => <button key={c.id} type="button" role="tab" id={`qo-tab-${c.id}`} aria-selected={active === c.id} aria-controls="qo-panel" className={active === c.id ? 'on' : ''} onClick={() => setActive(c.id)} data-testid={`qo-tab-${c.id}`}>{c.title}</button>)}
    </div>
    <div className={`qo-layout${count === 0 ? ' qo-layout-empty' : ''}`}>
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
                {it.soldOut || paused ? null : n === 0
                  ? <button type="button" className="qo-add" aria-label={`Add ${it.name}`} onClick={() => change(key, 1)} data-testid={`qo-add-${key}`}><Plus size={18} aria-hidden="true" /></button>
                  : <span className="qo-step"><button type="button" aria-label={`Remove one ${it.name}`} onClick={() => change(key, -1)}><Minus size={15} aria-hidden="true" /></button><b aria-live="polite">{n}</b><button type="button" aria-label={`Add another ${it.name}`} onClick={() => change(key, 1)} disabled={n >= MAX_ITEM_QUANTITY}><Plus size={15} aria-hidden="true" /></button></span>}
              </div>
            </li>;
          })}
        </ul>
      </div>
      {count > 0 && <aside className="qo-cart" id="qo-cart" aria-label="Your order">
        <div className="qo-cart-head"><h3>Your order</h3>{count > 0 && <button type="button" className="qo-clear" onClick={() => setQty({})}>Clear</button>}</div>
        {lines.length === 0
          ? <p className="qo-empty">Nothing yet. Tap the plus on a dish to start.</p>
          : <ul className="qo-lines">{lines.map(l => <li key={l.key}><span>{l.qty} x {l.name}</span><span>{formatCents(l.cents * l.qty)}</span></li>)}</ul>}
        <div className="qo-total"><span>{anyFrom ? 'Subtotal, from' : 'Subtotal'}</span><strong>{formatCents(total)}</strong></div>
        {anyFrom && <p className="qo-note">Some dish options can affect the final price.</p>}
        <button type="button" className="button button-red qo-go" disabled={!!paused} onClick={() => setStep('details')} data-testid="qo-order-flow">Pickup details <ArrowRight size={18} aria-hidden="true" /></button>
      </aside>}
    </div>
    </div>}
    {step === 'details' && <form key="details" className="qo-stage qo-form-card" onSubmit={event => {
      event.preventDefault();
      if (!name.trim() || !isValidPhone(pickupPhone) || !lines.length) { setError('Enter a pickup name and a valid phone number, or leave the phone blank.'); return; }
      setError(''); setStep('review');
    }}>
      <h3>Pickup details</h3><p>Pickup at Miss Chang An · 5071 Rochester Rd, Troy, MI 48085</p>
      <label htmlFor="qo-name">Name (required)</label><input id="qo-name" required maxLength={80} autoComplete="name" value={name} onChange={event => setName(event.target.value)} />
      <label htmlFor="qo-phone">Phone (optional)</label><input id="qo-phone" type="tel" maxLength={25} autoComplete="tel" value={pickupPhone} onChange={event => setPickupPhone(event.target.value)} />
      <label htmlFor="qo-notes">Notes (optional)</label><textarea id="qo-notes" rows={3} maxLength={300} value={notes} onChange={event => setNotes(event.target.value)} />
      {error && <p role="alert" className="qo-save-error">{error}</p>}
      <div className="qo-actions"><button type="button" className="button button-light" onClick={() => setStep('dishes')}><ArrowLeft size={17} /> Edit dishes</button><button type="submit" className="button button-red" data-testid="qo-review-order">Review order <ArrowRight size={18} /></button></div>
    </form>}
    {step === 'review' && <div key="review" className="qo-stage qo-form-card">
      <h3>Review your pickup</h3><p>For <strong>{name.trim()}</strong> · Pickup at Miss Chang An</p>
      {pickupPhone.trim() && <p>Phone: {pickupPhone.trim()}</p>}{notes.trim() && <p>Notes: {notes.trim()}</p>}
      {summary}<div className="qo-total"><span>{anyFrom ? 'Starting total' : 'Total'}</span><strong>{formatCents(total)}{anyFrom ? '+' : ''}</strong></div>
      <p className="qo-demo-note">Demo only: confirming shows this order in the dashboard on this same browser and device. No payment is taken and the restaurant is not contacted.</p>
      {error && <p role="alert" className="qo-save-error">{error}</p>}
      <div className="qo-actions"><button type="button" className="button button-light" onClick={() => setStep('details')}><ArrowLeft size={17} /> Edit details</button><button type="button" className="button button-red" disabled={!count || !!paused} onClick={confirmOrder} data-testid="qo-confirm-demo-order">Confirm demo order <Check size={18} /></button></div>
    </div>}
    {step === 'done' && <div key="done" className="qo-stage qo-form-card" role="status">
      <span className="eyebrow">Demo order confirmed</span><h3>You're all set, {name.trim()}.</h3>
      <p>Your demo order is in the dashboard. This is a same-browser demo—not a real restaurant order.</p>
      <p className="qo-demo-note">Reference: {orderId}</p>
      <div className="qo-actions"><button type="button" className="button button-red" onClick={restart}>Start a new order</button><a className="text-link" href={`${base}dashboard/`} target="_blank" rel="noopener noreferrer">Open demo dashboard <ArrowRight size={17} /></a></div>
    </div>}
  </div></section>;
}
