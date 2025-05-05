import { TemplateForm } from '@/components/templates/template-form';
import { useTranslations } from 'next-intl';

export default function CreateTemplatePage() {
  const t = useTranslations('TemplateCreate');

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
        <TemplateForm />
      </div>
    </div>
  );
}