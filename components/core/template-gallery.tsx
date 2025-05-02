'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

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
  createdAt: string;
}


const TemplateCard = ({ id, title, description, imageUrl,createdAt }: Template) => {
  const randomColor = PLACEHOLDER_COLORS[Math.floor(Math.random() * PLACEHOLDER_COLORS.length)];

  return (
    <Link href={`/templates/${id}`}>
      <Card className="aspect-[4/3] overflow-hidden hover:border-primary/50 transition-colors py-0 relative">
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="font-medium">
            {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric',year: 'numeric' })}
          </Badge>
        </div>
        <div className="h-3/4 w-full overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full ${randomColor} flex items-center justify-center`}>
              <span className="text-2xl font-medium text-foreground/70"></span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm truncate">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{description}</p>
          )}
          {!description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">go to the form page for more info</p>
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

      {isLoading ? (
        <>
         {
          [...Array(5)].map((_, i) => (
             <div key={i} className="flex flex-col w-[200px] space-y-3 bg-white rounded-md dark:bg-background p-1">
              <Skeleton className="h-[125px] w-[190px] rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[190px]" />
                <Skeleton className="h-4 w-[190px]" />
              </div>
            </div>
      
          ))
         }
        </>
      ) : ( 
        <>       
        <Link href="/templates/create">
          <Card className="aspect-[4/3] overflow-hidden hover:border-primary/50 transition-colors group">
            <div className="h-3/4 w-full flex items-center justify-center">
              <Plus className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="font-medium text-center text-sm">Start a blank form</h3>
              {/* <p className="text-sm text-muted-foreground mt-1 truncate">Start with a blank template</p> */}
            </div>
          </Card>
        </Link>
        
         { templates.map((template) => (
          <TemplateCard
            key={template.id}
            id={template.id}
            title={template.title}
            description={template.description}
            imageUrl={template.imageUrl}
            createdAt={template.createdAt}
            />
          ))}
        </>
      )}        
    </div>
  );
}