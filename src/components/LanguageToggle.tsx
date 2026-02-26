import { useLanguage } from "../context/LanguageContext";

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 px-4 bg-gray-200 text-xs sm:text-sm font-semibold 
                           rounded-lg shadow-lg hover:shadow-gray-100/50
                           hover:scale-105 active:scale-95 
                           transition-all duration-300 ease-in-out"
    >
      {language === "ar" ? "English" : "العربية"
      }
    </button >
  );
}
