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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PencilIcon } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { toast } from 'react-toastify';

interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
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
  
  // Profile editing state
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

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
          avatarUrl: userData.avatarUrl,
          isAdmin: userData.isAdmin || false,
        });
        
        // Initialize profile editing state
        setName(userData.name || '');
        setAvatarUrl(userData.avatarUrl || '');

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
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isProfileDialogOpen && user) {
      setName(user.name || '');
      setProfileError(null);
    }
  }, [isProfileDialogOpen, user]);
  
  // Update avatar separately from the form
  const updateAvatar = async (newAvatarUrl: string) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/user/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update avatar');
      }

      toast.success(t('profileUpdateSuccess'));
      // Update local user state
      setUser(prev => prev ? {...prev, avatarUrl: newAvatarUrl} : null);
      router.refresh();
    } catch (err) {
      console.error('Error updating avatar:', err);
      toast.error(err instanceof Error ? err.message : t('errorGeneric'));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsProfileLoading(true);
    setProfileError(null);

    // Only include name field if it has changed
    const updateData: { name?: string } = {};
    if (name.trim() !== user.name) updateData.name = name.trim() || '';
    
    // Don't make API call if nothing changed
    if (Object.keys(updateData).length === 0) {
      setIsProfileDialogOpen(false);
      return;
    }

    try {
      const response = await fetch('/api/user/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success(t('profileUpdateSuccess'));
      setIsProfileDialogOpen(false);
      // Update local user state
      setUser(prev => prev ? {...prev, name: updateData.name || prev.name} : null);
      router.refresh();
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setIsProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-3 border-b-3 border-primary"></div>
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
  
  const cloudPresetName = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {/* Avatar with upload functionality */}
              <div className="flex flex-col md:flex-row gap-6">
                <CldUploadWidget
                  uploadPreset={cloudPresetName || ''}
                  onSuccess={(result, { widget }) => {
                    const info = result.info;
                    if (info && typeof info === "object" && "secure_url" in info) {
                      const newAvatarUrl = info.secure_url as string;
                      setAvatarUrl(newAvatarUrl);
                      updateAvatar(newAvatarUrl);
                    }
                    widget.close();
                  }}
                  options={{
                    multiple: false,
                    folder: "form_craft",
                    resourceType: "image",
                    maxImageFileSize: 2000000, // 2MB
                    clientAllowedFormats: ["png", "jpeg", "jpg"],
                    showUploadMoreButton: false,
                  }}
                >
                  {({ open }) => (
                    <div className="cursor-pointer relative group" onClick={() => open()}>
                      <Avatar className="h-24 w-24 transition-opacity">
                        <AvatarImage src={user.avatarUrl || ''} alt={user.name || user.email} />
                        <AvatarFallback className="text-2xl">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-80 transition-opacity">
                        <PencilIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  )}
                </CldUploadWidget>
                <div className="space-y-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold">{user.name || t('userNameFallback')}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                  
                  {/* Name edit dialog */}
                  <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4 mr-2" />
                        {t('editProfile')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>{t('editProfileTitle')}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">{t('nameLabel')}</Label>
                            <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={t('namePlaceholder')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">{t('emailLabel')}</Label>
                            <Input
                              id="email"
                              value={user.email}
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-sm text-muted-foreground">{t('emailCannotBeChanged')}</p>
                          </div>
                        </div>
                        {profileError && <p className="text-sm text-red-500">{profileError}</p>}
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsProfileDialogOpen(false)}
                            disabled={isProfileLoading}
                          >
                            {t('cancel')}
                          </Button>
                          <Button type="submit" disabled={isProfileLoading}>
                            {isProfileLoading ? t('saving') : t('saveChanges')}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className='self-end'>
                {
                  user.isAdmin?
                    <Button variant='secondary' onClick={() => router.push('/admin/users')}>
                      {t('ManageUserButton')}
                    </Button>
                    :
                    null
                }
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
          <TabsContent value="created" className="space-y-4 pt-4 min-h-[55vh]">
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
          <TabsContent value="filled" className="space-y-4 pt-4 min-h-[55vh]">
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
                         <Button size="sm" onClick={() => router.push(`/templates/${submission.templateId}/submit/view?submissionId=${submission.id}`)}>View Submission</Button>
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