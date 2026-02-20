import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { guestsAPI } from '../lib/api'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  group_name: string | null
  rsvp_code: string
  rsvp_status: string
  plus_one_allowed: boolean
  plus_one_name: string | null
  plus_one_attending: boolean
  dietary_restrictions: string | null
  message: string | null
  language: string
  table_number: number | null
  notes: string | null
}

const statusColors: Record<string, string> = {
  attending: 'bg-green-100 text-green-800',
  not_attending: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
}

export default function GuestsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    group_name: '',
    plus_one_allowed: false,
    language: 'fr',
    table_number: '',
    notes: '',
  })

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', search, filterStatus],
    queryFn: () =>
      guestsAPI.list({
        search: search || undefined,
        rsvp_status: filterStatus || undefined,
      }),
  })

  const createMutation = useMutation({
    mutationFn: guestsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] })
      queryClient.invalidateQueries({ queryKey: ['guest-stats'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      guestsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] })
      queryClient.invalidateQueries({ queryKey: ['guest-stats'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: guestsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] })
      queryClient.invalidateQueries({ queryKey: ['guest-stats'] })
    },
  })

  const openCreate = () => {
    setEditingGuest(null)
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      group_name: '',
      plus_one_allowed: false,
      language: 'fr',
      table_number: '',
      notes: '',
    })
    setShowModal(true)
  }

  const openEdit = (guest: Guest) => {
    setEditingGuest(guest)
    setForm({
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email || '',
      phone: guest.phone || '',
      group_name: guest.group_name || '',
      plus_one_allowed: guest.plus_one_allowed,
      language: guest.language,
      table_number: guest.table_number?.toString() || '',
      notes: guest.notes || '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingGuest(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      group_name: form.group_name || undefined,
      plus_one_allowed: form.plus_one_allowed,
      language: form.language,
      table_number: form.table_number ? parseInt(form.table_number) : undefined,
      notes: form.notes || undefined,
    }

    if (editingGuest) {
      updateMutation.mutate({ id: editingGuest.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirm_delete'))) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">{t('guests')}</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-700 hover:bg-primary-800"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          {t('add_guest')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
        >
          <option value="">{t('status')} - All</option>
          <option value="pending">{t('pending')}</option>
          <option value="attending">{t('attending')}</option>
          <option value="not_attending">{t('not_attending')}</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('last_name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('first_name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('group')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('rsvp_code')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('plus_one')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guests.map((guest: Guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{guest.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{guest.first_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guest.group_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{guest.rsvp_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[guest.rsvp_status] || 'bg-gray-100 text-gray-800'}`}>
                        {t(guest.rsvp_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {guest.plus_one_allowed ? (guest.plus_one_attending ? guest.plus_one_name : 'Allowed') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => openEdit(guest)} className="text-primary-600 hover:text-primary-900 mr-3">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(guest.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={closeModal}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">
                {editingGuest ? t('edit') : t('add_guest')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('first_name')}</label>
                    <input
                      required
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('last_name')}</label>
                    <input
                      required
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('group')}</label>
                    <input
                      value={form.group_name}
                      onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('table_number')}</label>
                    <input
                      type="number"
                      value={form.table_number}
                      onChange={(e) => setForm({ ...form, table_number: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.plus_one_allowed}
                    onChange={(e) => setForm({ ...form, plus_one_allowed: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">{t('plus_one')} allowed</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  />
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
