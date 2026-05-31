import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { databases, storage, DB_ID, COLLECTION_ID, BUCKET_ID, ID, Product } from '../lib/appwrite'
import { useLang } from '../lib/LangContext'
import { getImageUrl } from '../pages/index'

interface ProductFormProps {
  product?: Product | null
  onSuccess: () => void
  onCancel: () => void
  showToast: (msg: string, type: 'success' | 'error') => void
}

interface ImageFile {
  file?: File
  preview: string
  fileId?: string
  isExisting?: boolean
}

export default function ProductForm({ product, onSuccess, onCancel, showToast }: ProductFormProps) {
  const { t, dir } = useLang()
  const isEdit = !!product

  const [nameAr, setNameAr] = useState(product?.name_ar || '')
  const [nameFr, setNameFr] = useState(product?.name_fr || '')
  const [descAr, setDescAr] = useState(product?.description_ar || '')
  const [descFr, setDescFr] = useState(product?.description_fr || '')
  const [saving, setSaving] = useState(false)

  const [mainImage, setMainImage] = useState<ImageFile | null>(
    product?.main_image
      ? { preview: getImageUrl(product.main_image), fileId: product.main_image, isExisting: true }
      : null
  )
  const [secondaryImages, setSecondaryImages] = useState<ImageFile[]>(
    (product?.secondary_images || []).map(fid => ({
      preview: getImageUrl(fid),
      fileId: fid,
      isExisting: true,
    }))
  )

  const onDropMain = useCallback((files: File[]) => {
    if (files[0]) setMainImage({ file: files[0], preview: URL.createObjectURL(files[0]) })
  }, [])

  const onDropSecondary = useCallback((files: File[]) => {
    setSecondaryImages(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))])
  }, [])

  const { getRootProps: getMainProps, getInputProps: getMainInput, isDragActive: isMainDrag } = useDropzone({
    onDrop: onDropMain, accept: { 'image/*': [] }, maxFiles: 1,
  })
  const { getRootProps: getSecProps, getInputProps: getSecInput, isDragActive: isSecDrag } = useDropzone({
    onDrop: onDropSecondary, accept: { 'image/*': [] },
  })

  const uploadFile = async (img: ImageFile): Promise<string> => {
    if (img.isExisting && img.fileId) return img.fileId
    if (!img.file) return ''
    const res = await storage.createFile(BUCKET_ID, ID.unique(), img.file)
    return res.$id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameAr.trim() && !nameFr.trim()) {
      showToast(t('الرجاء إدخال اسم المنتج', 'Veuillez saisir le nom du produit'), 'error')
      return
    }
    setSaving(true)
    try {
      let mainFileId = ''
      if (mainImage) mainFileId = await uploadFile(mainImage)

      const secFileIds: string[] = []
      for (const img of secondaryImages) {
        const fid = await uploadFile(img)
        if (fid) secFileIds.push(fid)
      }

      const payload = {
        name_ar: nameAr,
        name_fr: nameFr,
        description_ar: descAr,
        description_fr: descFr,
        main_image: mainFileId,
        secondary_images: secFileIds,
      }

      if (isEdit && product) {
        await databases.updateDocument(DB_ID, COLLECTION_ID, product.$id, payload)
        showToast(t('تم تحديث المنتج بنجاح', 'Produit mis à jour avec succès'), 'success')
      } else {
        await databases.createDocument(DB_ID, COLLECTION_ID, ID.unique(), payload)
        showToast(t('تمت إضافة المنتج بنجاح', 'Produit ajouté avec succès'), 'success')
      }
      onSuccess()
    } catch (err) {
      console.error(err)
      showToast(t('حدث خطأ، حاول مرة أخرى', 'Une erreur est survenue'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal" dir={dir} style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? t('تعديل المنتج', 'Modifier le produit') : t('إضافة منتج جديد', 'Ajouter un produit')}
          </h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('الاسم بالعربية', 'Nom en arabe')}</label>
                <input className="form-input" value={nameAr} onChange={e => setNameAr(e.target.value)}
                  placeholder={t('مثال: لوحة غسالة سامسونج', 'Ex: Carte lave-linge Samsung')} dir="rtl" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('الاسم بالفرنسية', 'Nom en français')}</label>
                <input className="form-input" value={nameFr} onChange={e => setNameFr(e.target.value)}
                  placeholder="Ex: Carte Samsung Lavomatic" dir="ltr" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('الوصف بالعربية', 'Description en arabe')}</label>
                <textarea className="form-textarea" value={descAr} onChange={e => setDescAr(e.target.value)}
                  placeholder={t('وصف المنتج، المواصفات، التوافق...', 'Description, spécifications...')} dir="rtl" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('الوصف بالفرنسية', 'Description en français')}</label>
                <textarea className="form-textarea" value={descFr} onChange={e => setDescFr(e.target.value)}
                  placeholder="Description, spécifications, compatibilité..." dir="ltr" />
              </div>
            </div>

            {/* Main image */}
            <div className="form-group">
              <label className="form-label">{t('الصورة الرئيسية', 'Image principale')}</label>
              {mainImage ? (
                <div className="image-preview-grid">
                  <div className="image-preview-item" style={{ width: 120, height: 120 }}>
                    <img src={mainImage.preview} alt="main" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                    <span className="image-preview-badge">{t('رئيسية', 'Principal')}</span>
                    <button type="button" className="image-preview-remove" onClick={() => setMainImage(null)}>✕</button>
                  </div>
                  <div {...getMainProps()} className={`dropzone ${isMainDrag ? 'active' : ''}`} style={{ flex: 1, padding: 16, minHeight: 80 }}>
                    <input {...getMainInput()} />
                    <div className="dropzone-icon" style={{ fontSize: 24 }}>🔄</div>
                    <div className="dropzone-text" style={{ fontSize: 12 }}>{t('اسحب لتغيير الصورة', 'Glisser pour changer')}</div>
                  </div>
                </div>
              ) : (
                <div {...getMainProps()} className={`dropzone ${isMainDrag ? 'active' : ''}`}>
                  <input {...getMainInput()} />
                  <div className="dropzone-icon">🖼️</div>
                  <div className="dropzone-text">{t('اسحب الصورة هنا أو اضغط للاختيار', "Glissez l'image ici ou cliquez pour sélectionner")}</div>
                </div>
              )}
            </div>

            {/* Secondary images */}
            <div className="form-group">
              <label className="form-label">
                {t('صور إضافية', 'Images supplémentaires')}
                {secondaryImages.length > 0 && (
                  <span style={{ color: 'var(--accent)', margin: '0 8px', fontWeight: 400, textTransform: 'none' }}>
                    ({secondaryImages.length})
                  </span>
                )}
              </label>
              <div {...getSecProps()} className={`dropzone ${isSecDrag ? 'active' : ''}`}>
                <input {...getSecInput()} />
                <div className="dropzone-icon">📎</div>
                <div className="dropzone-text">{t('يمكنك إضافة عدد غير محدود من الصور', "Vous pouvez ajouter un nombre illimité d'images")}</div>
              </div>
              {secondaryImages.length > 0 && (
                <div className="image-preview-grid" style={{ marginTop: 12 }}>
                  {secondaryImages.map((img, i) => (
                    <div key={i} className="image-preview-item">
                      <img src={img.preview} alt="" />
                      <button type="button" className="image-preview-remove"
                        onClick={() => setSecondaryImages(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                {t('إلغاء', 'Annuler')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? <><span className="spinner"></span> {t('جاري الحفظ...', 'Sauvegarde...')}</>
                  : isEdit ? t('حفظ التعديلات', 'Sauvegarder') : t('إضافة المنتج', 'Ajouter')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
