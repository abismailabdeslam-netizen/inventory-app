import { Client, Databases, Storage, ID, Query } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'placeholder')

export const databases = new Databases(client)
export const storage = new Storage(client)

export const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'inventory'
export const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || 'products'
export const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'product-images'

export { ID, Query }

export type Product = {
  $id: string
  name_ar: string
  name_fr: string
  description_ar: string
  description_fr: string
  main_image: string
  secondary_images: string   // stored as JSON string in Appwrite
  $createdAt: string
  $updatedAt: string
}

// Helper to parse secondary_images safely
export function parseSecondaryImages(val: string | string[] | null | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return [] }
}
