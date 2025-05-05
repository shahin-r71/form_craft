import PopularForms from "@/components/core/popular-forms";
import TemplateGallery from "@/components/core/template-gallery";
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('HomePage');

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="py-4 md:py-8 px-6 md:px-24 bg-gray-200 dark:bg-accent w-full">
        <h2 className="p-2 mb-4 font-semibold text-left w-full text-md md:text-2xl">{t('createNewFormTitle')}</h2>
        <TemplateGallery />
      </div>
      <div className="py-4 md:py-8 px-6 md:px-24 bg-gray-50 dark:bg-secondary w-full">
        <h2 className="p-2 mb-4 font-semibold text-left w-full text-md md:text-2xl">{t('popularFormsTitle')}</h2>
        <PopularForms />
      </div>
    </div>
  );
}
