import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Menu as MenuIcon, Search, X } from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import type { Category } from './types/menu';
import OrderPage from './OrderPage';
import { RouteAccessibility } from './components/route-accessibility';
import { useStatus } from './lib/hours';
import { useReveal } from './lib/reveal';

const ORDER_URL = '/order';
const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Miss+Chang+An+5071+Rochester+Rd+Troy+MI+48085';
const CHOWBUS_URL = 'https://pos.chowbus.com/online-ordering/store/Miss-Chang-An/24125';
const PHONE = 'tel:+13138257757';
const ADDRESS = '5071 Rochester Rd, Troy, MI 48085';

const categories: Category[] = [
  { id: 'xian-specials', character: '西', title: "Xi'an specials", items: [
    { name: 'Chili oil-splashed noodles', chinese: '油泼面', spice: 'SP', price: 'From $10.99', description: 'Wide hand-made noodles, chili, garlic, hot oil.' },
    { name: 'Liangpi cold noodles', chinese: '西安面皮', spice: 'SP', price: 'From $9.89', description: 'Cold skin noodles in chili oil.' },
    { name: 'Cumin lamb roujiamo', chinese: '孜然羊肉肉夹馍', price: 'From $9.99', description: 'Wok-fried lamb with cumin in your choice of bun.' },
    { name: 'Braised pork roujiamo', chinese: '猪肉肉夹馍', price: 'From $7.99', description: 'Slow-braised pork in your choice of bun.' },
    { name: 'Spicy chicken roujiamo', chinese: '香辣鸡肉肉夹馍', spice: 'SP', price: 'From $8.99', description: 'Spiced chicken in your choice of bun.' },
    { name: "Xi'an lamb bread soup", chinese: '羊肉泡馍', price: 'From $14.99', description: 'Lamb broth, lamb, torn flatbread, sweet potato noodle, tofu skin, wood ear, lily flower.' },
  ] },
  { id: 'noodles', character: '面', title: 'Hand-made noodles', items: [
    { name: 'Beef noodle soup', chinese: '兰州牛肉面', price: 'From $13.99', description: 'Clear beef broth, beef shank, white radish, cilantro, scallion.' },
    { name: 'Braised beef noodle soup', chinese: '红烧牛肉面', spice: 'SP3', price: 'From $13.99', description: 'Rich braised beef broth, braised beef, scallion.' },
    { name: 'Spicy and sour beef noodle soup', chinese: '酸汤牛肉面', spice: 'SP5', price: 'From $13.99', description: 'Spicy, sour beef broth, beef shank, Chinese pickles, cilantro.' },
    { name: 'Chongqing noodle soup', chinese: '重庆小面', spice: 'SP2', price: 'From $13.99', description: 'Spicy beef broth, fried ground pork, soybeans, garlic, peanuts, preserved pickle, sesame.' },
    { name: 'Lamb noodle soup', chinese: '滋补羊肉烩面', price: 'From $13.99', description: 'Rich lamb broth, lamb, sweet potato noodle, tofu skin, wood ear, lily flower.' },
    { name: 'Braised chicken belt noodles', chinese: '大盘鸡裤带面', spice: 'SP3', price: 'From $13.99', description: 'Wide belt noodles, braised chicken legs, greens.' },
    { name: 'Beijing zhajiang noodles', chinese: '老北京炸酱面', price: 'From $12.99', description: 'Brown pork sauce, sesame, fried egg, carrot, cucumber.' },
    { name: 'Tomato and egg knife-shaved noodles', chinese: '西红柿鸡蛋刀削面', price: 'From $12.99', description: 'Tomato and egg broth, preserved pickle, cucumber, scallion.' },
    { name: 'Dan dan noodles', chinese: '担担面', spice: 'SP', price: 'From $12.99', description: 'Sweet and spicy sesame chili sauce, crushed peanuts optional.' },
    { name: 'Garlic noodles', chinese: '蒜香素拌面', price: '$11.99', description: 'Tossed with garlic. No meat.' },
  ] },
  { id: 'small-plates', character: '菜', title: 'Small plates', items: [
    { name: 'Garlic cucumber salad', chinese: '拍黄瓜', price: 'From $5.49', description: 'Smashed cucumber, garlic, soy, vinegar. Chili oil optional.' },
    { name: 'Black wood ear', chinese: '爽口木耳', price: '$5.99', description: 'Wood ear, cilantro, onion, spiced dressing.' },
    { name: 'Spicy wonton soup', chinese: '红油抄手', spice: 'SP', price: '$8.99', description: 'Large pork wontons, preserved pickle, scallion, cilantro.' },
    { name: 'Red chili wontons, 8', chinese: '红油抄手', spice: 'SP', price: 'From $9.99', description: 'Pork wontons in red chili oil.' },
    { name: 'Chicken egg rolls, 2', chinese: '鸡肉蛋卷', price: '$4.49', description: 'Chicken and vegetables.' },
  ] },
  { id: 'dim-sum', character: '点', title: 'Dim sum and snacks', items: [
    { name: 'Soup dumplings, 6', chinese: '手工灌汤小笼包', price: '$10.99', description: 'Hand-made pork soup dumplings. Made fresh, 10 to 15 minutes.' },
    { name: 'Crystal shrimp dumplings, 6', chinese: '水晶虾饺', price: '$7.99', description: 'Made fresh, 10 to 15 minutes.' },
    { name: 'Beef dumplings', chinese: '牛肉蒸饺', price: '$9.99', description: 'Ground beef, carrot, onion.' },
    { name: 'Jianbing', chinese: '煎饼果子', price: 'From $6.99', description: 'Chinese crepe, crispy cracker, preserved pickle, scallion, sweet sauce.' },
    { name: 'Scallion pancake', chinese: '葱油饼', price: '$6.49', description: 'Crisp, layered, green onion.' },
    { name: 'Shrimp spring rolls, 3', chinese: '虾春卷', price: '$4.99' },
    { name: 'Vegetable spring rolls, 3', chinese: '素春卷', price: '$3.99' },
    { name: 'Tea egg', chinese: '茶叶蛋', price: '$2.99', description: 'Simmered in tea and spice.' },
    { name: 'House chili oil', chinese: '辣椒油', spice: 'SP', price: '$6.99', description: 'Our own, made in the kitchen.' },
  ] },
  { id: 'drinks', character: '饮', title: 'Tea, boba and drinks', items: [
    { name: 'Hong Kong milk tea', chinese: '港式奶茶', price: 'From $4.99' },
    { name: 'Taro ube latte', chinese: '芋头奶茶', price: 'From $4.99' },
    { name: 'Wintermelon green tea', chinese: '冬瓜绿茶', price: 'From $4.99' },
    { name: 'Mango smoothie', price: 'From $5.99' },
    { name: 'Pink peach sparkling refresher', price: 'From $5.99' },
  ] },
];

