'use client'
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldType } from '@prisma/client';
import type { Template } from '@/types/template';

interface Submission {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  fieldSubmissions: Array<{
    id: string;
    valueString: string | null;
    valueInteger: number | null;
    valueBoolean: boolean | null;
    field: {
      id: string;
      title: string;
      type: FieldType;
      showInResults: boolean;
    };
  }>;
}

export default function TemplateSubmissionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch template details
        const templateResponse = await fetch(`/api/templates/${id}`);
        if (!templateResponse.ok) {
          throw new Error('Failed to fetch template');
        }
        const templateData = await templateResponse.json();
        setTemplate(templateData);

        // Fetch submissions for this template
        const submissionsResponse = await fetch(`/api/submissions?templateId=${id}`);
        if (!submissionsResponse.ok) {
          throw new Error('Failed to fetch submissions');
        }
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Helper function to render field value based on type
  const renderFieldValue = (submission: Submission, fieldId: string) => {
    const fieldSubmission = submission.fieldSubmissions.find(
      fs => fs.field.id === fieldId
    );

    if (!fieldSubmission) return 'N/A';

    switch (fieldSubmission.field.type) {
      case FieldType.CHECKBOX:
        return fieldSubmission.valueBoolean ? 'Yes' : 'No';
      case FieldType.INTEGER:
        return fieldSubmission.valueInteger?.toString() || 'N/A';
      case FieldType.STRING:
      case FieldType.TEXT:
      default:
        return fieldSubmission.valueString || 'N/A';
    }
  };

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

  // Filter fields to only show those marked as showInResults
  const visibleFields = template.templateFields.filter(field => field.showInResults);

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Submissions for {template.title}</h1>
          <div className="space-x-2">
            <Button onClick={() => router.push(`/templates/${id}`)}>
              Back to Template
            </Button>
            <Button onClick={() => router.push(`/templates/${id}/submit`)}>
              Add Submission
            </Button>
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push(`/templates/${id}/submit`)}
            >
              Create First Submission
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total submissions: {submissions.length}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="p-3 text-left">Submitted By</th>
                    <th className="p-3 text-left">Date</th>
                    {visibleFields.map(field => (
                      <th key={field.id} className="p-3 text-left">{field.title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(submission => (
                    <tr key={submission.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          {submission.user.avatarUrl && (
                            <img 
                              src={submission.user.avatarUrl} 
                              alt={submission.user.name || 'User'} 
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span>{submission.user.name || submission.user.email}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      {visibleFields.map(field => (
                        <td key={field.id} className="p-3">
                          {renderFieldValue(submission, field.id || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}