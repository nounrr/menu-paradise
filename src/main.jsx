import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Coffee,
  Edit3,
  ImagePlus,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Trash2,
  Users
} from 'lucide-react';
import './styles.css';
import logoUrl from '../logo.png';

const api = axios.create({ baseURL: '/api' });

function getToken() {
  return localStorage.getItem('token');
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function useMenuData() {
  const [meta, setMeta] = useState({ categories: [], subcategories: [] });
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMeta = async () => {
    const { data } = await api.get('/categories');
    setMeta(data);
  };

  const loadDishes = async (params = {}) => {
    setLoading(true);
    const { data } = await api.get('/dishes', { params });
    setDishes(data);
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([loadMeta(), loadDishes()]).catch(console.error);
  }, []);

  return { meta, dishes, loading, loadMeta, loadDishes };
}

function DishImage({ dish }) {
  if (dish.image_url) {
    return <img src={dish.image_url} alt={dish.name_fr} />;
  }

  return (
    <div className="dishFallback">
      <Coffee size={24} />
    </div>
  );
}

function PublicMenu({ data }) {
  const { meta, dishes, loading, loadDishes } = data;
  const pageSize = 30;
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [language, setLanguage] = useState('fr');
  const isArabic = language === 'ar';
  const text = {
    title: isArabic ? 'قائمة الطعام' : 'Recommended',
    eyebrow: isArabic ? 'القائمة الرقمية' : 'Menu digital',
    search: isArabic ? 'بحث...' : 'Search...',
    all: isArabic ? 'الكل' : 'Toutes',
    subcategories: isArabic ? 'التصنيفات الفرعية' : 'Sous-categories',
    loading: isArabic ? 'تحميل...' : 'Chargement...',
    empty: isArabic ? 'لا توجد منتجات.' : 'Aucun produit trouve.',
    products: isArabic ? 'منتج' : 'produits',
    page: isArabic ? 'صفحة' : 'Page',
    previous: isArabic ? 'السابق' : 'Precedent',
    next: isArabic ? 'التالي' : 'Suivant'
  };

  const field = (item, base) => {
    if (!item) return '';
    return isArabic ? item[`${base}_ar`] || item[`${base}_fr`] || '' : item[`${base}_fr`] || item[`${base}_ar`] || '';
  };

  const dishCategory = (dish) =>
    isArabic
      ? dish.subcategory_ar || dish.category_ar || dish.subcategory_fr || dish.category_fr
      : dish.subcategory_fr || dish.category_fr || dish.subcategory_ar || dish.category_ar;

  const subcategories = useMemo(
    () => meta.subcategories.filter((item) => !categoryId || item.category_id === Number(categoryId)),
    [meta.subcategories, categoryId]
  );

  const totalPages = Math.max(1, Math.ceil(dishes.length / pageSize));
  const visibleDishes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return dishes.slice(start, start + pageSize);
  }, [dishes, page]);

  useEffect(() => {
    if (!categoryId && meta.categories.length > 0) {
      setCategoryId(String(meta.categories[0].id));
      setSubcategoryId('');
    }
  }, [categoryId, meta.categories]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, subcategoryId, q]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDishes({ categoryId, subcategoryId, q });
    }, 180);
    return () => clearTimeout(timer);
  }, [categoryId, subcategoryId, q]);

  return (
    <main className="menuShell appMenuShell">
      <section className="phoneMenu" dir={isArabic ? 'rtl' : 'ltr'}>
        <header className="menuHeader">
        
          <div className="brandLine">
            <div>
              <span className="eyebrow">{text.eyebrow}</span>
            </div>
            <div className="heroMark">
              <img src={logoUrl} alt="Paradise Inn" />
            </div>
          </div>
        </header>

        <section className="filters menuControls">
          <label className="searchBox">
            <span>
              <Search size={16} />
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder={text.search} />
            </span>
          </label>
          <div className="languageSwitch" aria-label="Language">
            <button className={language === 'fr' ? 'active' : ''} type="button" onClick={() => setLanguage('fr')}>
              FR
            </button>
            <button className={language === 'ar' ? 'active' : ''} type="button" onClick={() => setLanguage('ar')}>
              AR
            </button>
          </div>
          <label className="selectBox">
            <SlidersHorizontal size={16} />
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setSubcategoryId('');
              }}
            >
              <option value="">{text.all}</option>
              {meta.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {field(category, 'name')}
                </option>
              ))}
            </select>
          </label>
          <label className="selectBox subSelect">
            <select
              value={subcategoryId}
              onChange={(event) => setSubcategoryId(event.target.value)}
              disabled={subcategories.length === 0}
            >
              <option value="">{text.subcategories}</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {field(subcategory, 'name')}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div className="sectionTitle recommendedTitle">
          <span>{loading ? '...' : `${dishes.length} ${text.products}`}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={`${categoryId}-${subcategoryId}-${q}-${language}-${loading}-${page}`}
            className="dishGrid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {loading ? (
              <p className="empty">{text.loading}</p>
            ) : dishes.length ? (
              visibleDishes.map((dish) => (
                <motion.article
                  layout
                  className={`dishCard${field(dish, 'description') ? ' hasDescription' : ''}`}
                  key={dish.id}
                >
                  <DishImage dish={dish} />
                  <div className="dishInfo">
                    <div className="dishHead">
                      <div>
                        <h3>{field(dish, 'name')}</h3>
                      </div>
                    </div>
                    {field(dish, 'description') && <p className="description">{field(dish, 'description')}</p>}
                    <div className="dishFooter">
                      <span>{dishCategory(dish)}</span>
                      <strong>{Number(dish.price).toFixed(0)} Dhs</strong>
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              <p className="empty">{text.empty}</p>
            )}
          </motion.section>
        </AnimatePresence>

        {!loading && dishes.length > pageSize && (
          <nav className="pagination" aria-label="Pagination">
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              {text.previous}
            </button>
            <span>
              {text.page} {page} / {totalPages}
            </span>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>
              {text.next}
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}

const emptyDish = {
  id: null,
  category_id: '',
  subcategory_id: '',
  name_fr: '',
  name_ar: '',
  description_fr: '',
  description_ar: '',
  price: '',
  note: '',
  is_active: 1,
  sort_order: 0
};

function AdminPanel({ data, onLogout }) {
  const { meta, loadMeta } = data;
  const [tab, setTab] = useState('dishes');
  const [dishes, setDishes] = useState([]);
  const [users, setUsers] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ id: null, name_fr: '', name_ar: '', sort_order: 0 });
  const [subcategoryForm, setSubcategoryForm] = useState({
    id: null,
    category_id: '',
    name_fr: '',
    name_ar: '',
    sort_order: 0
  });
  const [dishForm, setDishForm] = useState(emptyDish);
  const [userForm, setUserForm] = useState({ id: null, name: '', email: '', password: '', role: 'admin' });
  const [image, setImage] = useState(null);

  const loadAdmin = async () => {
    const [dishRes, userRes] = await Promise.all([api.get('/admin/dishes'), api.get('/admin/users')]);
    setDishes(dishRes.data);
    setUsers(userRes.data);
  };

  useEffect(() => {
    loadAdmin().catch(console.error);
  }, []);

  const subcategories = meta.subcategories.filter(
    (item) => !dishForm.category_id || item.category_id === Number(dishForm.category_id)
  );

  const submitDish = async (event) => {
    event.preventDefault();
    const form = new FormData();
    Object.entries(dishForm).forEach(([key, value]) => form.append(key, value ?? ''));
    if (image) form.append('image', image);

    if (dishForm.id) {
      await api.put(`/admin/dishes/${dishForm.id}`, form);
    } else {
      await api.post('/admin/dishes', form);
    }
    setDishForm(emptyDish);
    setImage(null);
    await loadAdmin();
  };

  const submitUser = async (event) => {
    event.preventDefault();
    if (userForm.id) {
      await api.put(`/admin/users/${userForm.id}`, userForm);
    } else {
      await api.post('/admin/users', userForm);
    }
    setUserForm({ id: null, name: '', email: '', password: '', role: 'admin' });
    await loadAdmin();
  };

  const deleteDish = async (id) => {
    if (!confirm('Supprimer ce plat ?')) return;
    await api.delete(`/admin/dishes/${id}`);
    await loadAdmin();
  };

  const deleteUser = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await api.delete(`/admin/users/${id}`);
    await loadAdmin();
  };

  const submitCategory = async (event) => {
    event.preventDefault();
    if (categoryForm.id) {
      await api.put(`/admin/categories/${categoryForm.id}`, categoryForm);
    } else {
      await api.post('/admin/categories', categoryForm);
    }
    setCategoryForm({ id: null, name_fr: '', name_ar: '', sort_order: 0 });
    await loadMeta();
  };

  const submitSubcategory = async (event) => {
    event.preventDefault();
    if (subcategoryForm.id) {
      await api.put(`/admin/subcategories/${subcategoryForm.id}`, subcategoryForm);
    } else {
      await api.post('/admin/subcategories', subcategoryForm);
    }
    setSubcategoryForm({ id: null, category_id: '', name_fr: '', name_ar: '', sort_order: 0 });
    await loadMeta();
  };

  const deleteCategory = async (id) => {
    if (!confirm('Supprimer cette categorie et ses sous-categories ?')) return;
    await api.delete(`/admin/categories/${id}`);
    await loadMeta();
    await loadAdmin();
  };

  const deleteSubcategory = async (id) => {
    if (!confirm('Supprimer cette sous-categorie ?')) return;
    await api.delete(`/admin/subcategories/${id}`);
    await loadMeta();
    await loadAdmin();
  };

  return (
    <main className="adminShell">
      <header className="adminHeader">
        <div>
          <span className="eyebrow">Administration</span>
          <h1>Gestion du menu</h1>
        </div>
        <button className="iconButton" onClick={onLogout} title="Deconnexion">
          <LogOut size={18} />
        </button>
      </header>

      <nav className="tabs">
        <button className={tab === 'dishes' ? 'active' : ''} onClick={() => setTab('dishes')}>
          <Coffee size={16} /> Plats
        </button>
        <button className={tab === 'menu' ? 'active' : ''} onClick={() => setTab('menu')}>
          <Plus size={16} /> Menu
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          <Users size={16} /> Users
        </button>
      </nav>

      {tab === 'dishes' && (
        <section className="adminGrid">
          <form className="panel" onSubmit={submitDish}>
            <h2>{dishForm.id ? 'Modifier plat' : 'Ajouter plat'}</h2>
            <select
              required
              value={dishForm.category_id || ''}
              onChange={(event) => setDishForm({ ...dishForm, category_id: event.target.value, subcategory_id: '' })}
            >
              <option value="">Categorie</option>
              {meta.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_fr}
                </option>
              ))}
            </select>
            <select
              value={dishForm.subcategory_id || ''}
              onChange={(event) => setDishForm({ ...dishForm, subcategory_id: event.target.value })}
            >
              <option value="">Sous-categorie</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name_fr}
                </option>
              ))}
            </select>
            <input required placeholder="Nom FR" value={dishForm.name_fr} onChange={(e) => setDishForm({ ...dishForm, name_fr: e.target.value })} />
            <input placeholder="Nom AR" value={dishForm.name_ar || ''} onChange={(e) => setDishForm({ ...dishForm, name_ar: e.target.value })} />
            <input required type="number" step="0.01" placeholder="Prix" value={dishForm.price} onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })} />
            <textarea placeholder="Description FR" value={dishForm.description_fr || ''} onChange={(e) => setDishForm({ ...dishForm, description_fr: e.target.value })} />
            <label className="fileInput">
              <ImagePlus size={17} /> Image du plat
              <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} />
            </label>
            <button className="primaryButton" type="submit">
              <Plus size={17} /> Enregistrer
            </button>
          </form>

          <div className="tablePanel">
            {dishes.map((dish) => (
              <article className="adminRow" key={dish.id}>
                <DishImage dish={dish} />
                <div>
                  <strong>{dish.name_fr}</strong>
                  <span>{dish.category_fr} · {Number(dish.price).toFixed(0)} Dhs</span>
                </div>
                <button className="iconButton" onClick={() => setDishForm({ ...dish, image_url: undefined })} title="Modifier">
                  <Edit3 size={16} />
                </button>
                <button className="iconButton danger" onClick={() => deleteDish(dish.id)} title="Supprimer">
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'menu' && (
        <section className="adminGrid">
          <div className="stack">
            <form className="panel" onSubmit={submitCategory}>
              <h2>{categoryForm.id ? 'Modifier categorie' : 'Ajouter categorie'}</h2>
              <input required placeholder="Categorie FR" value={categoryForm.name_fr} onChange={(e) => setCategoryForm({ ...categoryForm, name_fr: e.target.value })} />
              <input placeholder="Categorie AR" value={categoryForm.name_ar || ''} onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })} />
              <input type="number" placeholder="Ordre" value={categoryForm.sort_order} onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })} />
              <button className="primaryButton" type="submit">
                <Plus size={17} /> Enregistrer
              </button>
            </form>

            <form className="panel" onSubmit={submitSubcategory}>
              <h2>{subcategoryForm.id ? 'Modifier sous-categorie' : 'Ajouter sous-categorie'}</h2>
              <select required value={subcategoryForm.category_id} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category_id: e.target.value })}>
                <option value="">Categorie parent</option>
                {meta.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_fr}
                  </option>
                ))}
              </select>
              <input required placeholder="Sous-categorie FR" value={subcategoryForm.name_fr} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name_fr: e.target.value })} />
              <input placeholder="Sous-categorie AR" value={subcategoryForm.name_ar || ''} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name_ar: e.target.value })} />
              <input type="number" placeholder="Ordre" value={subcategoryForm.sort_order} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, sort_order: e.target.value })} />
              <button className="primaryButton" type="submit">
                <Plus size={17} /> Enregistrer
              </button>
            </form>
          </div>

          <div className="tablePanel">
            {meta.categories.map((category) => (
              <article className="adminRow menuRow" key={category.id}>
                <div>
                  <strong>{category.name_fr}</strong>
                  <span>{category.name_ar || 'Categorie'} · {meta.subcategories.filter((item) => item.category_id === category.id).length} sous-categories</span>
                </div>
                <button className="iconButton" onClick={() => setCategoryForm(category)} title="Modifier">
                  <Edit3 size={16} />
                </button>
                <button className="iconButton danger" onClick={() => deleteCategory(category.id)} title="Supprimer">
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
            {meta.subcategories.map((subcategory) => (
              <article className="adminRow menuRow" key={`sub-${subcategory.id}`}>
                <div>
                  <strong>{subcategory.name_fr}</strong>
                  <span>{subcategory.name_ar || 'Sous-categorie'}</span>
                </div>
                <button className="iconButton" onClick={() => setSubcategoryForm(subcategory)} title="Modifier">
                  <Edit3 size={16} />
                </button>
                <button className="iconButton danger" onClick={() => deleteSubcategory(subcategory.id)} title="Supprimer">
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'users' && (
        <section className="adminGrid">
          <form className="panel" onSubmit={submitUser}>
            <h2>{userForm.id ? 'Modifier user' : 'Ajouter user'}</h2>
            <input required placeholder="Nom" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
            <input required type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            <input type="password" placeholder={userForm.id ? 'Nouveau mot de passe' : 'Mot de passe'} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
            <button className="primaryButton" type="submit">
              <Shield size={17} /> Enregistrer
            </button>
          </form>
          <div className="tablePanel">
            {users.map((user) => (
              <article className="adminRow userRow" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <button className="iconButton" onClick={() => setUserForm({ ...user, password: '' })} title="Modifier">
                  <Edit3 size={16} />
                </button>
                <button className="iconButton danger" onClick={() => deleteUser(user.id)} title="Supprimer">
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@paradise.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible');
    }
  };

  return (
    <main className="loginShell">
      <form className="loginBox" onSubmit={submit}>
        <span className="eyebrow">Admin Paradise</span>
        <h1>Connexion</h1>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe" />
        {error && <p className="error">{error}</p>}
        <button className="primaryButton" type="submit">
          <LogIn size={17} /> Entrer
        </button>
      </form>
    </main>
  );
}

function App() {
  const data = useMenuData();
  const [view, setView] = useState(() => (window.location.pathname === '/admin' ? 'admin' : 'menu'));
  const [user, setUser] = useState(() => (getToken() ? { role: 'admin' } : null));

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.history.pushState({}, '', '/');
    setView('menu');
  };

  useEffect(() => {
    const syncRoute = () => {
      setView(window.location.pathname === '/admin' ? (getToken() ? 'admin' : 'login') : 'menu');
    };

    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  return (
    <>
      {view === 'menu' && <PublicMenu data={data} />}
      {view === 'login' && <Login onLogin={(nextUser) => { setUser(nextUser); window.history.pushState({}, '', '/admin'); setView('admin'); }} />}
      {view === 'admin' && user && <AdminPanel data={data} onLogout={logout} />}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
