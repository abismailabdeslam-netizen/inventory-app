# إعداد Appwrite — دليل خطوة بخطوة

## 1. إنشاء حساب ومشروع
- اذهب إلى https://cloud.appwrite.io
- أنشئ حساباً ثم اضغط **Create Project**
- سمّ المشروع مثلاً: `inventory`
- انسخ **Project ID** من Settings > General

## 2. إنشاء قاعدة البيانات
- من القائمة الجانبية اختر **Databases**
- اضغط **Create Database**
  - Name: `inventory`
  - Database ID: `inventory`

## 3. إنشاء Collection
- داخل قاعدة البيانات اضغط **Create Collection**
  - Name: `products`
  - Collection ID: `products`

### أضف هذه الـ Attributes:
| Key | Type | Size | Required |
|-----|------|------|----------|
| name_ar | String | 255 | No |
| name_fr | String | 255 | No |
| description_ar | String | 5000 | No |
| description_fr | String | 5000 | No |
| main_image | String | 255 | No |
| secondary_images | String[] | 255 | No |

### Permissions (Collection):
- اضغط **Settings** داخل الـ Collection
- تحت **Permissions** أضف:
  - Role: `Any` → ✅ Read, Create, Update, Delete

## 4. إنشاء Storage Bucket
- من القائمة الجانبية اختر **Storage**
- اضغط **Create Bucket**
  - Name: `product-images`
  - Bucket ID: `product-images`
- تحت **Permissions** أضف:
  - Role: `Any` → ✅ Read, Create, Delete

## 5. ضبط متغيرات Vercel
في لوحة تحكم Vercel → Settings → Environment Variables أضف:

```
NEXT_PUBLIC_APPWRITE_ENDPOINT    = https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID  = (من Settings > General)
NEXT_PUBLIC_APPWRITE_DATABASE_ID = inventory
NEXT_PUBLIC_APPWRITE_COLLECTION_ID = products
NEXT_PUBLIC_APPWRITE_BUCKET_ID   = product-images
NEXT_PUBLIC_ADMIN_PASSWORD       = (كلمة مرور قوية)
```

## 6. رفع المشروع على GitHub
```bash
tar -xzf inventory-app.tar.gz
cd inventory-app
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## 7. ربط GitHub بـ Vercel
- اذهب إلى https://vercel.com
- اضغط **Add New Project**
- اختر الـ repo الذي رفعته
- أضف المتغيرات من الخطوة 5
- اضغط **Deploy** ✅
