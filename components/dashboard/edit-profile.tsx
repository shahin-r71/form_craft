'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CldUploadWidget } from 'next-cloudinary';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PencilIcon, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EditProfileProps {
  userId: string;
  userName: string | null;
  userEmail: string;
  userAvatarUrl: string | null;
  onProfileUpdate: () => void;
}

export function EditProfile({ userId, userName, userEmail, userAvatarUrl, onProfileUpdate }: EditProfileProps) {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const [name, setName] = useState(userName || '');
  const [avatarUrl, setAvatarUrl] = useState(userAvatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadWidgetOpen, setIsUploadWidgetOpen] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setName(userName || '');
      setAvatarUrl(userAvatarUrl || '');
      setError(null);
    }
  }, [isOpen, userName, userAvatarUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Only include fields that have changed
    const updateData: { name?: string; avatarUrl?: string } = {};
    if (name.trim() !== userName) updateData.name = name.trim() || '';
    if (avatarUrl !== userAvatarUrl) updateData.avatarUrl = avatarUrl || '';
    // updateData.avatarUrl = avatarUrl || '';
    // updateData.name = name.trim() || ''; // Trim and set name if not empty
    
    // console.log(updateData); 

    // Don't make API call if nothing changed
    if (Object.keys(updateData).length === 0) {
      setIsOpen(false);
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
      setIsOpen(false);
      onProfileUpdate();
      router.refresh();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

//   const handleUploadSuccess = (result: any) => {
//     const secureUrl = result.info.secure_url;
//     setAvatarUrl(secureUrl);
//     toast.success(t('imageUploadSuccess'));
//     setIsUploadWidgetOpen(false);
//   };

  const getInitials = (name: string | null) => {
    if (!name) return userEmail.charAt(0).toUpperCase();
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const cloudPresetName = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setIsUploadWidgetOpen(false);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <PencilIcon className="h-4 w-4 mr-2" />
          {t('editProfile')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('editProfileTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || ''} alt={name || userEmail} />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <CldUploadWidget
                uploadPreset={cloudPresetName || ''}
                onSuccess={(result, { widget }) => {
                    const info = result.info;
                    if (info && typeof info === "object" && "secure_url" in info) {
                    setAvatarUrl(info.secure_url as string);
                    console.log(info.secure_url as string);
                    }
                    toast.success(t('uploadSuccess'), { // Use translation
                    position: "top-center",
                    autoClose: 3000,
                    });
                    widget.close();
                }}
                options={{
                  multiple: false,
                  folder: "form_craft",
                  resourceType: "image",
                  maxImageFileSize: 2000000, // 2MB
                  clientAllowedFormats: ["png", "jpeg", "jpg"],
                  showUploadMoreButton: false,
                  styles: {
                    palette: {
                      window: "#FFFFFF",
                      windowBorder: "#90A0B3",
                      tabIcon: "#0078FF",
                      menuIcons: "#5A616A",
                      textDark: "#000000",
                      textLight: "#FFFFFF",
                      link: "#0078FF",
                      action: "#FF620C",
                      inactiveTabIcon: "#0E2F5A",
                      error: "#F44235",
                      inProgress: "#0078FF",
                      complete: "#20B832",
                      sourceBg: "#E4EBF1"
                    },
                    frame: {
                      background: "rgba(255,255,255,0.95)"
                    }
                  }
                }}
              >
                {({ open }) => (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      open();
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {avatarUrl ? t('changeImage') : t('uploadImage')}
                  </Button>
                )}
              </CldUploadWidget>
            </div>
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
                value={userEmail}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">{t('emailCannotBeChanged')}</p>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('saving') : t('saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}