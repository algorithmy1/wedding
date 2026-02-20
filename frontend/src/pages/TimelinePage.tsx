import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { eventsAPI } from '../lib/api'
import { format } from 'date-fns'
import { fr, enUS, ar } from 'date-fns/locale'

interface WeddingEvent {
  id: string
  title_fr: string
  title_en: string
  title_ar: string | null
  description_fr: string | null
  description_en: string | null
  description_ar: string | null
  location: string | null
  icon: string | null
  start_time: string
  end_time: string | null
}

const localeMap: Record<string, Locale> = { fr, en: enUS, ar }

export default function TimelinePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsAPI.list,
  })

  const getTitle = (event: WeddingEvent) => {
    if (lang === 'ar' && event.title_ar) return event.title_ar
    if (lang === 'en') return event.title_en
    return event.title_fr
  }

  const getDescription = (event: WeddingEvent) => {
    if (lang === 'ar' && event.description_ar) return event.description_ar
    if (lang === 'en') return event.description_en
    return event.description_fr
  }

  const formatTime = (iso: string) => {
    return format(new Date(iso), 'HH:mm', { locale: localeMap[lang] || localeMap.fr })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-primary-900">
            {t('event_timeline')}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-gray-500">{t('no_events')}</p>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary-200"></div>

            <div className="space-y-8">
              {events.map((event: WeddingEvent) => (
                <div key={event.id} className="relative pl-16">
                  <div className="absolute left-4 w-5 h-5 rounded-full bg-primary-500 border-4 border-primary-100 -translate-x-1/2"></div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-start gap-3">
                      {event.icon && <span className="text-2xl">{event.icon}</span>}
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-lg font-serif font-semibold text-gray-900">
                            {getTitle(event)}
                          </h3>
                          <span className="text-sm font-medium text-primary-700">
                            {formatTime(event.start_time)}
                            {event.end_time && ` - ${formatTime(event.end_time)}`}
                          </span>
                        </div>
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                        )}
                        {getDescription(event) && (
                          <p className="text-sm text-gray-600 mt-2">{getDescription(event)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
