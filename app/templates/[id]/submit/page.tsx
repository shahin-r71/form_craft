'use client'
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { Template } from '@/types/template';
import { FieldType } from '@prisma/client';
import { submissionValidationSchema } from '@/lib/validations/submission';

export default function SubmitTemplatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/templates/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch template');
        }
        const data = await response.json();
        setTemplate(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTemplate();
    }
  }, [id]);



  // Create form once template is loaded
  const form = useForm<any>({
    resolver: template ? zodResolver(submissionValidationSchema(template)) : undefined,
    defaultValues: template?.templateFields.reduce((acc, field) => {
      acc[`${field.id}`] = field.type === FieldType.CHECKBOX ? false : '';
      return acc;
    }, {} as Record<string, any>) || {},
  });

  const onSubmit = async (data: any) => {
    if (!template) return;
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Transform the data to match the expected API format
      const fieldSubmissions = Object.entries(data).map(([key, value]) => {
        const fieldId = key;
        const field = template.templateFields.find(f => f.id === fieldId);
        
        if (!field) return null;
        
        let valueToSubmit: any = {
          templateFieldId: fieldId,
        };
        
        // Set the appropriate value based on field type
        switch (field.type) {
          case FieldType.INTEGER:
            valueToSubmit.valueInteger = parseInt(value as string);
            break;
          case FieldType.CHECKBOX:
            valueToSubmit.valueBoolean = value as boolean;
            break;
          case FieldType.STRING:
          case FieldType.TEXT:
          default:
            valueToSubmit.valueString = value as string;
            break;
        }
        
        return valueToSubmit;
      }).filter(Boolean);
      
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          fieldSubmissions,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }
      
      // Redirect to a success page or template details
      router.push(`/templates/${template.id}?submitted=true`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Render not found state
  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Template not found</div>
      </div>
    );
  }

  // Render the form
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{template.title}</h1>
        {template.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-6">{template.description}</p>
        )}
        
        <Card className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {template.templateFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="font-medium">
                  {field.title}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {field.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
                )}
                
                {field.type === FieldType.STRING && (
                  <Input
                    id={field.id}
                    {...form.register(field.id ||"" )}
                    placeholder={field.description || ''}
                  />
                )}
                
                {field.type === FieldType.TEXT && (
                  <Textarea
                    id={field.id}
                    {...form.register(field.id ||"")}
                    placeholder={field.description || ''}
                    rows={4}
                  />
                )}
                
                {field.type === FieldType.INTEGER && (
                  <Input
                    id={field.id}
                    type="number"
                    {...form.register(field.id ||"")}
                    placeholder={field.description || ''}
                  />
                )}
                
                {field.type === FieldType.CHECKBOX && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      {...form.register(field.id ||"")}
                    />
                    <Label htmlFor={field.id} className="font-normal">
                      {field.description || 'Yes'}
                    </Label>
                  </div>
                )}
                
                {form.formState.errors[field.id ||""] && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors[field.id ||""]?.message as string}
                  </p>
                )}
              </div>
            ))}
            
            {submitError && (
              <div className="p-3 bg-red-100 border border-red-200 rounded text-red-700">
                {submitError}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}