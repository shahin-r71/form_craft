'use client'

import { createClient } from "@/utils/supabase/client";
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl';

export function LogoutButton() {
  const t = useTranslations('Auth');
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return <Button onClick={logout}>{t('logoutButton')}</Button>
}
