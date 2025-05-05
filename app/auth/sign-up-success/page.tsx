import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('Auth');

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('signUpSuccessTitle')}</CardTitle>
              <CardDescription>{t('signUpSuccessDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {/* Assuming a more detailed message might be needed, but using description for now */}
                {t('signUpSuccessDescription')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
