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
import { useForm, useFieldArray } from 'react-hook-form';
import type { Resolver } from 'react-hook-form'
import type { FieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import { createTemplateSchema, type CreateTemplateInput } from '@/lib/validations/template';

export function TemplateForm() {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
      fields: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields'
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
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tags: selectedTags
        })
      });

      if (!response.ok) throw new Error('Failed to create template');

      const template = await response.json();
      router.push(`/templates/${template.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            {...form.register('title')}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            {...form.register('description')}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <TopicSelector
            value={form.watch('topicId') || ''}
            onChange={(value) => form.setValue('topicId', value)}
          />
          {form.formState.errors.topicId && (
            <p className="text-sm text-red-500">{form.formState.errors.topicId.message}</p>
          )}
        </div>

        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />

        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...form.register('isPublic')}
              className="h-4 w-4"
            />
            <span>Make this template public</span>
          </Label>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Form Fields</h3>

          {fields.map((field, index) =>{
            const typeError = form.formState.errors.fields?.[index]?.type;
            return(
                <Card key={field.id} className="p-4 space-y-4">
                    <div className="flex justify-between">
                        <h4 className="font-medium">Field {index + 1}</h4>
                        <Button
                        type="button"
                        variant="destructive"
                        onClick={() => remove(index)}
                        >
                        Remove
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Type</Label>
                        <select
                        {...form.register(`fields.${index}.type` as const)}
                        className="w-full p-2 border rounded dark:bg-accent dark:text-white"
                        >
                        {Object.values(FieldType).map((type) => (
                            <option key={type} value={type}>
                            {type}
                            </option>
                        ))}
                        </select>
                        {/* {form.formState.errors.fields?.[index]?.type && (
                        <p className="text-sm text-red-500">{form.formState.errors.fields[index]?.type?.message)}</p>// TODO: fix this
                        )} */}
                        {typeError && typeof typeError === 'object' && 'message' in typeError && (
                            <p className="text-sm text-red-500">
                                {(typeError as FieldError).message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                        {...form.register(`fields.${index}.title`)}
                        />
                        {form.formState.errors.fields?.[index]?.title && (
                        <p className="text-sm text-red-500">{form.formState.errors.fields[index]?.title?.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                        {...form.register(`fields.${index}.description`)}
                        />
                        {form.formState.errors.fields?.[index]?.description && (
                        <p className="text-sm text-red-500">{form.formState.errors.fields[index]?.description?.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            {...form.register(`fields.${index}.required`)}
                            className="h-4 w-4"
                        />
                        <span>Required field</span>
                        </Label>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            {...form.register(`fields.${index}.showInResults`)}
                            className="h-4 w-4"
                        />
                        <span>Show in results</span>
                        </Label>
                    </div>
                </Card>
            )
          } 
          )}
          {form.formState.errors.fields?.message && (
            <p className="text-sm text-red-500">{form.formState.errors.fields.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-4 items-center mt-8">
          <Button 
            type="button" 
            onClick={addField} 
            className="w-full max-w-xs" 
            variant="outline"
          >
            Add New Field
          </Button>
          
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
            className="w-full max-w-xs"
          >
            {form.formState.isSubmitting ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Card>
  );
}