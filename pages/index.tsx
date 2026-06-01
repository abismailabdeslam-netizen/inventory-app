import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { databases, DB_ID, COLLECTION_ID, storage, BUCKET_ID, Product, Query, parseSecondaryImages } from '../lib/appwrite'
import { useLang } from '../lib/LangContext'
import Navbar from '../components/Navbar'
import ProductModal from '../components/ProductModal'

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="highlight">{part}</mark> : part
  )
}

export function getImageUrl(fileId: string): string {
  if (!fileId) return ''
  if (fileId.startsWith('http')) return fileId
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''
  return `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${projectId}`
}

export default function Home() {
  const { lang, t, dir } = useLang()
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await databases.listDocuments(DB_ID, COLLECTION_ID, [
        Query.orderDesc('$createdAt'),
        Query.limit(500),
      ])
      setProducts(res.documents as unknown as Product[])
      setFiltered(res.documents as unknown as Product[])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    if (!query.trim()) { setFiltered(products); return }
    const q = query.toLowerCase()
    setFiltered(products.filter(p =>
      (p.name_ar || '').toLowerCase().includes(q) ||
      (p.name_fr || '').toLowerCase().includes(q) ||
      (p.description_ar || '').toLowerCase().includes(q) ||
      (p.description_fr || '').toLowerCase().includes(q)
    ))
  }, [query, products])

  const getName = (p: Product) => lang === 'ar' ? p.name_ar : p.name_fr
  const getDesc = (p: Product) => lang === 'ar' ? p.description_ar : p.description_fr

  return (
    <>
      <Head><title>{t('مخزون المنتجات', 'Stock Produits')}</title></Head>
      <div dir={dir} style={{ minHeight: '100vh' }}>
        <Navbar />

        <div className="hero">
          <h1 className="hero-title">
            {t('مخزون', 'Stock')} <span>{t('المنتجات', 'Produits')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('ابحث عن أي منتج بسهولة', "Trouvez facilement n'importe quel produit")}
          </p>
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder={t('ابحث باسم اللوحة أو الجهاز...', 'Rechercher par nom ou appareil...')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="stats-bar container">
          <span className="stats-count">
            {query
              ? t(`${filtered.length} نتيجة`, `${filtered.length} résultat(s)`)
              : <>{t('إجمالي المنتجات: ', 'Total produits : ')}<strong>{products.length}</strong></>
            }
          </span>
          <div className="divider-line" />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
            <p>{t('جاري التحميل...', 'Chargement...')}</p>
          </div>
        ) : (
          <div className="products-grid container">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3 className="empty-state-title">
                  {query ? t('لا توجد نتائج للبحث', 'Aucun résultat trouvé') : t('لا توجد منتجات حتى الآن', 'Aucun produit pour le moment')}
                </h3>
                <p>{query ? t('جرب كلمة بحث مختلفة', 'Essayez un autre terme') : t('ابدأ بإضافة منتجات من لوحة التحكم', 'Commencez par ajouter des produits')}</p>
              </div>
            ) : (
              filtered.map(product => {
                const name = getName(product)
                const desc = getDesc(product)
                const isLongDesc = (desc || '').length > 120
                const displayDesc = isLongDesc ? desc.slice(0, 120) + '...' : desc
                const secondaryCount = parseSecondaryImages(product.secondary_images).length
                const mainImgUrl = getImageUrl(product.main_image)

                return (
                  <div key={product.$id} className="product-card" onClick={() => setSelected(product)}>
                    <div className="product-card-img-wrapper">
                      {mainImgUrl ? (
                        <img src={mainImgUrl} alt={name} className="product-card-img" loading="lazy" />
                      ) : (
                        <div className="product-card-img-placeholder">📦</div>
                      )}
                      {secondaryCount > 0 && (
                        <span className="img-count-badge">+{secondaryCount} {t('صور', 'photos')}</span>
                      )}
                    </div>
                    <div className="product-card-body">
                      <h3 className="product-card-name">
                        {highlightText(name || t('بدون اسم', 'Sans nom'), query)}
                      </h3>
                      {desc && (
                        <p className="product-card-desc">{highlightText(displayDesc, query)}</p>
                      )}
                    </div>
                    <div className="product-card-footer">
                      <span className="view-btn">
                        {t('عرض التفاصيل', 'Voir détails')}{dir === 'rtl' ? ' ←' : ' →'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {selected && (
          <ProductModal product={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </>
  )
}
