'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, IceCream, X } from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  body: string
  created_at: string
  read_at: string | null
}

export function NotificationsCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/comms/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.warn('Erro ao carregar notificações:', err)
    }
  }

  async function markAllRead() {
    try {
      await fetch('/api/comms/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
    } catch (err) {
      console.warn('Erro ao marcar como lidas:', err)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--brand-surface)] transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-black flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-[var(--border)] shadow-xl z-50 overflow-hidden">
          <div className="p-4 bg-[var(--brand-surface)] border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IceCream className="w-4 h-4 text-[var(--brand-primary)]" />
              <h4 className="font-bold text-xs text-[var(--text-primary)]">Notificações Doce Sabor</h4>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Marcar como lidas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                Nenhuma notificação no momento.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 transition-colors ${
                    !item.read_at ? 'bg-amber-50/50 font-medium' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold text-[var(--text-primary)]">{item.title}</h5>
                    <span className="text-[9px] text-[var(--text-secondary)]">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
