import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import type { Category } from './types/menu';
import { formatCents, isValidPhone, MAX_ITEM_QUANTITY, priceToCents } from './orderHelpers';

const thumbs: Record<string, string> = {
  'Chili oil-splashed noodles': 'chili-oil-noodles.webp',
  'Cumin lamb roujiamo': 'cumin-lamb-roujiamo.webp',
  "Xi'an lamb bread soup": 'lamb-bread-soup.webp',
  'Soup dumplings, 6': 'soup-dumplings.webp',
};
const ADDRESS = '5071 Rochester Rd, Troy, MI 48085';
const DEMO_ORDERS_KEY = 'mca-demo-pickup-orders-v1';
type Props = { categories: Category[] };
type Step = 'dishes' | 'details' | 'review';
type Line = { key: string; name: string; chinese?: string; cents: number; from: boolean; qty: number };

const stepOrder: Step[] = ['dishes', 'details', 'review'];
const stepCopy: Record<Step, string> = { dishes: 'Choose dishes', details: 'Pickup details', review: 'Review' };

export default function QuickOrder({ categories }: Props) {
  const [active, setActive] = useState(categories[0]?.id ?? '');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [step, setStep] = useState<Step>('dishes');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const confirmationLock = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const current = categories.find(category => category.id === active) ?? categories[0];
  const base = import.meta.env.BASE_URL;

  const catalog = useMemo(() => {
    const map = new Map<string, Omit<Line, 'qty'>>();
    categories.forEach(category => category.items.forEach(item => {
      const key = item.id ?? item.name;
      try {
        map.set(key, {
          key,
          name: item.name,
          chinese: item.chinese,
          cents: priceToCents(item.price),
          from: /^from/i.test(item.price),
        });
      } catch {
        // Items with unparseable prices cannot be added to the price preview.
      }
    }));
    return map;
  }, [categories]);

  const lines = useMemo<Line[]>(() => Object.entries(qty).flatMap(([key, quantity]) => {
    const item = catalog.get(key);
    return item && quantity > 0 ? [{ ...item, qty: quantity }] : [];
  }), [catalog, qty]);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = lines.reduce((sum, line) => sum + line.cents * line.qty, 0);
  const anyFrom = lines.some(line => line.from);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  useLayoutEffect(() => {
    const tabs = tabsRef.current;
    const indicator = indicatorRef.current;
    if (!tabs || !indicator) return;
    const alignIndicator = () => {
      const selected = tabs.querySelector<HTMLButtonElement>('[aria-selected="true"]');
      if (!selected) return;
      indicator.style.width = `${selected.offsetWidth}px`;
      indicator.style.setProperty('--qo-indicator-x', `${selected.offsetLeft}px`);
      indicator.style.setProperty('--qo-indicator-y', `${selected.offsetTop}px`);
      indicator.style.setProperty('--qo-indicator-h', `${selected.offsetHeight}px`);
    };
    alignIndicator();
    window.addEventListener('resize', alignIndicator);
    return () => window.removeEventListener('resize', alignIndicator);
  }, [active, categories]);

  function change(key: string, delta: number) {
    setQty(currentQty => {
      const next = Math.max(0, Math.min(MAX_ITEM_QUANTITY, (currentQty[key] ?? 0) + delta));
      const copy = { ...currentQty };
      if (next === 0) delete copy[key];
      else copy[key] = next;
      return copy;
    });
  }

  function reviewDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = 'Enter a name for the pickup.';
    if (phoneNumber.trim() && !isValidPhone(phoneNumber)) nextErrors.phone = 'Enter a valid 10 digit phone number, or leave it blank.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.name) document.getElementById('qo-name')?.focus();
      else document.getElementById('qo-phone')?.focus();
      return;
    }
    setStep('review');
  }

  function restart() {
    confirmationLock.current = false;
    setQty({});
    setName('');
    setPhoneNumber('');
    setNotes('');
    setErrors({});
    setConfirmation(null);
    setSubmitError('');
    setStep('dishes');
  }

  function confirmDemoOrder() {
    if (confirmationLock.current || confirmation || !lines.length || !name.trim()) return;
    confirmationLock.current = true;
    setSubmitError('');
    try {
      const stored = localStorage.getItem(DEMO_ORDERS_KEY);
      const currentOrders: unknown = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(currentOrders)) throw new Error('Invalid demo order storage');
      const id = `MCA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const order = {
        id,
        name: name.trim(),
        phone: phoneNumber.trim(),
        notes: notes.trim(),
        items: lines.map(line => ({
          id: line.key,
          name: line.name,
          chinese: line.chinese ?? '',
          quantity: line.qty,
          unitCents: line.cents,
          from: line.from,
        })),
        totalCents: total,
        createdAt: new Date().toISOString(),
        status: 'New',
      };
      localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify([order, ...currentOrders].slice(0, 100)));
      const saved = JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) || '[]');
      if (!Array.isArray(saved) || !saved.some((item: { id?: string } | null) => item?.id === id)) throw new Error('Demo order was not saved');
      setConfirmation(id);
    } catch {
      confirmationLock.current = false;
      setSubmitError('This browser could not save the demo order. Check that site storage is enabled, then try again.');
    }
  }

  const linesSummary = (className = 'qo-review-lines') => (
    <ul className={className}>
      {lines.map(line => (
        <li key={line.key}>
          <span>{line.qty} × {line.name}{line.chinese && <small lang="zh">{line.chinese}</small>}</span>
          <strong>{formatCents(line.cents * line.qty)}{line.from ? '+' : ''}</strong>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="qo" id="order-here" aria-labelledby="qo-heading">
      <div className="wrap">
        <div className="qo-head">
          <div><span className="eyebrow">Pickup order preview</span><h2 id="qo-heading">A simple way to order.</h2></div>
          <p>Choose your dishes, add pickup details, and review everything—all right here.</p>
        </div>

        <ol className="qo-flow-steps" aria-label="Order steps">
          {stepOrder.map((item, index) => {
            const currentIndex = stepOrder.indexOf(step);
            const complete = index < currentIndex;
            return <li key={item} className={`${step === item ? 'current' : ''} ${complete ? 'complete' : ''}`}>
              <button type="button" disabled={index > currentIndex} aria-current={step === item ? 'step' : undefined}
                onClick={() => { if (index < currentIndex) setStep(item); }}>
                <span className="qo-step-number">{complete ? <Check size={15} aria-hidden="true" /> : index + 1}</span>
                <span>{stepCopy[item]}</span>
              </button>
            </li>;
          })}
        </ol>

        <div className="qo-flow">
          {step === 'dishes' && (
            <div key="dishes" className={`qo-flow-stage qo-layout ${count === 0 ? 'qo-layout-empty' : ''}`}>
              <div>
                <div className="qo-tabs" role="tablist" aria-label="Menu categories" ref={tabsRef}>
                  <span className="qo-tabs-indicator" aria-hidden="true" ref={indicatorRef} />
                  {categories.map(category => <button key={category.id} type="button" role="tab" id={`qo-tab-${category.id}`}
                    aria-selected={active === category.id} aria-controls="qo-panel" tabIndex={active === category.id ? 0 : -1}
                    className={active === category.id ? 'on' : ''} onClick={() => setActive(category.id)}
                    onKeyDown={event => {
                      const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
                      const index = tabs.indexOf(event.currentTarget);
                      const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
                      if (!offset || tabs.length < 2) return;
                      event.preventDefault();
                      const next = tabs[(index + offset + tabs.length) % tabs.length];
                      next.focus();
                      next.click();
                    }}
                  >{category.title}</button>)}
                </div>
                <div key={current.id} id="qo-panel" className="qo-panel-content" role="tabpanel" aria-labelledby={`qo-tab-${current.id}`}>
                  <div className="qo-cat"><h3>{current.title}</h3><span className="brush zh" aria-hidden="true">{current.character}</span></div>
                  <ul className="qo-grid">
                    {current.items.map(item => {
                      const key = item.id ?? item.name;
                      const quantity = qty[key] ?? 0;
                      const photo = thumbs[item.name];
                      return <li className={`qo-card ${item.soldOut ? 'sold' : ''} ${quantity ? 'has' : ''}`} key={key}>
                        {photo && <img src={`${base}images/${photo}`} alt="" loading="lazy" decoding="async" />}
                        <div className="qo-body">
                          <h4>{item.name}{item.spice && <span className="spice">{item.spice}</span>}{item.isNew && <span className="new-tag">New</span>}</h4>
                          {item.chinese && <span className="qo-zh zh" lang="zh">{item.chinese}</span>}
                          {item.description && <p>{item.description}</p>}
                        </div>
                        <div className="qo-buy">
                          <span className="qo-price">{item.soldOut ? 'Sold out' : item.price}</span>
                          {item.soldOut ? null : quantity === 0
                            ? <button type="button" className="qo-add" aria-label={`Add ${item.name}`} onClick={() => change(key, 1)} data-testid={`qo-add-${key}`}><Plus size={18} aria-hidden="true" /></button>
                            : <span className="qo-step"><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => change(key, -1)}><Minus size={15} aria-hidden="true" /></button><b className="qo-qty-count" key={quantity} aria-live="polite">{quantity}</b><button type="button" aria-label={`Add another ${item.name}`} onClick={() => change(key, 1)} disabled={quantity >= MAX_ITEM_QUANTITY}><Plus size={15} aria-hidden="true" /></button></span>}
                        </div>
                      </li>;
                    })}
                  </ul>
                </div>
              </div>
              {count > 0 && <aside className="qo-cart" aria-label="Your order">
                <div className="qo-cart-head"><h3>Your order <span key={count} className="qo-count-pop">{count}</span></h3>{count > 0 && <button type="button" className="qo-clear" onClick={() => setQty({})}>Clear</button>}</div>
                {linesSummary('qo-lines')}
                <div className="qo-total"><span>{anyFrom ? 'Starting subtotal' : 'Subtotal'}</span><strong>{formatCents(total)}{anyFrom ? '+' : ''}</strong></div>
                {anyFrom && <p className="qo-note">Some dishes have options that can affect the final price.</p>}
                <button type="button" className="button button-red qo-go" onClick={() => setStep('details')} data-testid="qo-order-flow">Pickup details <ArrowRight size={18} aria-hidden="true" /></button>
              </aside>}
            </div>
          )}

          {step === 'details' && (
            <div key="details" className="qo-flow-stage qo-details-layout">
              <form className="qo-stage-card" onSubmit={reviewDetails} noValidate>
                <span className="eyebrow">Step 2 of 3</span>
                <h3 className="qo-stage-title" tabIndex={-1} ref={headingRef}>Pickup details</h3>
                <p className="qo-stage-copy">Pickup at Miss Chang An · {ADDRESS}</p>
                <div className="qo-fields">
                  <div className="qo-field">
                    <label htmlFor="qo-name">Name <span>(required)</span></label>
                    <input id="qo-name" type="text" required maxLength={80} autoComplete="name" value={name} onChange={event => { setName(event.target.value); setErrors(current => ({ ...current, name: undefined })); }} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'qo-name-error' : undefined} data-testid="qo-input-name" />
                    {errors.name && <p className="qo-error" id="qo-name-error" role="alert">{errors.name}</p>}
                  </div>
                  <div className="qo-field">
                    <label htmlFor="qo-phone">Phone <span>(optional)</span></label>
                    <input id="qo-phone" type="tel" maxLength={25} autoComplete="tel" inputMode="tel" value={phoneNumber} onChange={event => { setPhoneNumber(event.target.value); setErrors(current => ({ ...current, phone: undefined })); }} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'qo-phone-error' : undefined} data-testid="qo-input-phone" />
                    {errors.phone && <p className="qo-error" id="qo-phone-error" role="alert">{errors.phone}</p>}
                  </div>
                  <div className="qo-field qo-field-wide">
                    <label htmlFor="qo-notes">Notes <span>(optional)</span></label>
                    <textarea id="qo-notes" rows={3} maxLength={300} value={notes} onChange={event => setNotes(event.target.value)} data-testid="qo-input-notes" />
                  </div>
                </div>
                <div className="qo-step-actions">
                  <button type="button" className="button button-light" onClick={() => setStep('dishes')}><ArrowLeft size={17} /> Edit dishes</button>
                  <button type="submit" className="button button-red" data-testid="qo-review-order">Review order <ArrowRight size={18} /></button>
                </div>
              </form>
              <aside className="qo-cart qo-details-summary">
                <div className="qo-cart-head"><h3>Your order</h3><button type="button" className="qo-clear" onClick={() => setStep('dishes')}>Edit</button></div>
                {linesSummary('qo-lines')}
                <div className="qo-total"><span>Subtotal{anyFrom ? ', starting at' : ''}</span><strong>{formatCents(total)}{anyFrom ? '+' : ''}</strong></div>
              </aside>
            </div>
          )}

          {step === 'review' && (
            <div key="review" className="qo-flow-stage qo-review-layout">
              <section className="qo-stage-card qo-review-card" aria-labelledby="qo-review-heading">
                <span className="eyebrow">Step 3 of 3</span>
                <h3 className="qo-stage-title" id="qo-review-heading" tabIndex={-1} ref={headingRef}>Review your pickup</h3>
                <p className="qo-stage-copy">For <strong>{name.trim()}</strong> · Pickup at Miss Chang An, {ADDRESS}</p>
                {phoneNumber && <p className="qo-stage-copy">Phone: {phoneNumber}</p>}
                {notes.trim() && <p className="qo-review-notes"><strong>Notes:</strong> {notes.trim()}</p>}
                {linesSummary()}
                <div className="qo-total"><span>{anyFrom ? 'Starting total' : 'Total'}</span><strong>{formatCents(total)}{anyFrom ? '+' : ''}</strong></div>
                <p className="qo-review-disclaimer">Demo only — confirming saves this order in this browser so it appears in the dashboard on this device. It is not sent to the restaurant.</p>
                {confirmation && <p className="qo-confirmation" role="status"><Check size={18} aria-hidden="true" /> Demo order {confirmation} saved on this site. <a href={`${base}dashboard/?order=${encodeURIComponent(confirmation)}`} target="_blank" rel="noopener noreferrer" data-testid="qo-open-dashboard">Open its dashboard →</a></p>}
                {submitError && <p className="qo-error" role="alert">{submitError}</p>}
                <div className="qo-step-actions">
                  <button type="button" className="button button-light" onClick={() => setStep('details')}><ArrowLeft size={17} /> Edit details</button>
                  <button type="button" className="button button-red" onClick={confirmDemoOrder} disabled={!!confirmation} data-testid="qo-confirm-demo-order">
                    {confirmation ? 'Demo order confirmed' : 'Confirm demo order'} {!confirmation && <Check size={18} aria-hidden="true" />}
                  </button>
                </div>
                <button type="button" className="qo-reset" onClick={restart}>Start a new order</button>
              </section>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
