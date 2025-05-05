'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl'; // Import useTranslations

interface TemplateActionsProps {
  templateId: string;
  ownerId: string;
  currentUserId: string;
}

export function TemplateActions({ templateId, ownerId, currentUserId }: TemplateActionsProps) {
  const t = useTranslations('TemplateActions'); // Initialize translations
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/templates/${templateId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) return; // Use translation

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(t('errorDeleteFailed')); // Use translation

      router.push('/templates');
      router.refresh();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(t('errorDeleteFailed')); // Use translation
    } finally {
      setIsDeleting(false);
    }
  };

  if (ownerId !== currentUserId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">{t('openMenu')}</span> {/* Use translation */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          {t('editAction')} {/* Use translation */}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          {isDeleting ? t('deletingState') : t('deleteAction')} {/* Use translation */}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}