'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, RefreshCw } from 'lucide-react'

interface OrderStatusUpdateProps {
  orderId: string
  currentStatus: string
}

const statusOptions = [
  { value: 'NEW', label: 'Nowe' },
  { value: 'PENDING_PAYMENT', label: 'Oczekuje na platnosc' },
  { value: 'PAID', label: 'Oplacone' },
  { value: 'PROCESSING', label: 'W realizacji' },
  { value: 'PRINTING', label: 'Drukowanie' },
  { value: 'READY', label: 'Gotowe do wysylki' },
  { value: 'SHIPPED', label: 'Wyslane' },
  { value: 'DELIVERED', label: 'Dostarczone' },
  { value: 'COMPLETED', label: 'Zakonczone' },
  { value: 'CANCELLED', label: 'Anulowane' },
  { value: 'REFUNDED', label: 'Zwrocone' },
]

export function OrderStatusUpdate({
  orderId,
  currentStatus,
}: OrderStatusUpdateProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [note, setNote] = useState('')

  const handleUpdate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      })

      if (!response.ok) {
        throw new Error('Blad aktualizacji')
      }

      toast({
        title: 'Status zaktualizowany',
        description: 'Status zamowienia zostal zmieniony',
        variant: 'success' as any,
      })

      setNote('')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Nie udalo sie zaktualizowac statusu',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Aktualizacja statusu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Nowy status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Notatka (opcjonalna)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Dodaj notatke do zmiany statusu..."
              rows={1}
            />
          </div>
        </div>
        <Button
          onClick={handleUpdate}
          disabled={isLoading || status === currentStatus}
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Zaktualizuj status
        </Button>
      </CardContent>
    </Card>
  )
}
