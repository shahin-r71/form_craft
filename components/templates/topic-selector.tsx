'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

interface Topic {
  id: string;
  name: string;
}

interface TopicSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export function TopicSelector({ value, onChange }: TopicSelectorProps) {
  const t = useTranslations('TopicSelector');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/topics');
        if (!response.ok) throw new Error(t('errorFetchTopics'));
        const data = await response.json();
        setTopics(data);
      } catch (error) {
        console.error('Error fetching topics:', error); // Keep console log for debugging
        toast.error(t('errorFetchTopics'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="topic">{t('topicLabel')}</Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger id="topic">
          <SelectValue placeholder={t('selectPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {topics.map((topic) => (
            <SelectItem key={topic.id} value={topic.id}>
              {topic.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}