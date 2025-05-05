'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import type { FieldError } from 'react-hook-form';
import { FieldType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TopicSelector } from '@/components/templates/topic-selector';
import { TagSelector } from '@/components/templates/tag-selector';
import { UserSelector } from '@/components/templates/user-selector';
import CoverImage from '@/components/templates/cover-image';
import ErrorMsg from '@/components/chore/ErrorMsg';
import { TemplateEditFormProps } from '@/types/template';
import { updateTemplateSchema, type UpdateTemplateInput } from '@/lib/validations/template';
import { toast } from 'react-toastify'
import { useTranslations } from 'next-intl'; // Import useTranslations


export function TemplateEditForm({ template }: TemplateEditFormProps) {
  const t = useTranslations('TemplateEditForm'); // Initialize translations
  const router = useRouter();

  const form = useForm<UpdateTemplateInput>({
    resolver: zodResolver(updateTemplateSchema) as Resolver<UpdateTemplateInput, any>,
    defaultValues: {
      title: template.title,
      description: template.description,
      isPublic: template.isPublic,
      topicId: template.topicId,
      imageUrl: template.imageUrl,
      templateTags: template.templateTags || [],
      accessGrants: template.accessGrants || [],
      templateFields: template.templateFields.map(field => ({
        id: field.id,
        type: field.type as "STRING" | "TEXT" | "INTEGER" | "CHECKBOX",
        title: field.title,
        description: field.description,
        required: field.required,
        showInResults: field.showInResults
      }))
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'templateFields'
  });

  const addField = () => {
    append({
      type: FieldType.STRING,
      title: '',
      description: '',
      required: false,
      showInResults: true
    });
  };

  const onSubmit = async (data: UpdateTemplateInput) => {
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(t('errorFailedToUpdate')); // Use translation

      const updatedTemplate = await response.json();
      router.push(`/templates/${updatedTemplate.id}`);
      router.refresh();
      toast.success(t('templateUpdatedSuccess')); // Use translation
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error(t('errorFailedToUpdate')); // Use translation
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label>{t('coverImageLabel')}</Label> {/* Use translation */}
          <CoverImage
            value={form.watch("imageUrl")}
            onChange={(url: string | null) =>
              form.setValue("imageUrl", url, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
          {form.formState.errors.imageUrl && (
            <ErrorMsg message={form.formState.errors.imageUrl.message} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{t('titleLabel')}</Label> {/* Use translation */}
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title && (
            <ErrorMsg message={form.formState.errors.title.message} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('descriptionLabel')}</Label> {/* Use translation */}
          <Input id="description" {...form.register("description")} />
          {form.formState.errors.description && (
            <ErrorMsg message={form.formState.errors.description.message} />
          )}
        </div>

        <div className="space-y-2">
          <TopicSelector
            value={form.watch("topicId") || ""}
            onChange={(value) => form.setValue("topicId", value)}
          />
          {form.formState.errors.topicId && (
            <ErrorMsg message={form.formState.errors.topicId.message} />
          )}
        </div>

        <TagSelector
          selectedTags={form.watch("templateTags") || []}
          onTagsChange={(tags) => form.setValue("templateTags", tags, {
            shouldValidate: true,
            shouldDirty: true
          })}
        />

        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...form.register("isPublic")}
              className="h-4 w-4"
            />
            <span>{t('makePublicLabel')}</span> {/* Use translation */}
          </Label>
        </div>

        {!form.watch("isPublic") && (
          <UserSelector
            selectedUsers={form.watch("accessGrants") || []}
            onUsersChange={(users) => form.setValue("accessGrants", users, {
              shouldValidate: true,
              shouldDirty: true
            })}
          />
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{t('formFieldsTitle')}</h3> {/* Use translation */}
            
          </div>

          {fields.map((field, index) => {
            const typeError = form.formState.errors.templateFields?.[index]?.type;
            return (
              <Card key={field.id} className="p-4 space-y-4">
                <div className="flex justify-between">
                  <h4 className="font-medium">{t('fieldLabel', { index: index + 1 })}</h4> {/* Use translation */}
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    {t('removeButton')} {/* Use translation */}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t('typeLabel')}</Label> {/* Use translation */}
                  <select
                    {...form.register(`templateFields.${index}.type` as const)}
                    className="w-full p-2 border rounded dark:bg-accent dark:text-white"
                  >
                    {Object.values(FieldType).map((type) => (
                      <option key={type} value={type}>
                        {type} {/* Assuming FieldType enum values are user-friendly */}
                      </option>
                    ))}
                  </select>
                  {typeError &&
                    typeof typeError === "object" &&
                    "message" in typeError && (
                      <ErrorMsg message={(typeError as FieldError).message} />
                    )}
                </div>

                <div className="space-y-2">
                  <Label>{t('titleLabel')}</Label> {/* Use translation */}
                  <Input {...form.register(`templateFields.${index}.title`)} />
                  {form.formState.errors.templateFields?.[index]?.title && (
                    <ErrorMsg
                      message={
                        form.formState.errors.templateFields[index].title?.message
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('descriptionLabel')}</Label> {/* Use translation */}
                  <Input {...form.register(`templateFields.${index}.description`)} />
                  {form.formState.errors.templateFields?.[index]?.description && (
                    <ErrorMsg
                      message={
                        form.formState.errors.templateFields[index].description?.message
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register(`templateFields.${index}.required`)}
                      className="h-4 w-4"
                    />
                    <span>{t('requiredLabel')}</span> {/* Use translation */}
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register(`templateFields.${index}.showInResults`)}
                      className="h-4 w-4"
                    />
                    <span>{t('showInResultsLabel')}</span> {/* Use translation */}
                  </Label>
                </div>
              </Card>
            );
          })}

          {form.formState.errors.templateFields?.root && (
            <ErrorMsg message={t('atLeastOneFieldRequired')} /> /* Use translation */
          )}
        </div>
        <div className='flex flex-col justify-between items-center gap-4 md:flex-row'>
            <Button type="button" className='w-1/2' onClick={addField}>
                {t('addFieldButton')} {/* Use translation */}
            </Button>
            <Button type="submit" className="w-1/2" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t('updatingTemplateButton') : t('updateTemplateButton')} {/* Use translation */}
            </Button>
        </div>
      </form>
    </Card>
  );
}