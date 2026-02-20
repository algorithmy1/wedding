import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { guestsAPI } from '../lib/api'
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserPlusIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['guest-stats'],
    queryFn: guestsAPI.stats,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const cards = [
    { name: t('total_guests'), value: stats?.total ?? 0, icon: UsersIcon, color: 'bg-blue-500' },
    { name: t('attending'), value: stats?.attending ?? 0, icon: CheckCircleIcon, color: 'bg-green-500' },
    { name: t('not_attending'), value: stats?.not_attending ?? 0, icon: XCircleIcon, color: 'bg-red-500' },
    { name: t('pending'), value: stats?.pending ?? 0, icon: ClockIcon, color: 'bg-yellow-500' },
    { name: t('plus_ones'), value: stats?.plus_ones ?? 0, icon: UserPlusIcon, color: 'bg-purple-500' },
    { name: t('total_attending'), value: stats?.total_attending ?? 0, icon: HeartIcon, color: 'bg-pink-500' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-gray-900">{t('dashboard')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${card.color} rounded-lg p-3`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{card.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