const featured = [
  { name: 'Chili oil noodles', chinese: '油泼面', image: 'chili-oil-noodles.webp', description: 'Wide hand-made noodles, chili flakes and garlic, with hot oil poured over at the pass. The most ordered dish in the house.', price: 'From $10.99' },
  { name: 'Cumin lamb roujiamo', chinese: '孜然羊肉肉夹馍', image: 'cumin-lamb-roujiamo.webp', description: 'Wok-fried lamb with cumin, packed into your choice of bun. The house favourite.', price: 'From $9.99' },
  { name: 'Lamb bread soup', chinese: '羊肉泡馍', image: 'lamb-bread-soup.webp', description: 'Rich lamb broth with lamb, torn flatbread, sweet potato noodle, tofu skin, wood ear and lily flower.', price: 'From $14.99' },
  { name: 'Soup dumplings', chinese: '灌汤小笼包', image: 'soup-dumplings.webp', description: 'Six hand-made pork soup dumplings, cooked when you order. Allow 10 to 15 minutes.', price: '$10.99' },
];

const thumbs: Record<string, string> = {
  'Chili oil-splashed noodles': 'chili-oil-noodles.webp',
  'Cumin lamb roujiamo': 'cumin-lamb-roujiamo.webp',
  "Xi'an lamb bread soup": 'lamb-bread-soup.webp',
  'Soup dumplings, 6': 'soup-dumplings.webp',
};

