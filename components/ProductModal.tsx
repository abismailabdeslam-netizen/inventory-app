import { useState, useEffect } from 'react'
import { Product, parseSecondaryImages } from '../lib/appwrite'
import { useLang } from '../lib/LangContext'
import { getImageUrl } from '../pages/index'

interface ProductModalProps {
  product: Product
  onClose: () => void
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { lang, t } = useLang()
  const name = lang === 'ar' ? product.name_ar : product.name_fr
  const desc = lang === 'ar' ? product.description_ar : product.description_fr

  const allImageIds = [
    ...(product.main_image ? [product.main_image] : []),
    ...parseSecondaryImages(product.secondary_images),
  ]
  const allImageUrls = allImageIds.map(getImageUrl)

  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => { setActiveIdx(0) }, [product])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h2 className="modal-title">{name || t('بدون اسم', 'Sans nom')}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {allImageUrls.length > 0 ? (
            <img src={allImageUrls[activeIdx]} alt={name} className="gallery-main" />
          ) : (
            <div className="gallery-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: 'var(--text-faint)' }}>
              📦
            </div>
          )}

          {allImageUrls.length > 1 && (
            <div className="gallery-thumbs">
              {allImageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className={`gallery-thumb ${activeIdx === i ? 'active' : ''}`}
                  onClick={() => setActiveIdx(i)}
                />
              ))}
            </div>
          )}

          {desc && <div className="modal-description">{desc}</div>}
        </div>
      </div>
    </div>
  )
}
