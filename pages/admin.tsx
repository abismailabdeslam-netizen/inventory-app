import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { databases, DB_ID, COLLECTION_ID, storage, BUCKET_ID, Product, Query } from '../lib/appwrite'
import { useLang } from '../lib/LangContext'
import { useAuth } from '../lib/AuthContext'
import Navbar from '../components/Navbar'
import ProductForm from '../components/ProductForm'
import Toast from '../components/Toast'
import { getImageUrl } from './index'

interface ToastState { message: string; type: 'success' | 'error' }

export default function AdminPage() {
  const { t, dir, lang } = useLang()
  const { isAdmin, login } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await databases.listDocuments(DB_ID, COLLECTION_ID, [
        Query.orderDesc('$createdAt'),
        Query.limit(500),
      ])
      setProducts(res.documents as unknown as Product[])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { if (isAdmin) fetchProducts() }, [isAdmin, fetchProducts])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    await new Promise(r => setTimeout(r, 400))
    const ok = login(password)
    if (!ok) setLoginError(t('كلمة المرور غير صحيحة', 'Mot de passe incorrect'))
    setLoginLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await databases.deleteDocument(DB_ID, COLLECTION_ID, deleteTarget.$id)
      // Optionally delete files from storage
      if (deleteTarget.main_image && !deleteTarget.main_image.startsWith('http')) {
        await storage.deleteFile(BUCKET_ID, deleteTarget.main_image).catch(() => {})
      }
      for (const fid of (deleteTarget.secondary_images || [])) {
        if (!fid.startsWith('http')) await storage.deleteFile(BUCKET_ID, fid).catch(() => {})
      }
      showToast(t('تم حذف المنتج', 'Produit supprimé'), 'success')
      await fetchProducts()
    } catch {
      showToast(t('حدث خطأ أثناء الحذف', 'Erreur lors de la suppression'), 'error')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filteredProducts = searchQuery.trim()
    ? products.filter(p => {
        const q = searchQuery.toLowerCase()
        return (p.name_ar || '').toLowerCase().includes(q) || (p.name_fr || '').toLowerCase().includes(q)
      })
    : products

  if (!isAdmin) {
    return (
      <>
        <Head><title>{t('دخول المشرف', 'Accès Admin')}</title></Head>
        <div dir={dir} style={{ minHeight: '100vh' }}>
          <Navbar />
          <div className="container">
            <div className="login-card">
              <div className="accent-line" />
              <h2 className="login-title">{t('لوحة التحكم', 'Panneau Admin')}</h2>
              <p className="login-sub">{t('أدخل كلمة المرور للمتابعة', 'Entrez le mot de passe pour continuer')}</p>
              <form onSubmit={handleLogin}>
                {loginError && <div className="login-error">{loginError}</div>}
                <div className="form-group">
                  <label className="form-label">{t('كلمة المرور', 'Mot de passe')}</label>
                  <input type="password" className="form-input" value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loginLoading}>
                  {loginLoading ? <><span className="spinner"></span></> : t('دخول', 'Connexion')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>{t('لوحة التحكم', 'Administration')}</title></Head>
      <div dir={dir} style={{ minHeight: '100vh' }}>
        <Navbar />
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="accent-line" />
              <h1 className="admin-panel-title">{t('إدارة المنتجات', 'Gestion des Produits')}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                {t(`${products.length} منتج في المخزون`, `${products.length} produit(s) en stock`)}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowForm(true) }}>
              + {t('إضافة منتج', 'Ajouter un produit')}
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <div className="search-wrapper" style={{ maxWidth: '100%' }}>
              <span className="search-icon">🔍</span>
              <input className="search-input" type="text"
                placeholder={t('بحث في المنتجات...', 'Rechercher des produits...')}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📦</div>
              <p>{searchQuery ? t('لا توجد نتائج', 'Aucun résultat') : t('لا توجد منتجات. ابدأ بإضافة منتج!', 'Aucun produit. Commencez par en ajouter un!')}</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const name = lang === 'ar' ? product.name_ar : product.name_fr
              const desc = lang === 'ar' ? product.description_ar : product.description_fr
              const mainImgUrl = getImageUrl(product.main_image)
              return (
                <div key={product.$id} className="product-list-item">
                  {mainImgUrl ? (
                    <img src={mainImgUrl} alt={name} className="product-list-thumb" />
                  ) : (
                    <div className="product-list-thumb-placeholder">📦</div>
                  )}
                  <div className="product-list-info">
                    <div className="product-list-name">{name || t('بدون اسم', 'Sans nom')}</div>
                    <div className="product-list-desc">{desc || '—'}</div>
                  </div>
                  <div className="product-list-actions">
                    <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}
                      onClick={() => { setEditProduct(product); setShowForm(true) }}>
                      ✏ {t('تعديل', 'Modifier')}
                    </button>
                    <button className="btn btn-danger" style={{ padding: '8px 14px', fontSize: 13 }}
                      onClick={() => setDeleteTarget(product)}>
                      🗑 {t('حذف', 'Supprimer')}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {showForm && (
          <ProductForm
            product={editProduct}
            onSuccess={() => { setShowForm(false); fetchProducts() }}
            onCancel={() => setShowForm(false)}
            showToast={showToast}
          />
        )}

        {deleteTarget && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
            <div className="modal">
              <div className="confirm-dialog">
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <h3 className="confirm-title">{t('تأكيد الحذف', 'Confirmer la suppression')}</h3>
                <p className="confirm-msg">
                  {t('هل أنت متأكد من حذف', 'Êtes-vous sûr de supprimer')}{' '}
                  <strong style={{ color: 'var(--text)' }}>
                    {lang === 'ar' ? deleteTarget.name_ar : deleteTarget.name_fr}
                  </strong>
                  {t('؟ لا يمكن التراجع عن هذه العملية.', ' ? Cette action est irréversible.')}
                </p>
                <div className="confirm-actions">
                  <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                    {t('إلغاء', 'Annuler')}
                  </button>
                  <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                    {deleting ? <><span className="spinner" /> {t('جاري الحذف...', 'Suppression...')}</> : t('حذف نهائياً', 'Supprimer définitivement')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </>
  )
}
