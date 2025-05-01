'use client'
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldType } from '@prisma/client';

interface FieldSubmission {
  id: string;
  templateFieldId: string;
  valueString: string | null;
  valueInteger: number | null;
  valueBoolean: boolean | null;
//   createdAt : string;
  }

// interface Submission {
//   id: string;
//   templateId: string;
//   createdAt: string;
//   fieldSubmissions: FieldSubmission[];
// }

interface TemplateField {
  id: string;
  title: string;
  type: FieldType;
}

export default function ViewSubmissionPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  const router = useRouter();
  const [submission, setSubmission] = useState<FieldSubmission[]>([]);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!submissionId || !id) {
          throw new Error('Submission ID and Template ID are required');
        }

        // Fetch template fields
        const templateResponse = await fetch(`/api/templates/${id}`);
        if (!templateResponse.ok) {
          throw new Error('Failed to fetch template fields');
        }
        const templateData = await templateResponse.json();
        const templateFields = templateData.templateFields;
        console.log(templateData)
        console.log(templateFields)
        
        setTemplateFields(templateFields);

        // Fetch submission data
        const submissionResponse = await fetch(`/api/submissions/user/single?submissionId=${submissionId}`);
        if (!submissionResponse.ok) {
          throw new Error('Failed to fetch submission');
        }
        const submissionData = await submissionResponse.json();
        const submissionFields = submissionData.fieldSubmissions;
        console.log(submissionData)
        console.log(submissionFields);
        setSubmission(submissionFields);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId, id]);

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
  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Submission not found</div>
      </div>
    );
  }

  // Format date for display
  //const formattedDate = new Date(submission.createdAt).toLocaleString();

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Submission Details</h1>
            {/* <p className="text-gray-600 dark:text-gray-300">Submitted on: {formattedDate}</p> */}
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/templates/${id}`)}
          >
            Back to Template
          </Button>
        </div>
        
        <Card className="p-6">
          <div className="space-y-6">
            {templateFields.map((field) => {
              const fieldSubmission = submission.find(
                (fs) => fs.templateFieldId === field.id
              );

              return (
                <div key={field.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{field.title}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Question Type: {field.type.toLowerCase()}
                    </div>
                  </div>
                  
                  {field.type === FieldType.STRING && (
                    <p>{fieldSubmission?.valueString || 'No value provided'}</p>
                  )}
                  
                  {field.type === FieldType.TEXT && (
                    <p className="whitespace-pre-wrap">{fieldSubmission?.valueString || 'No value provided'}</p>
                  )}
                  
                  {field.type === FieldType.INTEGER && (
                    <p>{fieldSubmission?.valueInteger !== null ? fieldSubmission?.valueInteger : 'No value provided'}</p>
                  )}
                  
                  {field.type === FieldType.CHECKBOX && (
                    <p>{fieldSubmission?.valueBoolean ? 'Yes' : 'No'}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}