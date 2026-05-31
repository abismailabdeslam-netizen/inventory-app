import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { LangProvider } from '../lib/LangContext'
import { AuthProvider } from '../lib/AuthContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LangProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </LangProvider>
  )
}
