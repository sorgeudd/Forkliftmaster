import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <Button
      variant="ghost"
      onClick={() => setLanguage(language === 'en' ? 'sv' : 'en')}
      className="w-16"
    >
      {language.toUpperCase()}
    </Button>
  );
}
