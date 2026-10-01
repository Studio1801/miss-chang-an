import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'wouter';
import type { Category } from './types/menu';
import { formatCents, isValidPhone, MAX_ITEM_QUANTITY, priceToCents } from './orderHelpers';
import './order.css';

type Stage = 'menu' | 'details' | 'review' | 'done';
type Line = { key: string; name: string; chinese?: string; cents: number; from: boolean; qty: number };

const STEPS: { id: Stage; label: string }[] = [
  { id: 'menu', label: 'Choose' },
  { id: 'details', label: 'Pickup' },
  { id: 'review', label: 'Review' },
];
const ADDRESS = '5071 Rochester Rd, Troy, MI 48085';

export default function OrderPage({ categories }: { categories: Category[] }) {
  const [stage, setStage] = useState<Stage>('menu');
  const [{ qty, announce }, setBasket] = useState<{ qty: Record<string, number>; announce: string }>({ qty: {}, announce: '' });
  const [filter, setFilter] = useState('all');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [placed, setPlaced] = useState<{ lines: Line[]; total: number; name: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const catalog = useMemo(() => {
    const map = new Map<string, Omit<Line, 'qty'>>();
    categories.forEach(c => c.items.forEach((it, i) => map.set(`${c.id}:${i}`, {
      key: `${c.id}:${i}`, name: it.name, chinese: it.chinese, cents: priceToCents(it.price), from: /^from/i.test(it.price),
    })));
    return map;
  }, [categories]);

  const lines: Line[] = useMemo(() => Object.entries(qty).filter(([, n]) => n > 0).flatMap(([k, n]) => {
    const it = catalog.get(k);
    return it ? [{ ...it, qty: n }] : [];
  }), [qty, catalog]);
  const total = lines.reduce((s, l) => s + l.cents * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const anyFrom = lines.some(l => l.from);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (first.current) { first.current = false; return; }
    headingRef.current?.focus({ preventScroll: true });
  }, [stage]);

  function change(key: string, delta: number) {
    const it = catalog.get(key);
    if (!it) return;
    setBasket(current => {
      const next = Math.max(0, Math.min(MAX_ITEM_QUANTITY, (current.qty[key] ?? 0) + delta));
      const copy = { ...current.qty };
      if (next === 0) delete copy[key]; else copy[key] = next;
      return {
        qty: copy,
        announce: next === 0 ? `${it.name} removed from basket.` : `${it.name}, quantity ${next}.`,
      };
    });
  }

  function submitDetails(e: FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    const errs: { name?: string; phone?: string } = {};
    if (!name.trim()) errs.name = 'Enter a name for the pickup.';
    if (!isValidPhone(phone)) errs.phone = 'Enter a 10 digit phone number, or leave it blank.';
    setErrors(errs);
    if (errs.name) { document.getElementById('ord-name')?.focus(); return; }
    if (errs.phone) { document.getElementById('ord-phone')?.focus(); return; }
    setStage('review');
  }

  function place() {
    if (lines.length === 0) return;
    setPlaced({ lines, total, name: name.trim() });
    setStage('done');
  }

  function restart() {
    setBasket({ qty: {}, announce: 'Basket cleared.' }); setName(''); setPhone(''); setNotes(''); setErrors({}); setPlaced(null); setFilter('all'); setStage('menu');
  }

  const visible = filter === 'all' ? categories : categories.filter(c => c.id === filter);
  const stepIndex = STEPS.findIndex(s => s.id === stage);

  const summary = (list: Line[], sum: number, label: string) => (
    <ul className="ord-lines">
      {list.map(l => (
        <li key={l.key}>
          <span>{l.qty} x {l.name}</span>
          <span>{formatCents(l.cents * l.qty)}{l.from ? '+' : ''}</span>
        </li>
      ))}
      <li className="ord-total"><span>{label}</span><span data-testid="text-order-total">{formatCents(sum)}{list.some(l => l.from) ? '+' : ''}</span></li>
    </ul>
  );

  return (
    <div className="ord">
      <section className="page-intro" aria-label="Order pickup">
        <div className="wrap page-intro-inner">
          <span className="eyebrow">Pickup at {ADDRESS}</span>
          <h1>Order<span className="sr-only"> pickup</span></h1>
          <span className="intro-cn brush" aria-hidden="true">点</span>
          <p>Pick your dishes, tell us who to look for, and review. It takes about a minute.</p>
        </div>
      </section>

      <div className="wrap ord-body">
        {stage !== 'done' && (
          <ol className="ord-steps" aria-label="Order steps">
            {STEPS.map((s, i) => (
              <li key={s.id} className={i === stepIndex ? 'on' : i < stepIndex ? 'past' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
                <span>{i + 1}</span>{s.label}
              </li>
            ))}
          </ol>
        )}
        <div className="sr-only" role="status" aria-live="polite">{announce}</div>

        {stage === 'menu' && (
          <div className="ord-grid">
            <div>
              <h2 className="ord-h" tabIndex={-1} ref={headingRef}>Choose your food</h2>
              <p className="ord-note">Prices shown are starting prices. Final options, like bun or size, are not offered here.</p>
              <div className="ord-filters" role="group" aria-label="Filter by category">
                {[{ id: 'all', title: 'All' }, ...categories].map(c => (
                  <button key={c.id} type="button" aria-pressed={filter === c.id} className={filter === c.id ? 'on' : ''} onClick={() => setFilter(c.id)} data-testid={`button-filter-${c.id}`}>{c.title}</button>
                ))}
              </div>
              {visible.map(cat => (
                <section key={cat.id} aria-labelledby={`ord-cat-${cat.id}`} className="ord-cat">
                  <h3 id={`ord-cat-${cat.id}`}><span className="brush" aria-hidden="true">{cat.character}</span>{cat.title}</h3>
                  {cat.items.map((it, i) => {
                    const key = `${cat.id}:${i}`;
                    const n = qty[key] ?? 0;
                    return (
                      <article className="ord-item" key={key}>
                        <div>
                          <h4>{it.name}{it.chinese && <span className="brush" lang="zh">{it.chinese}</span>}{it.spice && <span className="spice">{it.spice}</span>}</h4>
                          {it.description && <p>{it.description}</p>}
                          <span className="ord-price">{it.price}</span>
                        </div>
                        {n === 0 ? (
                          <button type="button" className="ord-add" onClick={() => change(key, 1)} aria-label={`Add ${it.name}`} data-testid={`button-add-${cat.id}-${i}`}>Add</button>
                        ) : (
                          <div className="ord-qty" role="group" aria-label={`${it.name} quantity`}>
                            <button type="button" onClick={() => change(key, -1)} aria-label={`Remove one ${it.name}`} data-testid={`button-decrease-${cat.id}-${i}`}>-</button>
                            <span data-testid={`text-qty-${cat.id}-${i}`} aria-label={`${n} in basket`}>{n}</span>
                            <button type="button" onClick={() => change(key, 1)} disabled={n >= MAX_ITEM_QUANTITY} aria-label={n >= MAX_ITEM_QUANTITY ? `Maximum ${MAX_ITEM_QUANTITY} ${it.name} per order` : `Add one more ${it.name}`} data-testid={`button-increase-${cat.id}-${i}`}>+</button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>
            <aside className="ord-basket" aria-label="Your basket">
              <h2>Basket <span>{count}</span></h2>
              {lines.length === 0 ? (
                <p className="ord-empty" data-testid="text-basket-empty">Nothing yet. Add a dish to begin.</p>
              ) : (
                <ul className="ord-blines">
                  {lines.map(l => (
                    <li key={l.key}>
                      <div><strong>{l.name}</strong><span>{formatCents(l.cents * l.qty)}{l.from ? '+' : ''}</span></div>
                      <div className="ord-qty small">
                        <button type="button" onClick={() => change(l.key, -1)} aria-label={`Remove one ${l.name}`} data-testid={`button-basket-decrease-${l.key.replace(':', '-')}`}>-</button>
                        <span aria-hidden="true">{l.qty}</span>
                        <button type="button" onClick={() => change(l.key, 1)} disabled={l.qty >= MAX_ITEM_QUANTITY} aria-label={l.qty >= MAX_ITEM_QUANTITY ? `Maximum ${MAX_ITEM_QUANTITY} ${l.name} per order` : `Add one more ${l.name}`} data-testid={`button-basket-increase-${l.key.replace(':', '-')}`}>+</button>
                        <button type="button" className="ord-link" onClick={() => change(l.key, -l.qty)} aria-label={`Remove ${l.name} from basket`} data-testid={`button-basket-remove-${l.key.replace(':', '-')}`}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="ord-sub"><span>{anyFrom ? 'Starting subtotal' : 'Subtotal'}</span><strong data-testid="text-subtotal">{formatCents(total)}{anyFrom ? '+' : ''}</strong></div>
              <button type="button" className="ord-primary" disabled={lines.length === 0} onClick={() => setStage('details')} data-testid="button-continue">Continue to pickup</button>
            </aside>
          </div>
        )}

        {stage === 'details' && (
          <form className="ord-panel" onSubmit={submitDetails} noValidate>
            <h2 className="ord-h" tabIndex={-1} ref={headingRef}>Pickup details</h2>
            <p className="ord-note">Pickup at {ADDRESS}.</p>
            <div className="ord-field">
              <label htmlFor="ord-name">Name for the order (required)</label>
              <input id="ord-name" type="text" required maxLength={80} autoComplete="name" value={name} onChange={e => { setName(e.target.value); setErrors(current => ({ ...current, name: undefined })); }} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'ord-name-err' : undefined} data-testid="input-name" />
              {errors.name && <p className="ord-err" id="ord-name-err" role="alert">{errors.name}</p>}
            </div>
            <div className="ord-field">
              <label htmlFor="ord-phone">Phone (optional)</label>
              <input id="ord-phone" type="tel" maxLength={25} autoComplete="tel" inputMode="tel" value={phone} onChange={e => { setPhone(e.target.value); setErrors(current => ({ ...current, phone: undefined })); }} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'ord-phone-err' : undefined} data-testid="input-phone" />
              {errors.phone && <p className="ord-err" id="ord-phone-err" role="alert">{errors.phone}</p>}
            </div>
            <div className="ord-field">
              <label htmlFor="ord-notes">Notes (optional)</label>
              <textarea id="ord-notes" rows={3} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} data-testid="input-notes" />
            </div>
            <div className="ord-actions">
              <button type="button" className="ord-secondary" onClick={() => setStage('menu')} data-testid="button-back">Back to food</button>
              <button type="submit" className="ord-primary" data-testid="button-continue">Review order</button>
            </div>
          </form>
        )}

        {stage === 'review' && (
          <div className="ord-panel">
            <h2 className="ord-h" tabIndex={-1} ref={headingRef}>Review your order</h2>
            {summary(lines, total, anyFrom ? 'Starting total' : 'Total')}
            <dl className="ord-facts">
              <div><dt>Name</dt><dd data-testid="text-review-name">{name.trim()}</dd></div>
              {phone.trim() && <div><dt>Phone</dt><dd>{phone.trim()}</dd></div>}
              {notes.trim() && <div><dt>Notes</dt><dd>{notes.trim()}</dd></div>}
              <div><dt>Pickup at</dt><dd>Miss Chang An, {ADDRESS}</dd></div>
            </dl>
            <p className="ord-note ord-preview" data-testid="text-preview-note">Preview only. No payment is taken and no order is sent to the restaurant.</p>
            <div className="ord-actions">
              <button type="button" className="ord-secondary" onClick={() => setStage('details')} data-testid="button-back">Edit details</button>
              <button type="button" className="ord-secondary" onClick={() => setStage('menu')} data-testid="button-edit-basket">Edit basket</button>
              <button type="button" className="ord-primary" disabled={lines.length === 0} onClick={place} data-testid="button-submit">Confirm order</button>
            </div>
          </div>
        )}

        {stage === 'done' && placed && (
          <div className="ord-panel ord-done">
            <span className="brush ord-seal" aria-hidden="true">念</span>
            <h2 className="ord-h" tabIndex={-1} ref={headingRef} data-testid="text-confirmation">Your order preview is ready</h2>
            <p className="ord-note">For {placed.name}, pickup at Miss Chang An, {ADDRESS}.</p>
            {summary(placed.lines, placed.total, placed.lines.some(l => l.from) ? 'Starting total' : 'Total')}
            <div className="ord-actions">
              <button type="button" className="ord-primary" onClick={restart} data-testid="button-start-over">Start over</button>
              <Link href="/menu" className="ord-secondary ord-linkbtn" data-testid="link-order-menu">Back to menu</Link>
            </div>
          </div>
        )}
      </div>
      {stage === 'menu' && count > 0 && (
        <div className="ord-mobile-next">
          <button type="button" className="ord-primary" onClick={() => setStage('details')} data-testid="button-mobile-continue">
            Continue to pickup <span>{count} {count === 1 ? 'item' : 'items'} · {formatCents(total)}{anyFrom ? '+' : ''}</span>
          </button>
        </div>
      )}
    </div>
  );
}