const faqs: [string, string][] = [
  ['Are you open on Mondays?', 'No. We are closed Mondays and open 11:30 am to 9:00 pm, Tuesday to Sunday.'],
  ['How long do soup dumplings take?', 'They are made when you order, so allow 10 to 15 minutes. Crystal shrimp dumplings take the same.'],
  ['What does SP mean on the menu?', 'SP means spicy. SP2 to SP5 is the spice level out of 5. Dishes with no mark are not spicy.'],
  ['Is this the old Nook Tea & Cafe?', 'Yes, same room on Rochester Road. We kept the boba and added the noodles.'],
  ['What about allergies?', 'The kitchen uses wheat, soy, sesame, peanuts, egg and shellfish, so we cannot promise any dish is free of them. Tell us when you order.'],
  ['Can I order ahead?', 'Yes. Order pickup online on Chowbus, or call (313) 825-7757.'],
];

const legalContent = {
  privacy: [
    ['What this site collects', 'Pickup details entered into the ordering preview stay on your device and are not sent to the restaurant. This website does not take payments or use advertising or tracking cookies. Our hosting provider keeps standard server logs, such as your IP address and browser type, to keep the site running and secure.'],
    ['Fonts', 'Typefaces on this site load from Google Fonts, which receives your IP address when the page loads.'],
    ['Ordering', 'The pickup flow lets you try choosing dishes and reviewing an order. It does not submit an order or contact the kitchen. Your pickup name, phone number and notes are not saved permanently. For a real order, call (313) 825-7757.'],
    ['Links', "Links to maps, delivery apps and social media take you to other companies' sites with their own privacy policies."],
    ['Your choices', 'To ask what we hold about you from an order, or to have it removed, call us on (313) 825-7757.'],
  ],
  terms: [
    ['This website', 'This site is run by Miss Chang An, 5071 Rochester Rd, Troy, MI 48085. It tells you what we cook, when we are open and how to order. By using it you agree to these terms.'],
    ['Menu and prices', 'We keep the menu and prices here up to date, but dishes and prices can change without notice. The price charged in the shop or on our ordering page on the day is the price that applies.'],
    ['Online ordering', 'The in-house ordering flow is an interactive preview. It does not place a real order, take payment or reserve a pickup time. Starting prices are shown without extra options or charges. To place a real order, call (313) 825-7757.'],
    ['Allergies', 'Our kitchen uses wheat, soy, sesame, peanuts, egg and shellfish. We cannot promise any dish is free of these. Tell us about allergies before you order.'],
    ['Content', 'Photographs, text and the Miss Chang An name on this site belong to us. Please ask before reusing them.'],
    ['Contact', 'Questions about these terms: call (313) 825-7757 or visit us at 5071 Rochester Rd, Troy, MI 48085.'],
  ],
};

function PageMeta({ title, description }: { title: string; description: string }) {
  useLayoutEffect(() => {
    const socialDescription = `Built by Studio 1801. ${description}`;
    document.title = title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
    for (const [selector, attribute, value] of [
      ['meta[property="og:title"]', 'content', title],
      ['meta[property="og:description"]', 'content', socialDescription],
      ['meta[name="twitter:title"]', 'content', title],
      ['meta[name="twitter:description"]', 'content', socialDescription],
    ]) {
      const tag = document.querySelector<HTMLMetaElement>(selector);
      if (tag) tag.setAttribute(attribute, value);
    }
  }, [title, description]);
  return null;
}

