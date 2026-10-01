import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Menu as MenuIcon, X } from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import type { Category } from './types/menu';
import OrderPage from './OrderPage';
import { RouteAccessibility } from './components/route-accessibility';

const ORDER_URL = '/order';
const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Miss+Chang+An+5071+Rochester+Rd+Troy+MI+48085';
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
  return <section className="order-band" aria-labelledby="order-heading"><div className="wrap order-inner"><div><span className="eyebrow">Closed Mondays</span><h2 id="order-heading">Your food.<br />Your order.</h2><p>Choose your dishes, check your basket, then add your pickup details.</p></div><Link href={ORDER_URL} className="button button-light" data-testid="link-order-pickup-bottom">Order pickup <ArrowRight size={19} aria-hidden="true" /></Link></div></section>;
}

function Home() {
  return <>
    <PageMeta title="Miss Chang An 念长安 | Xi'an Noodles in Troy, MI" description="Miss Chang An is a family-owned Xi'an street food restaurant in Troy, Michigan. Hand-pulled noodles, cumin lamb roujiamo, liangpi, soup dumplings and boba. 5071 Rochester Rd. Order pickup online." />
    <section className="hero" aria-labelledby="hero-heading"><div className="wrap hero-inner">
      <div className="hero-copy"><div className="hero-kicker eyebrow">Hand Pulled Noodles</div><h1 id="hero-heading"><span>Miss</span><span>Chang An</span></h1><p className="hero-description">Xi'an street food on Rochester Road, Troy, Michigan. Chili oil noodles, cumin lamb roujiamo, liangpi, lamb bread soup, soup dumplings and boba. Small and family-owned, open Tuesday to Sunday.</p><div className="hero-actions"><Link href={ORDER_URL} className="button button-light" data-testid="link-hero-order">Order pickup <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/menu" className="button button-outline" data-testid="link-hero-menu">Full menu <ArrowRight size={17} aria-hidden="true" /></Link><a href="#visit" className="button button-outline" data-testid="link-hero-hours">Hours <ArrowDownRight size={17} aria-hidden="true" /></a></div></div>
      <div className="hero-art" aria-hidden="true"><span className="hero-character brush">念</span><span className="hero-art-note">念 长 安 · Xi'an to Troy</span></div><span className="hero-index">01 / 04</span>
    </div></section>
    <div className="ticker" aria-hidden="true"><div className="ticker-track">{Array.from({ length: 8 }, (_, i) => <span key={i}>Hand-made noodles　·　Xi'an street food　·　Troy, Michigan　·　</span>)}</div></div>
    <section className="story wrap" aria-labelledby="story-heading"><div className="story-label"><span className="eyebrow">The name / 01</span><span className="brush" aria-hidden="true">念</span></div><div><h2 id="story-heading">Missing<br /><em>Chang'an.</em></h2><p>Chang'an is the old name for Xi'an, the city at the start of the Silk Road. 念 means to miss someone, to keep a place in mind. So the menu is the food Xi'an eats on the street, made here by hand.</p><p className="aside">We used to be Nook Tea &amp; Cafe. We still make the boba.</p></div></section>
    <section className="featured" aria-labelledby="featured-heading"><div className="wrap"><div className="section-heading"><div><span className="eyebrow">At the counter / 02</span><h2 id="featured-heading">Four to<br />start with.</h2></div><p>Prices from our ordering page</p></div><div className="featured-grid">{featured.map((item, index) => <article className="featured-item" key={item.name}><div className="featured-top"><span className="featured-number">0{index + 1} / 04</span><span className="featured-cn brush" aria-hidden="true">{item.chinese}</span></div><img className={`featured-image featured-image-${index + 1}`} src={`${import.meta.env.BASE_URL}images/${item.image}`} alt={item.name} loading="lazy" decoding="async" /><div><h3>{item.name}</h3><p>{item.description}</p><div className="featured-bottom"><span>{item.price}</span><ArrowUpRight size={24} aria-hidden="true" /></div></div></article>)}</div><Link href="/menu" className="featured-link" data-testid="link-featured-menu">Explore the full menu <ArrowUpRight size={17} aria-hidden="true" /></Link></div></section>
    <section className="visit" id="visit" aria-labelledby="visit-heading"><div className="wrap visit-grid"><div><span className="eyebrow">Find us / 03</span><h2 id="visit-heading">Come<br /><span>hungry.</span></h2><p className="visit-address">{ADDRESS}</p><div className="visit-links"><a href={PHONE} data-testid="link-visit-phone">(313) 825-7757 <ArrowUpRight size={16} aria-hidden="true" /></a><a href={MAP_URL} target="_blank" rel="noopener noreferrer" data-testid="link-visit-directions">Directions <ArrowUpRight size={16} aria-hidden="true" /></a></div><p className="visit-note"><strong>Dine in, pickup, delivery</strong><br />Order at the counter or on the screen by the door. Soup dumplings are made when you order.</p></div><div className="hours-box"><div className="hours-head"><span className="eyebrow">Hours</span><span className="brush" aria-hidden="true">食</span></div>{[['Mon','Closed'],['Tue','11:30 am to 9:00 pm'],['Wed','11:30 am to 9:00 pm'],['Thu','11:30 am to 9:00 pm'],['Fri','11:30 am to 9:00 pm'],['Sat','11:30 am to 9:00 pm'],['Sun','11:30 am to 9:00 pm']].map(([day, hours]) => <div className="hours-row" key={day}><span>{day}</span><span>{hours}</span></div>)}</div></div></section>
    <OrderBand />
  </>;
}

function MenuPage() {
  return <>
    <PageMeta title="Miss Chang An Menu" description="Full menu for Miss Chang An, Troy MI: Xi'an specials, hand-made noodle soups, roujiamo, liangpi, soup dumplings, dim sum and boba tea, with prices." />
    <section className="page-intro" aria-labelledby="menu-heading"><div className="wrap page-intro-inner"><span className="eyebrow">Miss Chang An / Troy, MI</span><h1 id="menu-heading">Menu<span className="sr-only"> 菜单</span></h1><span className="intro-cn brush" aria-hidden="true">菜单</span><p>Xi'an street food, hand-made noodles, dim sum and boba at 5071 Rochester Rd, Troy. Prices as listed on our ordering page on 30 September 2026. "From" means the dish has choices, like bun type or size, that change the price.</p></div></section>
    <div className="wrap menu-layout"><aside className="menu-sidebar" aria-label="Menu categories"><span className="eyebrow">Jump to</span><div>{categories.map(category => <a key={category.id} href={`#${category.id}`} data-testid={`link-category-${category.id}`}>{category.title}</a>)}</div></aside><div>
      {categories.map(category => <section className="menu-section" id={category.id} key={category.id} aria-labelledby={`heading-${category.id}`}><div className="menu-section-heading"><span className="brush" aria-hidden="true">{category.character}</span><h2 id={`heading-${category.id}`}>{category.title}</h2></div>{category.items.map((item, index) => <article className="menu-item" key={`${category.id}-${index}`} data-testid={`menu-item-${category.id}-${index}`}><div><h3 className="menu-item-name">{item.name}{item.chinese && <span className="brush" lang="zh">{item.chinese}</span>}{item.spice && <span className="spice">{item.spice}</span>}</h3>{item.description && <p>{item.description}</p>}</div><span className="menu-price" data-testid={`text-price-${category.id}-${index}`}>{item.price}</span></article>)}</section>)}
      <div className="menu-notice"><strong>Key</strong> SP: spicy. SP2 to SP5: spice level out of 5. Tell us about allergies when you order. The kitchen uses wheat, soy, sesame, peanuts, egg and shellfish.</div>
      <div style={{ marginTop: 35 }}><Link href={ORDER_URL} className="button button-red" data-testid="link-menu-order">Order pickup <ArrowRight size={18} aria-hidden="true" /></Link></div>
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