import { FieldType } from '@prisma/client';

export interface Template {
  id: string;
  title: string;
  description?: string | null;
  isPublic: boolean | true;
  imageUrl: string | null;
  topicId?: string | null;
  topic?: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  templateFields: Array<TemplateField>;
  templateTags?: Array<string>;
  accessGrants?: Array<string>;
  _count?: {
    likes: number;
    comments: number;
    submissions: number;
  };
}


interface TemplateField {
  id?: string;
  type: FieldType;
  title: string;
  description?: string;
  required?: boolean;
  showInResults: boolean;
  order: number;
}

export interface TemplateEditFormProps {
  template: Template;
}