function OpenBadge({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const status = useStatus();
  return <p className={`open-badge ${tone} ${status.open ? 'is-open' : 'is-closed'}`} role="status"><span className="open-dot" aria-hidden="true" /><strong>{status.label}</strong><span>{status.detail}</span></p>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      toggleRef.current?.focus({ preventScroll: true });
    }
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnResize() {
      if (window.matchMedia('(min-width: 701px)').matches) setOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('resize', closeOnResize);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('resize', closeOnResize);
    };
  }, [open]);
  return <header className="site-header" ref={headerRef}>
    <div className="wrap header-inner">
      <Link href="/" className="brand" data-testid="link-home-brand" aria-label="Miss Chang An home"><span className="brand-mark brush" aria-hidden="true">念</span><span>Miss Chang An</span><span className="brand-sub brush" aria-hidden="true">念长安</span></Link>
      <button ref={toggleRef} className="mobile-toggle" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(value => !value)} data-testid="button-mobile-menu">{open ? <X size={22} /> : <MenuIcon size={22} />}</button>
      <nav id="site-navigation" className={`header-nav ${open ? 'open' : ''}`} aria-label="Main navigation">
        <Link href="/menu" className={`nav-link ${location === '/menu' ? 'active' : ''}`} aria-current={location === '/menu' ? 'page' : undefined} data-testid="link-header-menu">Menu</Link>
        <Link href="/#visit" className="nav-link" data-testid="link-header-visit" onClick={() => {
          setOpen(false);
          if (location === '/') document.getElementById('visit')?.scrollIntoView();
        }}>Visit</Link>
        <Link className="nav-order" href={ORDER_URL} aria-current={location === ORDER_URL ? 'page' : undefined} data-testid="link-header-order">Order <ArrowRight size={16} aria-hidden="true" /></Link>
      </nav>
    </div>
  </header>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="wrap">
      <div className="footer-main">
        <div><p className="footer-name">Miss Chang An</p><div className="footer-info">{ADDRESS}<br /><a href={PHONE} data-testid="link-footer-phone">(313) 825-7757</a><br />Formerly Nook Tea &amp; Cafe</div></div>
        <span className="footer-symbol brush" aria-hidden="true">念</span>
      </div>
      <div className="footer-bottom"><span>Xi'an street food in Troy, Michigan</span><nav aria-label="Footer navigation"><Link href="/menu" data-testid="link-footer-menu">Menu</Link><Link href="/terms" data-testid="link-footer-terms">Terms</Link><Link href="/privacy" data-testid="link-footer-privacy">Privacy</Link></nav></div>
      <p className="footer-credit" data-testid="text-studio-credit">Built by Studio 1801</p>
    </div>
  </footer>;
}

function OrderBand() {
  return <section className="order-band" aria-labelledby="order-heading"><div className="wrap order-inner"><div><span className="eyebrow">Closed Mondays</span><h2 id="order-heading">Your food.<br />Your order.</h2><p>Build your order here, then finish it on Chowbus, or call (313) 825-7757.</p></div><div className="order-actions"><a href={CHOWBUS_URL} target="_blank" rel="noopener noreferrer" className="button button-light" data-testid="link-order-chowbus-bottom">Order on Chowbus <ArrowUpRight size={19} aria-hidden="true" /></a><Link href={ORDER_URL} className="text-link" data-testid="link-order-pickup-bottom">Build an order first</Link></div></div></section>;
}

function HoursBox() {
  const { today } = useStatus();
  const rows: [string, string, number][] = [['Mon', 'Closed', 1], ['Tue', '11:30 am to 9:00 pm', 2], ['Wed', '11:30 am to 9:00 pm', 3], ['Thu', '11:30 am to 9:00 pm', 4], ['Fri', '11:30 am to 9:00 pm', 5], ['Sat', '11:30 am to 9:00 pm', 6], ['Sun', '11:30 am to 9:00 pm', 0]];
  return <div className="hours-box"><div className="hours-head"><span className="eyebrow">Hours</span><span className="brush" aria-hidden="true">食</span></div>{rows.map(([day, hours, dow]) => <div className={`hours-row ${dow === today ? 'today' : ''}`} key={day} aria-current={dow === today ? 'date' : undefined}><span>{day}{dow === today && <em>Today</em>}</span><span>{hours}</span></div>)}</div>;
}

