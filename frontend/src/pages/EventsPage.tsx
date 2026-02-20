import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { eventsAPI } from '../lib/api'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

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
  sort_order: number
  is_visible: boolean
}

export default function EventsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null)
  const [form, setForm] = useState({
    title_fr: '',
    title_en: '',
    title_ar: '',
    description_fr: '',
    description_en: '',
    description_ar: '',
    location: '',
    icon: '',
    start_time: '',
    end_time: '',
    sort_order: '0',
    is_visible: true,
  })

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events-all'],
    queryFn: eventsAPI.listAll,
  })

  const createMutation = useMutation({
    mutationFn: eventsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-all'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      eventsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-all'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: eventsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-all'] })
    },
  })

  const openCreate = () => {
    setEditingEvent(null)
    setForm({
      title_fr: '', title_en: '', title_ar: '',
      description_fr: '', description_en: '', description_ar: '',
      location: '', icon: '', start_time: '', end_time: '',
      sort_order: '0', is_visible: true,
    })
    setShowModal(true)
  }

  const openEdit = (event: WeddingEvent) => {
    setEditingEvent(event)
    setForm({
      title_fr: event.title_fr,
      title_en: event.title_en,
      title_ar: event.title_ar || '',
      description_fr: event.description_fr || '',
      description_en: event.description_en || '',
      description_ar: event.description_ar || '',
      location: event.location || '',
      icon: event.icon || '',
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time ? event.end_time.slice(0, 16) : '',
      sort_order: event.sort_order.toString(),
      is_visible: event.is_visible,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingEvent(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      title_fr: form.title_fr,
      title_en: form.title_en,
      title_ar: form.title_ar || undefined,
      description_fr: form.description_fr || undefined,
      description_en: form.description_en || undefined,
      description_ar: form.description_ar || undefined,
      location: form.location || undefined,
      icon: form.icon || undefined,
      start_time: form.start_time,
      end_time: form.end_time || undefined,
      sort_order: parseInt(form.sort_order),
      is_visible: form.is_visible,
    }

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirm_delete'))) {
      deleteMutation.mutate(id)
    }
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">{t('events')}</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-700 hover:bg-primary-800"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Event
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event: WeddingEvent) => (
            <div
              key={event.id}
              className={`bg-white shadow-sm rounded-xl border border-gray-100 p-5 ${!event.is_visible ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {event.icon && <span className="text-xl">{event.icon}</span>}
                    <h3 className="text-lg font-medium text-gray-900">{event.title_fr}</h3>
                    <span className="text-sm text-gray-400">/ {event.title_en}</span>
                    {!event.is_visible && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Hidden</span>
                    )}
                  </div>
                  {event.location && (
                    <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {formatTime(event.start_time)}
                    {event.end_time && ` - ${formatTime(event.end_time)}`}
                  </p>
                  {event.description_fr && (
                    <p className="text-sm text-gray-500 mt-2">{event.description_fr}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(event)} className="text-primary-600 hover:text-primary-900">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-900">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={closeModal}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">
                {editingEvent ? t('edit') : 'Add Event'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title (FR)</label>
                    <input
                      required
                      value={form.title_fr}
                      onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title (EN)</label>
                    <input
                      required
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title (AR)</label>
                  <input
                    value={form.title_ar}
                    onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    dir="rtl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Icon (emoji)</label>
                    <input
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="datetime-local"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.is_visible}
                        onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Visible</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-700 hover:bg-primary-800"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
