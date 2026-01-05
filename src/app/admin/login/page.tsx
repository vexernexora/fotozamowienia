'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const callbackUrl = searchParams.get('callbackUrl') || '/admin'
  const error = searchParams.get('error')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('admin-credentials', {
        email,
        password,
        tenantId: 'default',
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Blad logowania',
          description: 'Nieprawidlowy email lub haslo',
          variant: 'destructive',
        })
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      toast({
        title: 'Blad',
        description: 'Wystapil blad podczas logowania',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle>Panel administracyjny</CardTitle>
          <CardDescription>
            Zaloguj sie, aby zarzadzac sklepem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              Sesja wygasla lub nie masz uprawnien. Zaloguj sie ponownie.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Haslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zaloguj sie
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Domyslne dane testowe:</p>
            <p>Email: admin@fotodruk.pl</p>
            <p>Haslo: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
