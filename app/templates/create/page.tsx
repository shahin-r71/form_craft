import { TemplateForm } from '@/components/forms/template-form';

export default function CreateTemplatePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Form Template</h1>
        <TemplateForm />
      </div>
    </div>
  );
}