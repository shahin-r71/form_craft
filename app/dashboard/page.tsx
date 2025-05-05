'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Template } from '@/types/template';
import { useTranslations, useFormatter } from 'next-intl';


interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

interface Submission {
  id: string;
  templateId: string;
  createdAt: string;
  template: {
    id: string;
    title: string;
    description?: string | null;
  };
}

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const format = useFormatter();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [createdTemplates, setCreatedTemplates] = useState<Template[]>([]);
  const [filledTemplates, setFilledTemplates] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          throw new Error(t('errorNotAuthenticated')); // Use translation
        }

        // Set basic user info
        const userResponse = await fetch (`/api/user/profile`);
        const userData = await userResponse.json();
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: userData.name,
          avatarUrl: userData.avatarUrl
        });

        // Fetch templates created by user
        const templatesResponse = await fetch('/api/templates?ownerId=' + authUser.id);
        if (!templatesResponse.ok) {
          throw new Error(t('errorFetchCreatedTemplates')); // Use translation
        }
        const templatesData = await templatesResponse.json();
        setCreatedTemplates(templatesData);

        // Fetch submissions made by user
        const submissionsResponse = await fetch('/api/submissions/user');
        if (!submissionsResponse.ok) {
          throw new Error(t('errorFetchFilledTemplates')); // Use translation
        }
        const submissionsData = await submissionsResponse.json();
        setFilledTemplates(submissionsData);

      } catch (err) {
        console.error('Error fetching user data:', err);
        // Use specific translated errors if possible, otherwise generic
        let errorMessage = t('errorGeneric');
        if (err instanceof Error) {
          if (err.message === 'Not authenticated') errorMessage = t('errorNotAuthenticated');
          else if (err.message === 'Failed to fetch created templates') errorMessage = t('errorFetchCreatedTemplates');
          else if (err.message === 'Failed to fetch filled templates') errorMessage = t('errorFetchFilledTemplates');
          // Keep original message if it's none of the above specific ones, or use generic
          // else errorMessage = err.message; // Option to show original non-translated error
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // Get initials for avatar fallback
  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase();
    }
    return email ? email[0].toUpperCase() : 'U';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatarUrl || ''} alt={user.name || user.email} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center md:text-left">
                {/* Assuming user name translation is not needed, or handled elsewhere */}
                <h2 className="text-2xl font-bold">{user.name || t('userNameFallback')}</h2> {/* Use translation */}
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Tabs */}
        <Tabs defaultValue="created" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="created">{t('templatesCreatedTab')}</TabsTrigger>
            <TabsTrigger value="filled">{t('templatesFilledTab')}</TabsTrigger>
          </TabsList>

          {/* Created Templates Tab */}
          <TabsContent value="created" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{t('yourTemplatesTitle')}</h3>
              <Button onClick={() => router.push('/templates/create')}>
                {t('createNewTemplateButton')}
              </Button>
            </div>

            {createdTemplates.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t('noTemplatesCreated')}</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/templates/create')}
                >
                  {t('createFirstTemplateButton')}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {createdTemplates.map(template => (
                  <Card key={template.id} className="overflow-hidden">
                    {template.imageUrl && (
                      <div className="h-40 overflow-hidden">
                        <img 
                          src={template.imageUrl} 
                          alt={template.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{template.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/templates/${template.id}`)}
                        >
                          {t('viewButton')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/templates/${template.id}/edit`)}
                        >
                          {t('editButton')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/templates/${template.id}/submissions`)}
                        >
                          {t('submissionsButton')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Filled Templates Tab */}
          <TabsContent value="filled" className="space-y-4 pt-4">
            <h3 className="text-xl font-semibold">{t('templatesFilledTitle')}</h3>
            {filledTemplates.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t('noTemplatesFilled')}</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filledTemplates.map(submission => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{submission.template.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {submission.template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {submission.template.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t('submittedOnLabel')} {format.dateTime(new Date(submission.createdAt), 'short')}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/templates/${submission.templateId}`)}
                        >
                          {t('viewTemplateButton')}
                        </Button>
                        {/* Optionally add a button to view the specific submission details */}
                        {/* <Button size="sm" onClick={() => router.push(`/submissions/${submission.id}`)}>View Submission</Button> */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}