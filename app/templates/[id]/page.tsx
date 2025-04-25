'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Template {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  templateFields: TemplateField[];
  topic?: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  _count?: {
    likes: number;
    comments: number;
    submissions: number;
  };
}

interface TemplateField {
  id: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  showInResults: boolean;
  order: number;
}

export default function TemplateResults() {
  const { id } = useParams();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Template not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 max-w-3xl mx-auto rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{template.title}</h1>
          {template.description && (
            <p className="text-gray-600">{template.description}</p>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Created by:</span>
              <span className="font-medium">{template.owner.name || 'Anonymous'}</span>
            </div>
            {template.topic && (
              <div className="flex items-center gap-2">
                <span>Topic:</span>
                <span className="font-medium">{template.topic.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Template Fields</h2>
          <div className="space-y-4">
            {template.templateFields.map((field) => (
              <div key={field.id} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{field.title}</h3>
                {field.description && (
                  <p className="text-gray-600 text-sm mb-2">{field.description}</p>
                )}
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Type: {field.type}</span>
                  <span>{field.required ? 'Required' : 'Optional'}</span>
                  <span>
                    {field.showInResults ? 'Shown in results' : 'Hidden in results'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {template._count && (
          <div className="flex gap-4 text-sm text-gray-600">
            <span>{template._count.submissions} submissions</span>
            <span>{template._count.likes} likes</span>
            <span>{template._count.comments} comments</span>
          </div>
        )}
      </div>
    </div>
  );
}