function Faq() {
  return <section className="faq wrap" aria-labelledby="faq-heading"><div className="faq-head"><span className="eyebrow">Before you come</span><h2 id="faq-heading">Good to know.</h2></div><div className="faq-list">{faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>;
}

function Home() {
  useReveal('home');
  return <>
    <PageMeta title="Miss Chang An 念长安 | Xi'an Noodles in Troy, MI" description="Miss Chang An is a family-owned Xi'an street food restaurant in Troy, Michigan. Hand-pulled noodles, cumin lamb roujiamo, liangpi, soup dumplings and boba. 5071 Rochester Rd. Order pickup online." />
    <section className="hero" aria-labelledby="hero-heading"><div className="wrap hero-inner">
      <div className="hero-copy"><div className="hero-kicker"><OpenBadge tone="dark" /></div><h1 id="hero-heading"><span>Miss</span><span>Chang An</span></h1><p className="hero-description">Xi'an street food on Rochester Road, Troy, Michigan. Chili oil noodles, cumin lamb roujiamo, liangpi, lamb bread soup, soup dumplings and boba. Small and family-owned, open Tuesday to Sunday.</p><div className="hero-actions"><Link href={ORDER_URL} className="button button-light" data-testid="link-hero-order">Order pickup <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/menu" className="text-link" data-testid="link-hero-menu">See the menu</Link><a href="#visit" className="text-link" data-testid="link-hero-hours">Hours and map</a></div></div>
      <div className="hero-art" aria-hidden="true"><span className="hero-character brush">念</span><span className="hero-art-note">念 长 安 · Xi'an to Troy</span></div>
    </div></section>
    <div className="ticker" aria-hidden="true"><div className="ticker-track">{Array.from({ length: 8 }, (_, i) => <span key={i}>Hand-made noodles　·　Xi'an street food　·　Troy, Michigan　·　</span>)}</div></div>
    <section className="story wrap reveal" aria-labelledby="story-heading"><div className="story-label"><span className="eyebrow">The name</span><span className="brush" aria-hidden="true">念</span></div><div><h2 id="story-heading">Missing<br /><em>Chang'an.</em></h2><p>Chang'an is the old name for Xi'an, the city at the start of the Silk Road. 念 means to miss someone, to keep a place in mind. So the menu is the food Xi'an eats on the street, made here by hand.</p><p className="aside">We used to be Nook Tea &amp; Cafe. We still make the boba.</p></div></section>
    <section className="featured" aria-labelledby="featured-heading"><div className="wrap"><div className="section-heading"><div><span className="eyebrow">At the counter</span><h2 id="featured-heading">Four to<br />start with.</h2></div><p>Prices from our ordering page</p></div><div className="featured-grid">{featured.map((item, index) => <article className="featured-item reveal" style={{ transitionDelay: `${(index % 2) * 90}ms` }} key={item.name}><div className="featured-top"><span className="featured-cn brush" aria-hidden="true">{item.chinese}</span></div><img className={`featured-image featured-image-${index + 1}`} src={`${import.meta.env.BASE_URL}images/${item.image}`} alt={item.name} loading="lazy" decoding="async" /><div><h3>{item.name}</h3><p>{item.description}</p><div className="featured-bottom"><span>{item.price}</span><ArrowUpRight size={24} aria-hidden="true" /></div></div></article>)}</div><Link href="/menu" className="featured-link" data-testid="link-featured-menu">Explore the full menu <ArrowUpRight size={17} aria-hidden="true" /></Link></div></section>
    <section className="how wrap" aria-labelledby="how-heading"><div className="how-head reveal"><span className="eyebrow">How to order</span><h2 id="how-heading">Three ways<br />in.</h2></div><div className="how-list">
      <div className="how-row reveal"><h3>Pickup</h3><p>Order ahead and walk in. Dumplings and noodles are cooked when you order, so give the kitchen a little time.</p><a href={CHOWBUS_URL} target="_blank" rel="noopener noreferrer" className="text-link dark" data-testid="link-how-pickup">Order on Chowbus <ArrowUpRight size={15} aria-hidden="true" /></a></div>
      <div className="how-row reveal"><h3>Dine in</h3><p>Order at the counter or on the screen by the door. We are open until 9:00 pm, Tuesday to Sunday.</p><a href="#visit" className="text-link dark" data-testid="link-how-dine">Hours and map</a></div>
      <div className="how-row reveal"><h3>Delivery</h3><p>Ask when you call, or check our online ordering page for what is available to your address.</p><a href={PHONE} className="text-link dark" data-testid="link-how-delivery">Call (313) 825-7757</a></div>
    </div></section>
    <section className="visit" id="visit" aria-labelledby="visit-heading"><div className="wrap visit-grid"><div><span className="eyebrow">Find us</span><h2 id="visit-heading">Come<br /><span>hungry.</span></h2><OpenBadge tone="dark" /><p className="visit-address">{ADDRESS}</p><div className="visit-links"><a href={PHONE} data-testid="link-visit-phone">(313) 825-7757 <ArrowUpRight size={16} aria-hidden="true" /></a><a href={MAP_URL} target="_blank" rel="noopener noreferrer" data-testid="link-visit-directions">Directions <ArrowUpRight size={16} aria-hidden="true" /></a></div><p className="visit-note"><strong>Dine in, pickup, delivery</strong><br />Order at the counter or on the screen by the door. Soup dumplings are made when you order.</p></div><HoursBox /></div></section>
    <Faq />
    <OrderBand />
  </>;
}

function MenuPage() {
  const [query, setQuery] = useState('');
  const [spicy, setSpicy] = useState(false);
  const [active, setActive] = useState(categories[0].id);
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => categories.map(category => ({
    ...category,
    items: category.items.filter(item => (!spicy || item.spice) && (!q || `${item.name} ${item.chinese ?? ''} ${item.description ?? ''}`.toLowerCase().includes(q))),
  })).filter(category => category.items.length > 0), [q, spicy]);
  const total = shown.reduce((sum, category) => sum + category.items.length, 0);
  useReveal(`menu-${q}-${spicy}`);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      const hit = entries.filter(entry => entry.isIntersecting).sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: '-15% 0px -70% 0px' });
    document.querySelectorAll('.menu-section').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [shown]);
  return <>
    <PageMeta title="Miss Chang An Menu" description="Full menu for Miss Chang An, Troy MI: Xi'an specials, hand-made noodle soups, roujiamo, liangpi, soup dumplings, dim sum and boba tea, with prices." />
    <section className="page-intro" aria-labelledby="menu-heading"><div className="wrap page-intro-inner"><span className="eyebrow">Miss Chang An, Troy MI</span><h1 id="menu-heading">Menu<span className="sr-only"> 菜单</span></h1><span className="intro-cn brush" aria-hidden="true">菜单</span><p>Xi'an street food, hand-made noodles, dim sum and boba at 5071 Rochester Rd, Troy. Prices as listed on our ordering page on 30 September 2026. "From" means the dish has choices, like bun type or size, that change the price.</p></div></section>
    <div className="wrap menu-tools"><label className="menu-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Search the menu</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search noodles, lamb, dumplings" data-testid="input-menu-search" /></label><button type="button" className={`chip ${spicy ? 'on' : ''}`} aria-pressed={spicy} onClick={() => setSpicy(value => !value)} data-testid="button-filter-spicy">Spicy only</button><span className="menu-count" aria-live="polite">{total} {total === 1 ? 'dish' : 'dishes'}</span></div>
    <div className="wrap menu-layout"><aside className="menu-sidebar" aria-label="Menu categories"><span className="eyebrow">Jump to</span><div>{categories.map(category => <a key={category.id} href={`#${category.id}`} className={active === category.id ? 'active' : ''} aria-current={active === category.id ? 'true' : undefined} data-testid={`link-category-${category.id}`}>{category.title}</a>)}</div></aside><div>
      {total === 0 && <div className="menu-empty"><p>Nothing matches "{query}".</p><button type="button" className="text-link dark" onClick={() => { setQuery(''); setSpicy(false); }}>Clear filters</button></div>}
      {shown.map(category => <section className="menu-section" id={category.id} key={category.id} aria-labelledby={`heading-${category.id}`}><div className="menu-section-heading"><span className="brush" aria-hidden="true">{category.character}</span><h2 id={`heading-${category.id}`}>{category.title}</h2></div>{category.items.map((item, index) => <article className="menu-item reveal" key={`${category.id}-${item.name}`} data-testid={`menu-item-${category.id}-${index}`}><div className="menu-item-body"><h3 className="menu-item-name">{item.name}{item.chinese && <span className="brush" lang="zh">{item.chinese}</span>}{item.spice && <span className="spice">{item.spice}</span>}</h3>{item.description && <p>{item.description}</p>}{thumbs[item.name] && <img className="menu-thumb" src={`${import.meta.env.BASE_URL}images/${thumbs[item.name]}`} alt={item.name} loading="lazy" decoding="async" />}</div><span className="menu-price" data-testid={`text-price-${category.id}-${index}`}>{item.price}</span></article>)}</section>)}
      <div className="menu-notice"><strong>Key</strong> SP: spicy. SP2 to SP5: spice level out of 5. Tell us about allergies when you order. The kitchen uses wheat, soy, sesame, peanuts, egg and shellfish.</div>
      <div className="menu-cta"><Link href={ORDER_URL} className="button button-red" data-testid="link-menu-order">Build a pickup order <ArrowRight size={18} aria-hidden="true" /></Link><a href={CHOWBUS_URL} target="_blank" rel="noopener noreferrer" className="text-link dark" data-testid="link-menu-chowbus">Order on Chowbus <ArrowUpRight size={15} aria-hidden="true" /></a></div>
    </div></div>
  </>;
}

