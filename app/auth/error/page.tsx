import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl';

export default async function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams
  const t = useTranslations('Auth');

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('authErrorTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <p className="text-sm text-muted-foreground">{t('authErrorDescription')} {t('authErrorCodeLabel')} {params.error}</p> // Combining generic description with code
              ) : (
                <p className="text-sm text-muted-foreground">{t('authErrorDescription')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
