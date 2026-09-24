'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, BarChart3, CalendarDays, CarFront, ChevronRight, Check, Eye, Fuel, Gauge, Home, Image as ImageIcon, Inbox, KeyRound, LayoutDashboard, LogOut, Mail, MapPin, MessageSquareText, Phone, Plus, RotateCcw, Save, Search, Settings2, ShieldCheck, Sparkles, Star, Trash2, TrendingUp, Upload, User as UserIcon, Users, Video, Wallet, X } from 'lucide-react';
import { api, Car, Enquiry, Feedback, HeroMedia, User, money } from '@/lib/api';
import FeaturePicker from '@/components/FeaturePicker';
import VehicleFields from '@/components/VehicleFields';

type Tab = 'dashboard' | 'cars' | 'enquiries' | 'appearance' | 'users' | 'feedback' | 'reports';
type ReportPeriod = 'week' | 'month' | 'year' | 'all' | 'custom';
type Money = { carsSold: number; revenue: number; averagePrice: number };
type Report = {
  range: { from: string; to: string; period: string; salesperson: string; chartYear: number };
  selected: Money;
  quick: { week: Money; month: Money; year: Money; allTime: Money };
  inventory: { activeCars: number; totalCars: number; soldCars: number };
  monthly: { month: number; label: string; carsSold: number; revenue: number }[];
  bySalesperson: { email: string; name: string; carsSold: number; revenue: number; averagePrice: number; lastSale?: string }[];
  people: { email: string; name: string }[];
  buyers: { carId: string; car: string; slug: string; buyerName: string; buyerPhone: string; buyerEmail: string; soldPrice: number; soldAt?: string; salespersonName: string; salespersonEmail: string }[];
};
type UserForm = { firstName: string; lastName: string; email: string; password: string; phone: string; address: string; role: 'admin' | 'superadmin' };
type FeedbackForm = { name: string; message: string; rating: number; image: { url: string; publicId: string }; published: boolean };
const emptyFeedback = (): FeedbackForm => ({ name: '', message: '', rating: 5, image: { url: '', publicId: '' }, published: true });
const emptyUser = (): UserForm => ({ firstName: '', lastName: '', email: '', password: '', phone: '', address: '', role: 'admin' });
type CarForm = Omit<Car, '_id'>;
type SaleForm = NonNullable<Car['sale']>;
type SortKey = 'car' | 'price' | 'location' | 'views' | 'status' | 'postedBy' | 'createdAt';
type SortDir = 'asc' | 'desc';
const emptyCar = (): CarForm => ({ brand: '', model: '', year: new Date().getFullYear(), price: 0, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 0, bodyType: '', location: '', description: '', features: [], images: [], status: 'active', postedBy: { name: 'KangaCars Admin', email: '', phone: '' } });
const emptySale = (price: number): SaleForm => ({ soldPrice: price, soldAt: new Date().toISOString().slice(0, 10), buyerName: '', buyerEmail: '', buyerPhone: '', salespersonName: '', salespersonEmail: '' });
const fullName = (person?: User | null) => person ? `${person.firstName} ${person.lastName}`.trim() : '';
const formatBytes = (bytes?: number) => !bytes ? '' : bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const formatDuration = (seconds?: number) => !seconds ? '' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminWorkspace({ superadmin = false }: { superadmin?: boolean }) {
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [cars, setCars] = useState<Car[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Car | null>(null);
  const [form, setForm] = useState<CarForm>(emptyCar);
  const [selling, setSelling] = useState<Car | null>(null);
  const [saleForm, setSaleForm] = useState<SaleForm>(() => emptySale(0));
  const [carSearch, setCarSearch] = useState('');
  const [carStatus, setCarStatus] = useState<'all' | Car['status']>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleting, setDeleting] = useState<Car | null>(null);
  const [viewingCar, setViewingCar] = useState<Car | null>(null);
  const [viewingPoster, setViewingPoster] = useState<Car | null>(null);
  const [heroMedia, setHeroMedia] = useState<HeroMedia[]>([]);
  const [heroBusy, setHeroBusy] = useState(false);
  const [deletingHero, setDeletingHero] = useState<HeroMedia | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyUser);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [signedInAs, setSignedInAs] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>(emptyFeedback);
  const [deletingFeedback, setDeletingFeedback] = useState<Feedback | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [salesperson, setSalesperson] = useState('');
  // Driven by the signed-in account: an admin never sees Users, a superadmin always does.
  const canManageUsers = signedInAs?.role === 'superadmin';

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(current => current === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'createdAt' || key === 'views' || key === 'price' ? 'desc' : 'asc'); }
  }

  useEffect(() => { setToken(sessionStorage.getItem('carwise-admin-token') || ''); setReady(true); }, []);
  const loadReport = useCallback(async (auth: string) => {
    if (!auth) return;
    setReportBusy(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === 'custom') {
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      }
      if (salesperson) params.set('salesperson', salesperson);
      setReport(await api<Report>(`/admin/reports?${params}`, {}, auth));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load the report.'); }
    finally { setReportBusy(false); }
  }, [period, customFrom, customTo, salesperson]);

  const load = useCallback(async (auth: string) => {
    try {
      const [carData, enquiryData, heroData, feedbackData, me] = await Promise.all([api<Car[]>('/admin/cars', {}, auth), api<Enquiry[]>('/admin/enquiries', {}, auth), api<HeroMedia[]>('/admin/hero', {}, auth), api<Feedback[]>('/admin/feedback', {}, auth), api<User>('/admin/me', {}, auth)]);
      setCars(carData); setEnquiries(enquiryData); setHeroMedia(heroData); setFeedback(feedbackData); setSignedInAs(me); setError('');
      // Only a superadmin may list users; an admin opening this page just gets no user data.
      if (me.role === 'superadmin') setUsers(await api<User[]>('/admin/users', {}, auth).catch(() => []));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to load data.';
      if (message.includes('Session expired') || message.includes('Sign in')) { sessionStorage.removeItem('carwise-admin-token'); setToken(''); }
      else setError(message);
    }
  }, []);
  useEffect(() => { if (token) load(token); }, [token, load]);
  useEffect(() => { if (!canManageUsers && tab === 'users') { setTab('dashboard'); setEditingUser(null); } }, [canManageUsers, tab]);
  useEffect(() => { if (tab === 'reports' && token) loadReport(token); }, [tab, token, loadReport]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setLoginError('');
    try { const result = await api<{ token: string }>('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }); sessionStorage.setItem('carwise-admin-token', result.token); setToken(result.token); setPassword(''); }
    catch (e) { setLoginError(e instanceof Error ? e.message : 'Sign in failed.'); }
    finally { setBusy(false); }
  }
  function logout() { sessionStorage.removeItem('carwise-admin-token'); setToken(''); setCars([]); setEnquiries([]); setHeroMedia([]); setUsers([]); setFeedback([]); setSignedInAs(null); }
  function openCar(car?: Car) { setEditing(car || ({ ...emptyCar(), _id: '' } as Car)); setForm(car ? { ...car } : emptyCar()); setError(''); setTab('cars'); }
  async function saveCar(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (form.images.length < 1 || form.images.length > 7) { setError('Add 1 to 7 photos before saving this car.'); return; }
    setBusy(true);
    try {
      await api(editing?._id ? `/admin/cars/${editing._id}` : '/admin/cars', { method: editing?._id ? 'PUT' : 'POST', body: JSON.stringify(form) }, token);
      setEditing(null); setForm(emptyCar()); await load(token); setTab('cars');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save car.'); }
    finally { setBusy(false); }
  }
  async function uploadImages(files?: FileList | null) {
    if (!files?.length) return;
    if (form.images.length + files.length > 7) { setError(`Choose up to ${7 - form.images.length} more photos.`); return; }
    setBusy(true); setError('');
    try {
      for (const file of Array.from(files)) {
        const data = new FormData(); data.append('image', file);
        const image = await api<Car['images'][number]>('/admin/upload', { method: 'POST', body: data }, token);
        setForm(current => ({ ...current, images: [...current.images, image] }));
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.'); }
    finally { setBusy(false); }
  }
  async function refreshUsers() { setUsers(await api<User[]>('/admin/users', {}, token)); }
  function openUser(person?: User) {
    setEditingUser(person || ({ _id: '' } as User));
    // Editing never pre-fills the password; leaving it blank keeps the current one.
    setUserForm(person ? { firstName: person.firstName, lastName: person.lastName, email: person.email, password: '', phone: person.phone, address: person.address || '', role: person.role } : emptyUser());
    setError('');
  }
  async function saveUser(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await api(editingUser?._id ? `/admin/users/${editingUser._id}` : '/admin/users', { method: editingUser?._id ? 'PUT' : 'POST', body: JSON.stringify(userForm) }, token);
      setEditingUser(null); setUserForm(emptyUser()); await refreshUsers();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this user.'); }
    finally { setBusy(false); }
  }
  async function confirmDeleteUser() {
    if (!deletingUser) return;
    setBusy(true); setError('');
    try { await api(`/admin/users/${deletingUser._id}`, { method: 'DELETE' }, token); setDeletingUser(null); await refreshUsers(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not delete this user.'); }
    finally { setBusy(false); }
  }
  async function refreshFeedback() { setFeedback(await api<Feedback[]>('/admin/feedback', {}, token)); }
  function openFeedback(entry?: Feedback) {
    setEditingFeedback(entry || ({ _id: '' } as Feedback));
    setFeedbackForm(entry
      ? { name: entry.name, message: entry.message, rating: entry.rating, image: { url: entry.image?.url || '', publicId: entry.image?.publicId || '' }, published: entry.published !== false }
      : emptyFeedback());
    setError('');
  }
  async function uploadFeedbackImage(files?: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const data = new FormData();
      data.append('image', file);
      // the upload route uses this to pick the Cloudinary folder
      data.append('label', 'feedback');
      const image = await api<{ url: string; publicId: string }>('/admin/upload', { method: 'POST', body: data }, token);
      setFeedbackForm(current => ({ ...current, image: { url: image.url, publicId: image.publicId } }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.'); }
    finally { setBusy(false); }
  }
  async function saveFeedback(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await api(editingFeedback?._id ? `/admin/feedback/${editingFeedback._id}` : '/admin/feedback', { method: editingFeedback?._id ? 'PUT' : 'POST', body: JSON.stringify(feedbackForm) }, token);
      setEditingFeedback(null); setFeedbackForm(emptyFeedback()); await refreshFeedback();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this feedback.'); }
    finally { setBusy(false); }
  }
  async function confirmDeleteFeedback() {
    if (!deletingFeedback) return;
    setBusy(true); setError('');
    try { await api(`/admin/feedback/${deletingFeedback._id}`, { method: 'DELETE' }, token); setDeletingFeedback(null); await refreshFeedback(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not delete this feedback.'); }
    finally { setBusy(false); }
  }
  async function refreshHero() { setHeroMedia(await api<HeroMedia[]>('/admin/hero', {}, token)); }
  async function uploadHeroMedia(files?: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setHeroBusy(true); setError('');
    try {
      const data = new FormData(); data.append('media', file);
      // A fresh upload becomes the live header straight away, so the change is visible without a second click.
      const media = await api<HeroMedia>('/admin/hero', { method: 'POST', body: data }, token);
      await api(`/admin/hero/${media._id}/activate`, { method: 'POST' }, token);
      await refreshHero();
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed. Use a JPEG, PNG or WebP image, or an MP4/WebM video under 60 MB.'); }
    finally { setHeroBusy(false); }
  }
  async function activateHero(media: HeroMedia) {
    setHeroBusy(true); setError('');
    try { await api(`/admin/hero/${media._id}/activate`, { method: 'POST' }, token); await refreshHero(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update the header.'); }
    finally { setHeroBusy(false); }
  }
  async function useDefaultHero() {
    setHeroBusy(true); setError('');
    try { await api('/admin/hero/default', { method: 'POST' }, token); await refreshHero(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not restore the default header.'); }
    finally { setHeroBusy(false); }
  }
  async function confirmDeleteHero() {
    if (!deletingHero) return;
    setHeroBusy(true); setError('');
    try { await api(`/admin/hero/${deletingHero._id}`, { method: 'DELETE' }, token); setDeletingHero(null); await refreshHero(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not delete this media.'); }
    finally { setHeroBusy(false); }
  }
  async function confirmDeleteCar() {
    if (!deleting) return;
    setBusy(true); setError('');
    try { await api(`/admin/cars/${deleting._id}`, { method: 'DELETE' }, token); setDeleting(null); await load(token); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not delete car.'); }
    finally { setBusy(false); }
  }
  function openSale(car: Car) { setSelling(car); setSaleForm(car.sale ? { ...car.sale, soldAt: car.sale.soldAt.slice(0, 10) } : emptySale(car.price)); setError(''); }
  async function saveSale(event: React.FormEvent) {
    event.preventDefault(); if (!selling) return;
    setBusy(true); setError('');
    try { await api(`/admin/cars/${selling._id}/sell`, { method: 'POST', body: JSON.stringify(saleForm) }, token); setSelling(null); await load(token); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not mark car sold.'); }
    finally { setBusy(false); }
  }
  async function updateEnquiry(id: string, status: Enquiry['status']) {
    try { await api(`/admin/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, token); await load(token); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update enquiry.'); }
  }

  if (!ready) return <div className="admin-loading">Loading...</div>;
  if (!token) return <div className="admin-login"><div className="admin-login-side"><Link href="/" className="brand"><span className="brand-logo"><img src="/kangacars-logo.png" alt="KangaCars" width={620} height={208}/></span></Link><div><span className="eyebrow"><span className="eyebrow-line"/> {superadmin ? 'SUPERADMIN WORKSPACE' : 'ADMIN WORKSPACE'}</span><h1>Manage the cars.<br/><em>Follow every lead.</em></h1><p>Your inventory and enquiries, together in one place.</p></div><small>KANGACARS / {superadmin ? 'SUPERADMIN' : 'ADMIN'}</small></div><div className="admin-login-form"><form onSubmit={login}><div className="admin-icon"><CarFront/></div><h2>Welcome back</h2><p>Sign in to your admin dashboard.</p><label>Email address<input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="admin@example.com"/></label><label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" required placeholder="Your password"/></label>{loginError && <p className="form-error">{loginError}</p>}<button disabled={busy} className="button button-primary full">{busy ? 'Signing in...' : 'Sign in'} <ArrowRight size={18}/></button><Link href="/" className="back-link"><ArrowLeft size={16}/> Back to website</Link></form></div></div>;

  const statusOrder: Record<Car['status'], number> = { active: 0, sold: 1, hidden: 2 };
  const filteredCars = cars.filter(car => (carStatus === 'all' || car.status === carStatus) && `${car.brand} ${car.model} ${car.location}`.toLowerCase().includes(carSearch.toLowerCase())).slice().sort((a, b) => {
    const direction = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'car': return direction * `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
      case 'price': return direction * (a.price - b.price);
      case 'location': return direction * a.location.localeCompare(b.location);
      case 'views': return direction * ((a.viewCount || 0) - (b.viewCount || 0));
      case 'status': return direction * (statusOrder[a.status] - statusOrder[b.status]);
      case 'postedBy': return direction * (a.postedBy?.name || '').localeCompare(b.postedBy?.name || '');
      default: return direction * (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    }
  });
  const sortIcon = (key: SortKey) => sortKey !== key ? <ArrowUpDown size={12}/> : sortDir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>;
  const newEnquiries = enquiries.filter(enquiry => enquiry.status === 'new').length;
  const activeHero = heroMedia.find(media => media.active) || null;
  const filteredUsers = users.filter(person => `${person.firstName} ${person.lastName} ${person.email} ${person.phone}`.toLowerCase().includes(userSearch.toLowerCase()));
  return <div className="admin-shell"><aside className="admin-sidebar"><Link href="/" className="brand"><span className="brand-logo"><img src="/kangacars-logo.png" alt="KangaCars" width={620} height={208}/></span></Link>{canManageUsers && <span className="sidebar-role"><ShieldCheck size={13}/> SUPERADMIN</span>}<span className="sidebar-label">WORKSPACE</span><nav><button className={tab === 'dashboard' ? 'active' : ''} onClick={() => { setTab('dashboard'); setEditing(null); }}><LayoutDashboard size={19}/> Overview</button><button className={tab === 'cars' ? 'active' : ''} onClick={() => { setTab('cars'); setEditing(null); }}><CarFront size={19}/> Cars <span>{cars.length}</span></button><button className={tab === 'enquiries' ? 'active' : ''} onClick={() => { setTab('enquiries'); setEditing(null); }}><Inbox size={19}/> Enquiries <span>{newEnquiries}</span></button><button className={tab === 'appearance' ? 'active' : ''} onClick={() => { setTab('appearance'); setEditing(null); }}><Sparkles size={19}/> Header media</button><button className={tab === 'reports' ? 'active' : ''} onClick={() => { setTab('reports'); setEditing(null); }}><BarChart3 size={19}/> Reports</button><button className={tab === 'feedback' ? 'active' : ''} onClick={() => { setTab('feedback'); setEditing(null); setEditingFeedback(null); }}><MessageSquareText size={19}/> Feedback <span>{feedback.length}</span></button>{canManageUsers && <button className={tab === 'users' ? 'active' : ''} onClick={() => { setTab('users'); setEditing(null); setEditingUser(null); }}><Users size={19}/> Users <span>{users.length}</span></button>}</nav><div className="sidebar-bottom"><Link href="/"><ArrowLeft size={17}/> View website</Link><button onClick={logout}><LogOut size={17}/> Sign out</button></div></aside>
    <main className="admin-main"><header className="admin-topbar"><span>{superadmin ? 'KANGACARS SUPERADMIN' : 'KANGACARS ADMIN'} <ChevronRight size={14}/> {editing ? (editing._id ? 'Edit car' : 'Add car') : tab === 'appearance' ? 'Header media' : tab}</span><div className="admin-topbar-right"><span className="admin-avatar">A</span><button type="button" className="admin-topbar-signout" onClick={logout} aria-label="Sign out"><LogOut size={17}/></button></div></header><div className="admin-content">
      {error && <div className="admin-alert" role="alert">{error}<button onClick={() => setError('')}><X size={16}/></button></div>}
      {tab === 'dashboard' && !editing && <><div className="admin-page-head"><div><span className="admin-kicker">YOUR WORKSPACE</span><h1>Overview<span className="accent-dot">.</span></h1><p>Keep your inventory current and every enquiry moving.</p></div><button className="button button-primary" onClick={() => openCar()}><Plus size={18}/> Add car</button></div><div className="admin-stats"><div><span>Active cars</span><strong>{cars.filter(car => car.status === 'active').length}</strong><CarFront/></div><div><span>Sold cars</span><strong>{cars.filter(car => car.status === 'sold').length}</strong><CarFront/></div><div><span>New enquiries</span><strong>{newEnquiries}</strong><Inbox/></div><div><span>Total car views</span><strong>{cars.reduce((sum, car) => sum + (car.viewCount || 0), 0).toLocaleString('en-IN')}</strong><Eye/></div></div><div className="admin-two-col"><section className="admin-panel"><div className="panel-title"><h2>Most visited cars</h2><button onClick={() => setTab('cars')}>View all <ArrowRight size={15}/></button></div>{cars.length ? [...cars].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5).map(car => <div className="mini-row" key={car._id}><span className="mini-car">{car.images?.[0]?.url ? <img src={car.images[0].url} alt=""/> : <CarFront size={20}/>}</span><div><strong>{car.brand} {car.model}</strong><small>{car.year} · {car.location}</small></div><span className="mini-views"><Eye size={13}/>{(car.viewCount || 0).toLocaleString('en-IN')}</span></div>) : <p className="panel-empty">No cars yet. Add your first listing.</p>}</section><section className="admin-panel"><div className="panel-title"><h2>Recent enquiries</h2><button onClick={() => setTab('enquiries')}>View all <ArrowRight size={15}/></button></div>{enquiries.length ? enquiries.slice(0, 5).map(enquiry => <div className="mini-row" key={enquiry._id}><span className="initial">{enquiry.name.charAt(0)}</span><div><strong>{enquiry.name}</strong><small>{enquiry.carId ? `${enquiry.carId.brand} ${enquiry.carId.model}` : 'Car removed'}</small></div><span className={`status status-${enquiry.status}`}>{enquiry.status}</span></div>) : <p className="panel-empty">No enquiries yet.</p>}</section></div></>}
      {tab === 'cars' && !editing && <><div className="admin-page-head"><div><span className="admin-kicker">INVENTORY</span><h1>Manage cars<span className="accent-dot">.</span></h1><p>Add, edit and organise your car listings.</p></div><button className="button button-primary" onClick={() => openCar()}><Plus size={18}/> Add car</button></div><div className="admin-panel"><div className="admin-toolbar"><div className="admin-search"><Search size={18}/><input placeholder="Search cars..." value={carSearch} onChange={event => setCarSearch(event.target.value)}/></div><div className="admin-status-filters">{(['all', 'active', 'sold', 'hidden'] as const).map(status => <button type="button" key={status} className={carStatus === status ? 'selected' : ''} onClick={() => setCarStatus(status)}>{status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}</button>)}</div><span>{filteredCars.length} cars</span></div><div className="table-scroll"><table className="admin-inventory-table"><thead><tr>
  <th><button type="button" className="admin-th-sort" onClick={() => toggleSort('car')}>CAR {sortIcon('car')}</button></th>
  <th><button type="button" className="admin-th-sort" onClick={() => toggleSort('price')}>PRICE {sortIcon('price')}</button></th>
  <th><button type="button" className="admin-th-sort" onClick={() => toggleSort('location')}>LOCATION {sortIcon('location')}</button></th>
  <th><button type="button" className="admin-th-sort" onClick={() => toggleSort('views')}>VIEWS {sortIcon('views')}</button></th>
  <th><button type="button" className="admin-th-sort" onClick={() => toggleSort('postedBy')}>POSTED BY {sortIcon('postedBy')}</button></th>
  <th><button type="button" className="admin-th-sort" onClick={() => toggleSort('status')}>STATUS {sortIcon('status')}</button></th>
  <th>ACTIONS</th>
</tr></thead><tbody>{filteredCars.map(car => <tr key={car._id} className="admin-clickable-row" onClick={() => setViewingCar(car)}>
  <td><div className="table-car"><div className="table-thumb">{car.images?.[0]?.url ? <img src={car.images[0].url} alt=""/> : <CarFront size={19}/>}</div><div><strong>{car.brand} {car.model}</strong><small>{car.year} · {car.fuelType} · {car.images?.length || 0} photos</small></div></div></td>
  <td><div className="table-price"><strong>{money(car.status === 'sold' && car.sale ? car.sale.soldPrice : car.price)}</strong>{car.status === 'sold' && <small>Sold price</small>}</div></td>
  <td>{car.location}</td>
  <td><div className="table-views"><strong><Eye size={13}/>{(car.viewCount || 0).toLocaleString('en-IN')}</strong>{car.lastViewedAt && <small>{new Date(car.lastViewedAt).toLocaleDateString('en-IN')}</small>}</div></td>
  <td><div className="table-poster"><button type="button" className="table-poster-name" onClick={event => { event.stopPropagation(); setViewingPoster(car); }} title="View poster contact"><UserIcon size={12}/>{car.postedBy?.name || 'KangaCars Admin'}</button><small>{formatDate(car.createdAt)}</small></div></td>
  <td><span className={`status status-${car.status}`}>{car.status}</span></td>
  <td><div className="row-actions" onClick={event => event.stopPropagation()}><button onClick={() => openCar(car)}>Edit</button><button className="sale-action" onClick={() => openSale(car)}>{car.status === 'sold' ? 'Sale details' : 'Mark sold'}</button><button onClick={() => setDeleting(car)} aria-label={`Delete ${car.brand} ${car.model}`}><Trash2 size={16}/></button></div></td>
</tr>)}</tbody></table>{!filteredCars.length && <p className="panel-empty">No cars found.</p>}</div></div></>}
      {tab === 'cars' && editing && <><div className="admin-page-head"><div><button className="back-link" onClick={() => setEditing(null)}><ArrowLeft size={17}/> Back to cars</button><h1>{editing._id ? 'Edit car' : 'Add a car'}<span className="accent-dot">.</span></h1><p>Give buyers the details they need to enquire with confidence.</p></div></div><form className="admin-car-form" onSubmit={saveCar}><section className="admin-panel"><h2>Basic details</h2><div className="admin-form-grid"><VehicleFields key={editing._id || "new"} value={{ brand: form.brand, model: form.model, bodyType: form.bodyType }} inventory={cars} onChange={vehicle => setForm(current => ({ ...current, ...vehicle }))}/><label>Year<input type="number" min="1980" max={new Date().getFullYear() + 1} required value={form.year} onChange={event => setForm({ ...form, year: Number(event.target.value) })}/></label><label>Price (₹)<input type="number" min="1" required value={form.price || ''} onChange={event => setForm({ ...form, price: Number(event.target.value) })}/></label><label>Fuel type<select value={form.fuelType} onChange={event => setForm({ ...form, fuelType: event.target.value })}>{['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'].map(value => <option key={value}>{value}</option>)}</select></label><label>Transmission<select value={form.transmission} onChange={event => setForm({ ...form, transmission: event.target.value })}><option>Manual</option><option>Automatic</option></select></label><label>Kilometres driven<input type="number" min="0" required value={form.kmDriven} onChange={event => setForm({ ...form, kmDriven: Number(event.target.value) })}/></label><label>Location<input required value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} placeholder="e.g. Chennai"/></label><label>Status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as Car['status'] })}><option value="active">Active</option>{form.status === 'sold' && <option value="sold">Sold</option>}<option value="hidden">Hidden</option></select></label></div></section><section className="admin-panel"><h2>Description &amp; features</h2><label>Description<textarea rows={5} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Describe the car, condition and highlights"/></label><FeaturePicker value={form.features || []} onChange={features => setForm(current => ({ ...current, features }))}/></section>
        <section className="admin-panel"><h2>Posted by</h2><p className="muted">Who is listing this car? Shown to buyers and in the admin table.</p><div className="admin-form-grid"><label>Name<input value={form.postedBy?.name || ''} onChange={event => setForm({ ...form, postedBy: { ...(form.postedBy || {}), name: event.target.value } })} placeholder="Your name"/></label><label>Email<input type="email" value={form.postedBy?.email || ''} onChange={event => setForm({ ...form, postedBy: { ...(form.postedBy || {}), email: event.target.value } })} placeholder="you@example.com"/></label><label>Phone<input type="tel" value={form.postedBy?.phone || ''} onChange={event => setForm({ ...form, postedBy: { ...(form.postedBy || {}), phone: event.target.value } })} placeholder="Contact number"/></label></div></section><section className="admin-panel"><h2>Photos ({form.images.length}/7)</h2><p className="muted">Add 1 to 7 JPEG, PNG or WebP photos (up to 5 MB each). Select several files at once.</p><div className="image-preview-grid">{form.images.map((image, index) => <div key={`${image.url}-${index}`} className="image-preview"><img src={image.url} alt={`Car photo ${index + 1}`}/><button type="button" aria-label="Remove image" onClick={() => setForm({ ...form, images: form.images.filter((_, current) => current !== index) })}><X size={16}/></button></div>)}{form.images.length < 7 && <label className="upload-tile"><Upload size={22}/><span>{busy ? 'Uploading...' : 'Upload image'}</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { uploadImages(event.target.files); event.target.value = ''; }}/></label>}</div></section><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" disabled={busy || form.images.length < 1}><Save size={18}/>{busy ? 'Saving...' : 'Save car'}</button></div></form></>}
      {tab === 'appearance' && !editing && <><div className="admin-page-head"><div><span className="admin-kicker">WEBSITE APPEARANCE</span><h1>Header media<span className="accent-dot">.</span></h1><p>Upload a picture or a video for the homepage header. Whatever you pick here plays behind the headline.</p></div>{activeHero && <button type="button" className="button button-secondary" disabled={heroBusy} onClick={useDefaultHero}><RotateCcw size={16}/> Use default image</button>}</div>
        <div className="admin-panel"><div className="panel-title"><h2>Live header</h2><span className="hero-live-tag">{activeHero ? (activeHero.type === 'video' ? <><Video size={13}/> Video</> : <><ImageIcon size={13}/> Image</>) : <><ImageIcon size={13}/> Default image</>}</span></div>
          <div className="hero-live-preview">{activeHero?.type === 'video' ? <video key={activeHero._id} className="hero-live-media" autoPlay muted loop playsInline poster={activeHero.posterUrl || undefined} src={activeHero.url}/> : <img className="hero-live-media" src={activeHero?.url || '/carwise-hero.png'} alt=""/>}<span className="hero-live-scrim"/><div className="hero-live-copy"><span><Sparkles size={12}/> YOUR CAR SEARCH STARTS HERE</span><strong>Find a car you&apos;ll<br/><em>love to drive.</em></strong><small>This is how the homepage header looks right now.</small></div></div></div>
        <div className="admin-panel"><h2>Media library ({heroMedia.length})</h2><p className="muted">JPEG, PNG or WebP images and MP4, WebM or MOV videos, up to 60 MB each. A new upload goes live straight away; videos play muted and loop.</p>
          <div className="hero-media-grid">{heroMedia.map(media => <div key={media._id} className={`hero-media-card${media.active ? ' active' : ''}`}>
            <div className="hero-media-thumb">{media.type === 'video' ? <><video muted playsInline preload="metadata" poster={media.posterUrl || undefined} src={media.url}/><span className="hero-media-kind"><Video size={11}/> Video{media.duration ? ` · ${formatDuration(media.duration)}` : ''}</span></> : <><img src={media.url} alt=""/><span className="hero-media-kind"><ImageIcon size={11}/> Image</span></>}{media.active && <span className="hero-media-live"><Check size={11}/> Live</span>}</div>
            <div className="hero-media-meta"><strong title={media.label}>{media.label || (media.type === 'video' ? 'Header video' : 'Header image')}</strong><small>{[media.width && media.height ? `${media.width}×${media.height}` : '', formatBytes(media.bytes), formatDate(media.createdAt)].filter(Boolean).join(' · ')}</small></div>
            <div className="hero-media-actions">{media.active ? <span className="hero-media-current"><Check size={13}/> Showing in header</span> : <button type="button" disabled={heroBusy} onClick={() => activateHero(media)}>Use in header</button>}<button type="button" className="hero-media-delete" disabled={heroBusy} aria-label="Delete media" onClick={() => setDeletingHero(media)}><Trash2 size={15}/></button></div>
          </div>)}
          <label className="upload-tile hero-upload-tile"><Upload size={22}/><span>{heroBusy ? 'Uploading...' : 'Upload image or video'}</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" disabled={heroBusy} onChange={event => { uploadHeroMedia(event.target.files); event.target.value = ''; }}/></label></div>
          {!heroMedia.length && <p className="panel-empty">Nothing uploaded yet. The homepage is using the default header image.</p>}</div></>}
      {tab === 'users' && canManageUsers && !editing && !editingUser && <><div className="admin-page-head"><div><span className="admin-kicker">ACCESS CONTROL</span><h1>Users<span className="accent-dot">.</span></h1><p>Who can sign in to the workspace, and what they are allowed to do.</p></div><button className="button button-primary" onClick={() => openUser()}><Plus size={18}/> Add user</button></div>
        <div className="admin-panel"><div className="admin-toolbar"><div className="admin-search"><Search size={18}/><input placeholder="Search users..." value={userSearch} onChange={event => setUserSearch(event.target.value)}/></div><span>{filteredUsers.length} users</span></div><div className="table-scroll"><table className="admin-user-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>PHONE</th><th>ADDRESS</th><th>ROLE</th><th>ADDED</th><th>ACTIONS</th></tr></thead><tbody>{filteredUsers.map(person => <tr key={person._id}>
          <td><div className="table-user"><span className="user-avatar">{person.firstName.charAt(0).toUpperCase()}</span><div><strong>{person.firstName} {person.lastName}</strong>{signedInAs?._id === person._id && <small>That&apos;s you</small>}</div></div></td>
          <td><a href={`mailto:${person.email}`}>{person.email}</a></td>
          <td><a href={`tel:${person.phone}`}>{person.phone}</a></td>
          <td className="user-address">{person.address || '—'}</td>
          <td><span className={`role-pill role-${person.role}`}>{person.role === 'superadmin' ? <ShieldCheck size={11}/> : <UserIcon size={11}/>}{person.role}</span></td>
          <td>{formatDate(person.createdAt)}</td>
          <td><div className="row-actions"><button onClick={() => openUser(person)}>Edit</button><button onClick={() => setDeletingUser(person)} disabled={signedInAs?._id === person._id} aria-label={`Delete ${person.firstName} ${person.lastName}`}><Trash2 size={16}/></button></div></td>
        </tr>)}</tbody></table>{!filteredUsers.length && <p className="panel-empty">No users found.</p>}</div></div></>}
      {tab === 'users' && canManageUsers && editingUser && <><div className="admin-page-head"><div><button className="back-link" onClick={() => setEditingUser(null)}><ArrowLeft size={17}/> Back to users</button><h1>{editingUser._id ? 'Edit user' : 'Add a user'}<span className="accent-dot">.</span></h1><p>{editingUser._id ? 'Update the details or change the role. Leave the password blank to keep the current one.' : 'They will be able to sign in with the email and password you set here.'}</p></div></div><form className="admin-car-form" onSubmit={saveUser}><section className="admin-panel"><h2>Account details</h2><div className="admin-form-grid">
        <label>First name<input required value={userForm.firstName} onChange={event => setUserForm({ ...userForm, firstName: event.target.value })} placeholder="First name"/></label>
        <label>Last name<input required value={userForm.lastName} onChange={event => setUserForm({ ...userForm, lastName: event.target.value })} placeholder="Last name"/></label>
        <label>Email<input type="email" required value={userForm.email} onChange={event => setUserForm({ ...userForm, email: event.target.value })} placeholder="name@example.com"/></label>
        <label>Phone<input type="tel" required minLength={7} value={userForm.phone} onChange={event => setUserForm({ ...userForm, phone: event.target.value })} placeholder="Contact number"/></label>
        <label className="admin-form-wide">Address<textarea rows={2} value={userForm.address} onChange={event => setUserForm({ ...userForm, address: event.target.value })} placeholder="Street, city, postcode"/></label>
        <label>Password {editingUser._id && <small>Leave blank to keep current</small>}<input type="password" required={!editingUser._id} minLength={editingUser._id ? undefined : 3} value={userForm.password} onChange={event => setUserForm({ ...userForm, password: event.target.value })} placeholder={editingUser._id ? 'Unchanged' : 'At least 3 characters'} autoComplete="new-password"/></label>
        <label>Role<select value={userForm.role} onChange={event => setUserForm({ ...userForm, role: event.target.value as UserForm['role'] })}><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select></label>
      </div><p className="role-note">{userForm.role === 'superadmin' ? <><ShieldCheck size={13}/> Superadmins can manage cars, enquiries, header media <strong>and</strong> users.</> : <><KeyRound size={13}/> Admins can manage cars, enquiries and header media, but not users.</>}</p></section><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setEditingUser(null)}>Cancel</button><button className="button button-primary" disabled={busy}><Save size={18}/>{busy ? 'Saving...' : 'Save user'}</button></div></form></>}
      {tab === 'reports' && !editing && <><div className="admin-page-head"><div><span className="admin-kicker">ANALYTICS &amp; REPORTS</span><h1>Sales report<span className="accent-dot">.</span></h1><p>How many cars sold, by whom, and to which customers.</p></div>{report && <button type="button" className="button button-secondary" disabled={reportBusy} onClick={() => loadReport(token)}><RotateCcw size={16}/> Refresh</button>}</div>

        <div className="admin-panel report-filters"><div className="report-period" role="group" aria-label="Report period">{([['week', 'This week'], ['month', 'This month'], ['year', 'This year'], ['all', 'All time'], ['custom', 'Custom']] as [ReportPeriod, string][]).map(([value, label]) => <button key={value} type="button" className={period === value ? 'selected' : ''} onClick={() => setPeriod(value)}>{label}</button>)}</div>
          <div className="report-filter-row">{period === 'custom' && <><label>From<input type="date" value={customFrom} max={customTo || undefined} onChange={event => setCustomFrom(event.target.value)}/></label><label>To<input type="date" value={customTo} min={customFrom || undefined} onChange={event => setCustomTo(event.target.value)}/></label></>}
            <label>Salesperson<select value={salesperson} onChange={event => setSalesperson(event.target.value)}><option value="">Everyone</option>{(report?.people || []).map(person => <option key={person.email} value={person.email}>{person.name}</option>)}</select></label>
            {(salesperson || period !== 'month') && <button type="button" className="report-reset" onClick={() => { setPeriod('month'); setSalesperson(''); setCustomFrom(''); setCustomTo(''); }}><RotateCcw size={14}/> Reset</button>}
          </div>
          {report && <p className="report-range">{new Date(report.range.from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(report.range.to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{report.range.salesperson && <> · {report.bySalesperson.find(p => p.email === report.range.salesperson)?.name || report.range.salesperson}</>}</p>}
        </div>

        {!report ? <div className="admin-panel"><p className="panel-empty">{reportBusy ? 'Building the report…' : 'No report data yet.'}</p></div> : <>
          <div className="admin-stats report-stats">
            <div><span>Cars sold</span><strong>{report.selected.carsSold}</strong><CarFront/></div>
            <div><span>Revenue</span><strong>{money(report.selected.revenue)}</strong><Wallet/></div>
            <div><span>Average sale</span><strong>{report.selected.averagePrice ? money(report.selected.averagePrice) : '—'}</strong><TrendingUp/></div>
            <div><span>Still for sale</span><strong>{report.inventory.activeCars}</strong><Eye/></div>
          </div>

          <div className="report-quick">{([['This week', report.quick.week], ['This month', report.quick.month], ['This year', report.quick.year], ['All time', report.quick.allTime]] as [string, Money][]).map(([label, value]) => <div key={label} className="report-quick-card"><small>{label}</small><strong>{value.carsSold} {value.carsSold === 1 ? 'car' : 'cars'}</strong><span>{money(value.revenue)}</span></div>)}</div>

          <div className="admin-panel"><div className="panel-title"><h2>Sales through {report.range.chartYear}</h2><span className="report-chart-total">{report.monthly.reduce((sum, m) => sum + m.carsSold, 0)} cars</span></div>
            <div className="report-chart" role="img" aria-label={`Cars sold each month of ${report.range.chartYear}`}>{report.monthly.map(entry => { const peak = Math.max(...report.monthly.map(m => m.carsSold), 1); return <div key={entry.month} className="report-bar" title={`${entry.label}: ${entry.carsSold} sold · ${money(entry.revenue)}`}><span className="report-bar-value">{entry.carsSold || ''}</span><span className="report-bar-fill" style={{ height: `${entry.carsSold ? Math.max(6, (entry.carsSold / peak) * 100) : 2}%` }}/><small>{entry.label}</small></div>; })}</div>
          </div>

          <div className="admin-panel"><div className="panel-title"><h2>By salesperson</h2><span>{report.bySalesperson.length} {report.bySalesperson.length === 1 ? 'person' : 'people'}</span></div>
            {report.bySalesperson.length ? <div className="table-scroll"><table className="admin-report-table"><thead><tr><th>SALESPERSON</th><th>CARS SOLD</th><th>REVENUE</th><th>AVERAGE</th><th>LAST SALE</th><th>ACTIONS</th></tr></thead><tbody>{report.bySalesperson.map(person => <tr key={person.email || person.name}>
              <td><div className="table-user"><span className="user-avatar">{person.name.charAt(0).toUpperCase()}</span><div><strong>{person.name}</strong>{person.email && <small>{person.email}</small>}</div></div></td>
              <td><strong>{person.carsSold}</strong></td>
              <td>{money(person.revenue)}</td>
              <td>{person.averagePrice ? money(person.averagePrice) : '—'}</td>
              <td>{formatDate(person.lastSale)}</td>
              <td><div className="row-actions">{person.email && <button onClick={() => setSalesperson(salesperson === person.email ? '' : person.email)}>{salesperson === person.email ? 'Clear filter' : 'View only'}</button>}</div></td>
            </tr>)}</tbody></table></div> : <p className="panel-empty">No sales recorded in this period.</p>}
          </div>

          <div className="admin-panel"><div className="panel-title"><h2>Customers</h2><span>{report.buyers.length} {report.buyers.length === 1 ? 'sale' : 'sales'}</span></div>
            {report.buyers.length ? <div className="table-scroll"><table className="admin-report-table"><thead><tr><th>CUSTOMER</th><th>CAR</th><th>PRICE</th><th>SOLD ON</th><th>SOLD BY</th></tr></thead><tbody>{report.buyers.map(sale => <tr key={sale.carId}>
              <td><div className="customer-cell"><strong>{sale.buyerName || '—'}</strong>{sale.buyerPhone && <a href={`tel:${sale.buyerPhone}`}>{sale.buyerPhone}</a>}{sale.buyerEmail && <a href={`mailto:${sale.buyerEmail}`}>{sale.buyerEmail}</a>}</div></td>
              <td>{sale.car}</td>
              <td><strong>{money(sale.soldPrice)}</strong></td>
              <td>{formatDate(sale.soldAt)}</td>
              <td>{sale.salespersonName || '—'}</td>
            </tr>)}</tbody></table></div> : <p className="panel-empty">No customers in this period.</p>}
          </div>
        </>}
      </>}
      {tab === 'feedback' && !editing && !editingFeedback && <><div className="admin-page-head"><div><span className="admin-kicker">CUSTOMER VOICE</span><h1>Feedback<span className="accent-dot">.</span></h1><p>Reviews shown on the home page and the feedback page.</p></div><button className="button button-primary" onClick={() => openFeedback()}><Plus size={18}/> Add feedback</button></div>
        <div className="admin-panel"><div className="admin-toolbar"><strong>All feedback</strong><span>{feedback.length} total</span></div>{feedback.length ? <div className="admin-feedback-grid">{feedback.map(entry => <article key={entry._id} className={entry.published === false ? 'admin-feedback-card muted' : 'admin-feedback-card'}>
          <header className="admin-feedback-head">
            <span className={entry.image?.url ? 'admin-feedback-photo' : 'user-avatar'}>{entry.image?.url ? <img src={entry.image.url} alt=""/> : entry.name.charAt(0).toUpperCase()}</span>
            <div className="admin-feedback-who"><strong>{entry.name}</strong><small>{formatDate(entry.createdAt)}</small></div>
            <span className={`status status-${entry.published === false ? 'hidden' : 'active'}`}>{entry.published === false ? 'hidden' : 'live'}</span>
          </header>
          <span className="admin-stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} strokeWidth={2.2} fill={index < entry.rating ? 'currentColor' : 'none'} className={index < entry.rating ? 'filled' : ''}/>)}</span>
          <p className="admin-feedback-message">{entry.message}</p>
          <footer className="admin-feedback-actions">
            <button type="button" onClick={() => openFeedback(entry)}>Edit</button>
            <button type="button" className="admin-feedback-delete" onClick={() => setDeletingFeedback(entry)} aria-label={`Delete feedback from ${entry.name}`}><Trash2 size={15}/> Delete</button>
          </footer>
        </article>)}</div> : <div className="panel-empty"><MessageSquareText size={30}/><p>No feedback yet. Add the first one to show it on the site.</p></div>}</div></>}
      {tab === 'feedback' && !editing && editingFeedback && <><div className="admin-page-head"><div><button className="back-link" onClick={() => setEditingFeedback(null)}><ArrowLeft size={17}/> Back to feedback</button><h1>{editingFeedback._id ? 'Edit feedback' : 'Add feedback'}<span className="accent-dot">.</span></h1><p>This appears on the home page and the feedback page.</p></div></div><form className="admin-car-form" onSubmit={saveFeedback}><section className="admin-panel"><h2>Feedback details</h2><div className="admin-form-grid">
        <label>Name<input required value={feedbackForm.name} onChange={event => setFeedbackForm({ ...feedbackForm, name: event.target.value })} placeholder="Customer name"/></label>
        <label>Rating<span className="rating-picker">{Array.from({ length: 5 }, (_, index) => <button key={index} type="button" className={index < feedbackForm.rating ? 'on' : ''} onClick={() => setFeedbackForm({ ...feedbackForm, rating: index + 1 })} aria-label={`${index + 1} star${index ? 's' : ''}`} aria-pressed={feedbackForm.rating === index + 1}><Star size={20} strokeWidth={2.2} fill={index < feedbackForm.rating ? 'currentColor' : 'none'}/></button>)}<small>{feedbackForm.rating} of 5</small></span></label>
        <label className="admin-form-wide">Feedback<textarea rows={4} required value={feedbackForm.message} onChange={event => setFeedbackForm({ ...feedbackForm, message: event.target.value })} placeholder="What did they say about the experience?"/></label>
      </div></section>
      <section className="admin-panel"><h2>Photo</h2><p className="muted">Optional. A JPEG, PNG or WebP under 5 MB, shown as a small photo alongside the review. Include the customer and their car; the full image stays visible.</p><div className="image-preview-grid">{feedbackForm.image.url ? <div className="image-preview admin-feedback-preview"><img src={feedbackForm.image.url} alt="Feedback photo"/><button type="button" aria-label="Remove image" onClick={() => setFeedbackForm({ ...feedbackForm, image: { url: '', publicId: '' } })}><X size={16}/></button></div> : <label className="upload-tile"><Upload size={22}/><span>{busy ? 'Uploading...' : 'Upload image'}</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { uploadFeedbackImage(event.target.files); event.target.value = ''; }}/></label>}</div>
        <label className="admin-toggle"><input type="checkbox" checked={feedbackForm.published} onChange={event => setFeedbackForm({ ...feedbackForm, published: event.target.checked })}/><span>Show this feedback on the website</span></label></section>
      <div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setEditingFeedback(null)}>Cancel</button><button className="button button-primary" disabled={busy}><Save size={18}/>{busy ? 'Saving...' : 'Save feedback'}</button></div></form></>}
      {tab === 'enquiries' && !editing && <><div className="admin-page-head"><div><span className="admin-kicker">CUSTOMER INTEREST</span><h1>Enquiries<span className="accent-dot">.</span></h1><p>See who is interested and keep their status up to date.</p></div></div><div className="admin-panel"><div className="admin-toolbar"><strong>All enquiries</strong><span>{enquiries.length} total</span></div><div className="table-scroll"><table className="admin-enquiry-table"><thead><tr><th>CUSTOMER</th><th>CAR</th><th>MESSAGE</th><th>RECEIVED</th><th>STATUS</th></tr></thead><tbody>{enquiries.map(enquiry => <tr key={enquiry._id}><td><div className="customer-cell"><strong>{enquiry.name}</strong><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a><a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>{enquiry.city && <small>{enquiry.city}</small>}</div></td><td>{enquiry.carId ? `${enquiry.carId.brand} ${enquiry.carId.model} ${enquiry.carId.year}` : 'Car removed'}</td><td className="message-cell">{enquiry.message || '—'}</td><td>{new Date(enquiry.createdAt).toLocaleDateString('en-IN')}</td><td><select className={`status-select status-${enquiry.status}`} value={enquiry.status} onChange={event => updateEnquiry(enquiry._id, event.target.value as Enquiry['status'])}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></td></tr>)}</tbody></table>{!enquiries.length && <div className="panel-empty"><Inbox size={30}/><p>No enquiries yet. They will appear here when customers submit the form.</p></div>}</div></div></>}
    </div></main>{selling && <div className="admin-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelling(null); }}><div className="admin-sale-modal" role="dialog" aria-modal="true" aria-label={selling.status === 'sold' ? 'Sale details' : 'Mark car sold'}><div className="sale-modal-heading"><div><span className="admin-kicker">{selling.brand} {selling.model}</span><h2>{selling.status === 'sold' ? 'Sale details' : 'Mark as sold'}</h2></div><button type="button" onClick={() => setSelling(null)} aria-label="Close"><X size={20}/></button></div>{selling.status === 'sold' && selling.sale ? <div className="sale-detail-grid"><div><small>Sold price</small><strong>{money(selling.sale.soldPrice)}</strong></div><div><small>Sale date</small><strong>{new Date(selling.sale.soldAt).toLocaleDateString('en-IN')}</strong></div><div><small>Buyer</small><strong>{selling.sale.buyerName}</strong>{selling.sale.buyerEmail && <a href={`mailto:${selling.sale.buyerEmail}`}>{selling.sale.buyerEmail}</a>}<a href={`tel:${selling.sale.buyerPhone}`}>{selling.sale.buyerPhone}</a></div><div><small>Sold by</small><strong>{selling.sale.salespersonName || '—'}</strong>{selling.sale.salespersonEmail && <a href={`mailto:${selling.sale.salespersonEmail}`}>{selling.sale.salespersonEmail}</a>}</div></div> : <form onSubmit={saveSale} className="sale-form"><div className="sale-form-grid"><label>Sold price (₹)<input type="number" min="1" required value={saleForm.soldPrice || ''} onChange={event => setSaleForm({ ...saleForm, soldPrice: Number(event.target.value) })}/></label><label>Sale date<input type="date" required value={saleForm.soldAt} onChange={event => setSaleForm({ ...saleForm, soldAt: event.target.value })}/></label><label>Buyer name<input required value={saleForm.buyerName} onChange={event => setSaleForm({ ...saleForm, buyerName: event.target.value })}/></label><label>Buyer phone<input type="tel" required minLength={7} value={saleForm.buyerPhone} onChange={event => setSaleForm({ ...saleForm, buyerPhone: event.target.value })}/></label></div><div className="sale-seller-note"><UserIcon size={15}/><div><small>Recorded by</small><strong>{fullName(signedInAs) || 'KangaCars Admin'}{signedInAs?.email ? ` · ${signedInAs.email}` : ''}</strong></div></div><div className="sale-form-actions"><button type="button" className="button button-secondary" onClick={() => setSelling(null)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving...' : 'Confirm sale'}</button></div></form>}</div></div>}
    {deleting && <div className="admin-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDeleting(null); }}><div className="admin-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><div className="admin-delete-icon"><AlertTriangle size={26}/></div><h2 id="delete-title">Delete this car?</h2><p>Are you sure you want to permanently delete <strong>{deleting.brand} {deleting.model}</strong> ({deleting.year})? This action cannot be undone.</p><div className="admin-delete-actions"><button type="button" className="button button-secondary" onClick={() => setDeleting(null)} disabled={busy}>Cancel</button><button type="button" className="button button-danger" onClick={confirmDeleteCar} disabled={busy}><Trash2 size={16}/>{busy ? 'Deleting…' : 'Delete car'}</button></div></div></div>}
    {deletingFeedback && <div className="admin-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDeletingFeedback(null); }}><div className="admin-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-feedback-title"><div className="admin-delete-icon"><AlertTriangle size={26}/></div><h2 id="delete-feedback-title">Delete this feedback?</h2><p>The review from <strong>{deletingFeedback.name}</strong> will be removed from the website. This action cannot be undone.</p><div className="admin-delete-actions"><button type="button" className="button button-secondary" onClick={() => setDeletingFeedback(null)} disabled={busy}>Cancel</button><button type="button" className="button button-danger" onClick={confirmDeleteFeedback} disabled={busy}><Trash2 size={16}/>{busy ? 'Deleting…' : 'Delete feedback'}</button></div></div></div>}
    {deletingUser && <div className="admin-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDeletingUser(null); }}><div className="admin-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title"><div className="admin-delete-icon"><AlertTriangle size={26}/></div><h2 id="delete-user-title">Delete this user?</h2><p><strong>{deletingUser.firstName} {deletingUser.lastName}</strong> ({deletingUser.email}) will no longer be able to sign in. This action cannot be undone.</p><div className="admin-delete-actions"><button type="button" className="button button-secondary" onClick={() => setDeletingUser(null)} disabled={busy}>Cancel</button><button type="button" className="button button-danger" onClick={confirmDeleteUser} disabled={busy}><Trash2 size={16}/>{busy ? 'Deleting…' : 'Delete user'}</button></div></div></div>}
    {deletingHero && <div className="admin-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDeletingHero(null); }}><div className="admin-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-hero-title"><div className="admin-delete-icon"><AlertTriangle size={26}/></div><h2 id="delete-hero-title">Delete this media?</h2><p>This removes the {deletingHero.type === 'video' ? 'video' : 'image'} from your library{deletingHero.active ? ' and puts the default header image back on the homepage' : ''}. This action cannot be undone.</p><div className="admin-delete-actions"><button type="button" className="button button-secondary" onClick={() => setDeletingHero(null)} disabled={heroBusy}>Cancel</button><button type="button" className="button button-danger" onClick={confirmDeleteHero} disabled={heroBusy}><Trash2 size={16}/>{heroBusy ? 'Deleting…' : 'Delete media'}</button></div></div></div>}
    {viewingPoster && <div className="admin-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setViewingPoster(null); }}><div className="admin-poster-modal" role="dialog" aria-modal="true" aria-label="Poster details"><div className="admin-poster-head"><div className="admin-poster-avatar">{(viewingPoster.postedBy?.name || 'C').charAt(0).toUpperCase()}</div><div><span className="admin-kicker">POSTED BY</span><h2>{viewingPoster.postedBy?.name || 'KangaCars Admin'}</h2><small>Listed {formatDate(viewingPoster.createdAt)}</small></div><button type="button" onClick={() => setViewingPoster(null)} aria-label="Close"><X size={18}/></button></div><div className="admin-poster-body"><div className="admin-poster-row"><Mail size={15}/><div><small>Email</small>{viewingPoster.postedBy?.email ? <a href={`mailto:${viewingPoster.postedBy.email}`}>{viewingPoster.postedBy.email}</a> : <strong className="admin-poster-empty">Not provided</strong>}</div></div><div className="admin-poster-row"><Phone size={15}/><div><small>Phone</small>{viewingPoster.postedBy?.phone ? <a href={`tel:${viewingPoster.postedBy.phone}`}>{viewingPoster.postedBy.phone}</a> : <strong className="admin-poster-empty">Not provided</strong>}</div></div><div className="admin-poster-row"><CarFront size={15}/><div><small>Listing</small><strong>{viewingPoster.year} {viewingPoster.brand} {viewingPoster.model}</strong></div></div><div className="admin-poster-row"><CalendarDays size={15}/><div><small>Last updated</small><strong>{formatDate(viewingPoster.updatedAt || viewingPoster.createdAt)}</strong></div></div></div></div></div>}
    {viewingCar && <div className="admin-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setViewingCar(null); }}><div className="admin-detail-modal" role="dialog" aria-modal="true" aria-label={`${viewingCar.brand} ${viewingCar.model} details`}><div className="admin-detail-head"><div><span className="admin-kicker">CAR DETAILS</span><h2>{viewingCar.year} {viewingCar.brand} {viewingCar.model}</h2><small><MapPin size={12}/>{viewingCar.location} · <Eye size={12}/>{(viewingCar.viewCount || 0).toLocaleString('en-IN')} views</small></div><button type="button" onClick={() => setViewingCar(null)} aria-label="Close"><X size={20}/></button></div><div className="admin-detail-body">{viewingCar.images?.length > 0 && <div className="admin-detail-gallery">{viewingCar.images.slice(0, 6).map((image, index) => <div key={index} className="admin-detail-thumb"><img src={image.url} alt={`Photo ${index + 1}`}/></div>)}</div>}<div className="admin-detail-grid"><div><small>Asking price</small><strong className="admin-detail-price">{money(viewingCar.price)}</strong></div><div><small><CalendarDays size={12}/>Year</small><strong>{viewingCar.year}</strong></div><div><small><Gauge size={12}/>Kilometres</small><strong>{Number(viewingCar.kmDriven).toLocaleString('en-IN')} km</strong></div><div><small><Fuel size={12}/>Fuel</small><strong>{viewingCar.fuelType}</strong></div><div><small><Settings2 size={12}/>Transmission</small><strong>{viewingCar.transmission}</strong></div><div><small>Body type</small><strong>{viewingCar.bodyType || '—'}</strong></div><div><small>Status</small><strong><span className={`status status-${viewingCar.status}`}>{viewingCar.status}</span></strong></div><div><small>Slug</small><strong className="admin-detail-slug">{viewingCar.slug || '—'}</strong></div></div>{viewingCar.description && <div className="admin-detail-section"><small>Description</small><p>{viewingCar.description}</p></div>}{viewingCar.features?.length > 0 && <div className="admin-detail-section"><small>Features</small><div className="admin-detail-features">{viewingCar.features.map(feature => <span key={feature}>{feature}</span>)}</div></div>}<div className="admin-detail-section"><small>Posted by</small><div className="admin-detail-poster"><div><UserIcon size={13}/><strong>{viewingCar.postedBy?.name || 'KangaCars Admin'}</strong></div>{viewingCar.postedBy?.email && <div><Mail size={13}/><a href={`mailto:${viewingCar.postedBy.email}`}>{viewingCar.postedBy.email}</a></div>}{viewingCar.postedBy?.phone && <div><Phone size={13}/><a href={`tel:${viewingCar.postedBy.phone}`}>{viewingCar.postedBy.phone}</a></div>}<div><CalendarDays size={13}/><span>Listed {formatDate(viewingCar.createdAt)}</span></div></div></div></div><div className="admin-detail-actions"><button type="button" className="button button-secondary" onClick={() => setViewingCar(null)}>Close</button><button type="button" className="button button-primary" onClick={() => { const car = viewingCar; setViewingCar(null); openCar(car); }}>Edit car <ArrowRight size={16}/></button></div></div></div>}
    </div>;
}