function LegalPage({ type }: { type: 'privacy' | 'terms' }) {
  const privacy = type === 'privacy';
  const title = privacy ? 'Privacy policy' : 'Terms of use';
  return <>
    <PageMeta title={privacy ? 'Miss Chang An Privacy' : 'Miss Chang An Terms'} description={privacy ? 'Privacy policy for the Miss Chang An website, Troy MI.' : 'Terms of use for the Miss Chang An website, Troy MI.'} />
    <section className="page-intro legal-intro" aria-labelledby="legal-heading"><div className="wrap page-intro-inner"><span className="eyebrow">The small print</span><h1 id="legal-heading">{title}</h1><span className="intro-cn brush" aria-hidden="true">念</span><p>Last updated 2 October 2026</p></div></section>
    <div className="wrap legal-layout"><aside className="legal-side">Miss Chang An<br />Troy, Michigan</aside><div>{legalContent[type].map(([heading, body]) => <section className="legal-section" key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</div></div>
  </>;
}

function NotFound() {
  return <div className="not-found"><div><span className="eyebrow">Wrong turn</span><h1>404</h1><p>This page isn't on the menu.</p><Link href="/" className="button button-red" data-testid="link-not-found-home">Back home <ArrowRight size={18} aria-hidden="true" /></Link></div></div>;
}

function App() {
  return <><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#f7efe2] focus:p-4" data-testid="link-skip-content">Skip to content</a><Header /><main id="main-content" tabIndex={-1}><Switch><Route path="/" component={Home} /><Route path="/menu" component={MenuPage} /><Route path="/order"><PageMeta title="Order Pickup | Miss Chang An" description="Choose Miss Chang An dishes, review your basket and try our simple in-house pickup ordering flow." /><OrderPage categories={categories} /></Route><Route path="/privacy">{() => <LegalPage type="privacy" />}</Route><Route path="/terms">{() => <LegalPage type="terms" />}</Route><Route component={NotFound} /></Switch></main><Footer /><RouteAccessibility /></>;
}

export default App;