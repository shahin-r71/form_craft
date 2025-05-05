'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldType } from '@prisma/client';
import { TopicSelector } from './topic-selector';
import { TagSelector } from './tag-selector';
import { UserSelector } from './user-selector';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Resolver } from 'react-hook-form'
import type { FieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import { createTemplateSchema, type CreateTemplateInput } from '@/lib/validations/template';
import ErrorMsg from '@/components/chore/ErrorMsg';
import CoverImage from '@/components/templates/cover-image';
import { useTranslations } from 'next-intl';

export function TemplateForm() {
  const t = useTranslations('TemplateEditForm'); // Using TemplateEditForm keys as they are similar
  const router = useRouter();

  const form = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema) as Resolver<
        CreateTemplateInput,
        any
        >,
    defaultValues: {
      title: '',
      description: '',
      isPublic: true,
      topicId: null,
      templateFields: [],
      imageUrl: null,
      templateTags: [],
      accessGrants: []
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

  const onSubmit = async (data: CreateTemplateInput) => {
    console.log('Form data:', data);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(error)
        throw new Error(error.message || t('errorFailedToCreate')); // Use translation
      }

      const template = await response.json();
      console.log('Template created:', template);
      router.push(`/templates/${template.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating template:', error);
      // Use translated error message
      alert(error instanceof Error ? error.message : t('errorFailedToCreate')); // Use translation
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label>{t('coverImageLabel')}</Label>
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
          <Label htmlFor="title">{t('titleLabel')}</Label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title && (
            <ErrorMsg message={form.formState.errors.title.message} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('descriptionLabel')}</Label>
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
          onTagsChange={(templateTags) => form.setValue("templateTags", templateTags, {
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
            <span>{t('makePublicLabel')}</span>
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
          <h3 className="text-lg font-medium">{t('formFieldsTitle')}</h3>

          {fields.map((field, index) => {
            const typeError = form.formState.errors.templateFields?.[index]?.type;
            return (
              <Card key={field.id} className="p-4 space-y-4">
                <div className="flex justify-between">
                  <h4 className="font-medium">{t('fieldLabel', { index: index + 1 })}</h4>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    {t('removeButton')}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t('typeLabel')}</Label>
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
                  <Label>{t('titleLabel')}</Label>
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
                  <Label>{t('descriptionLabel')}</Label>
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
                    <span>{t('requiredLabel')}</span>
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register(`templateFields.${index}.showInResults`)}
                      className="h-4 w-4"
                    />
                    <span>{t('showInResultsLabel')}</span>
                  </Label>
                </div>
              </Card>
            );
          })}

          <Button type="button" onClick={addField}>
            {t('addFieldButton')}
          </Button>
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('creatingTemplateButton') : t('createTemplateButton')}
        </Button>
      </form>
    </Card>
  );
}