'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const PLACEHOLDER_COLORS = [
  'bg-blue-100 dark:bg-blue-900',
  'bg-purple-100 dark:bg-purple-900',
  'bg-pink-100 dark:bg-pink-900',
  'bg-green-100 dark:bg-green-900',
  'bg-orange-100 dark:bg-orange-900',
];

interface Template {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

interface TemplateCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

const TemplateCard = ({ id, title, description, imageUrl }: TemplateCardProps) => {
  const randomColor = PLACEHOLDER_COLORS[Math.floor(Math.random() * PLACEHOLDER_COLORS.length)];

  return (
    <Link href={`/templates/${id}`}>
      <Card className="aspect-[4/3] overflow-hidden hover:border-primary/50 transition-colors py-0">
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

export default function TemplateGallery() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates?limit=4&sort=latest');
        if (!response.ok) throw new Error('Failed to fetch templates');
        const data = await response.json();
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch templates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-2">
      <Link href="/templates/create">
        <Card className="aspect-[4/3] overflow-hidden hover:border-primary/50 transition-colors group">
          <div className="h-3/4 w-full flex items-center justify-center">
            <Plus className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="p-4">
            <h3 className="font-medium text-center text-sm">Start a blank form</h3>
            {/* <p className="text-sm text-muted-foreground mt-1 truncate">Start with a blank template</p> */}
          </div>
        </Card>
      </Link>

      {isLoading ? (
        <>
          {[...Array(5)].map((_, i) => (
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
        templates.map((template) => (
          <TemplateCard
            key={template.id}
            id={template.id}
            title={template.title}
            description={template.description}
            imageUrl={template.imageUrl}
          />
        ))
      )}
    </div>
  );
}