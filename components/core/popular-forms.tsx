'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface Form {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  submissionCount: number;
}

interface FormCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  submissionCount: number;
}

const PLACEHOLDER_COLORS = [
  'bg-blue-100 dark:bg-blue-900',
  'bg-purple-100 dark:bg-purple-900',
  'bg-pink-100 dark:bg-pink-900',
  'bg-green-100 dark:bg-green-900',
  'bg-orange-100 dark:bg-orange-900',
];

const FormCard = ({ id, title, description, imageUrl, submissionCount }: FormCardProps) => {
  const randomColor = PLACEHOLDER_COLORS[Math.floor(Math.random() * PLACEHOLDER_COLORS.length)];

  return (
    <Link href={`/templates/${id}`}>
      <Card className="aspect-[4/3] overflow-hidden hover:border-primary/50 transition-colors relative">
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="font-medium">
            {submissionCount} {submissionCount === 1 ? 'submission' : 'submissions'}
          </Badge>
        </div>
        <div className="h-3/4 w-full overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full ${randomColor} flex items-center justify-center`}>
              <span className="text-2xl font-medium text-foreground/70">{title[0].toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm truncate">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{description}</p>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default function PopularForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch('/api/templates?limit=10&sort=popular');
        if (!response.ok) throw new Error('Failed to fetch forms');
        const data = await response.json();
        setForms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch forms');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForms();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-2">
      {isLoading ? (
          <>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse">
              <Card className="h-full">
                <div className="h-3/4 w-full bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </Card>
            </div>
          ))}
        </>
      ) : (
        forms.map((form) => (
          <FormCard
            key={form.id}
            id={form.id}
            title={form.title}
            description={form.description}
            imageUrl={form.imageUrl}
            submissionCount={form.submissionCount}
          />
        ))
      )}
    </div>
  );
}