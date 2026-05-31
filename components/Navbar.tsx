import { useLang } from '../lib/LangContext'
import { useAuth } from '../lib/AuthContext'
import { useRouter } from 'next/router'

export default function Navbar() {
  const { lang, setLang, t } = useLang()
  const { isAdmin, logout } = useAuth()
  const router = useRouter()

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">م</div>
        <span className="navbar-title">
          {t('إدارة المخزون', 'Gestion de Stock')}
        </span>
      </div>

      <div className="navbar-right">
        <div className="lang-toggle">
          <button
            className={`lang-btn ${lang === 'ar' ? 'active' : ''}`}
            onClick={() => setLang('ar')}
          >
            عربي
          </button>
          <button
            className={`lang-btn ${lang === 'fr' ? 'active' : ''}`}
            onClick={() => setLang('fr')}
          >
            FR
          </button>
        </div>

        {isAdmin ? (
          <>
            <button
              className={`admin-btn active`}
              onClick={() => router.push('/admin')}
            >
              ⚙ {t('لوحة التحكم', 'Administration')}
            </button>
            <button className="admin-btn" onClick={() => { logout(); router.push('/') }}>
              {t('خروج', 'Déconnexion')}
            </button>
          </>
        ) : (
          <button
            className="admin-btn"
            onClick={() => router.push('/admin')}
          >
            🔐 {t('دخول المشرف', 'Accès Admin')}
          </button>
        )}
      </div>
    </nav>
  )
}
