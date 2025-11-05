import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';
import LanguageSwitcher from './LanguageSwitcher';

export default function Layout() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      
      {/* Fixed Language Switcher Button */}
      <div className={`fixed bottom-6 z-50 ${isRTL ? 'right-6' : 'left-6'}`}>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
