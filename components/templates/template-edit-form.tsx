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


export function TemplateEditForm({ template }: TemplateEditFormProps) {
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

      if (!response.ok) throw new Error('Failed to update template');

      const updatedTemplate = await response.json();
      router.push(`/templates/${updatedTemplate.id}`);
      router.refresh();
      toast.success('Template updated successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label>Cover Image(Optional)</Label>
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
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title && (
            <ErrorMsg message={form.formState.errors.title.message} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
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
            <span>Make this template public</span>
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
            <h3 className="text-lg font-medium">Form Fields</h3>
            
          </div>

          {fields.map((field, index) => {
            const typeError = form.formState.errors.templateFields?.[index]?.type;
            return (
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
                    {...form.register(`templateFields.${index}.type` as const)}
                    className="w-full p-2 border rounded dark:bg-accent dark:text-white"
                  >
                    {Object.values(FieldType).map((type) => (
                      <option key={type} value={type}>
                        {type}
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
                  <Label>Title</Label>
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
                  <Label>Description</Label>
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
                    <span>Required</span>
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register(`templateFields.${index}.showInResults`)}
                      className="h-4 w-4"
                    />
                    <span>Show in Results</span>
                  </Label>
                </div>
              </Card>
            );
          })}

          {form.formState.errors.templateFields?.length === 0 && (
            <ErrorMsg message="At least one field is required" />
          )}
        </div>
        <div className='flex flex-col justify-between items-center gap-4 md:flex-row'>
            <Button type="button" className='w-1/2' onClick={addField}>
                Add Field
            </Button>
            <Button type="submit" className="w-1/2">
            Update Template
            </Button>
        </div>
      </form>
    </Card>
  );
}