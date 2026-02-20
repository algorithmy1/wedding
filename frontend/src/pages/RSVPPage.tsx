import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { rsvpAPI } from '../lib/api'

interface GuestInfo {
  id: string
  first_name: string
  last_name: string
  rsvp_status: string
  plus_one_allowed: boolean
  plus_one_name: string | null
  plus_one_attending: boolean
  dietary_restrictions: string | null
  message: string | null
  language: string
}

export default function RSVPPage() {
  const { code: urlCode } = useParams()
  const { t, i18n } = useTranslation()
  const [code, setCode] = useState(urlCode || '')
  const [guest, setGuest] = useState<GuestInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [rsvpStatus, setRsvpStatus] = useState('')
  const [plusOneName, setPlusOneName] = useState('')
  const [plusOneAttending, setPlusOneAttending] = useState(false)
  const [dietary, setDietary] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (urlCode) {
      handleLookup(urlCode)
    }
  }, [urlCode])

  const handleLookup = async (lookupCode?: string) => {
    const c = lookupCode || code
    if (!c.trim()) return
    setError('')
    setLoading(true)

    try {
      const data = await rsvpAPI.lookup(c.trim())
      setGuest(data)
      setRsvpStatus(data.rsvp_status)
      setPlusOneName(data.plus_one_name || '')
      setPlusOneAttending(data.plus_one_attending)
      setDietary(data.dietary_restrictions || '')
      setMessage(data.message || '')
      if (data.language) {
        i18n.changeLanguage(data.language)
      }
    } catch {
      setError('Code not found')
      setGuest(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!guest || !rsvpStatus) return
    setLoading(true)
    setError('')

    try {
      await rsvpAPI.submit({
        rsvp_code: code.trim().toUpperCase(),
        rsvp_status: rsvpStatus,
        plus_one_name: plusOneName || undefined,
        plus_one_attending: plusOneAttending,
        dietary_restrictions: dietary || undefined,
        message: message || undefined,
      })
      setSubmitted(true)
    } catch {
      setError('Failed to submit RSVP')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <div className="text-5xl mb-4">
              {rsvpStatus === 'attending' ? '\u2764\uFE0F' : '\uD83D\uDC8C'}
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary-900 mb-3">
              {t('rsvp_success')}
            </h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-primary-900">{t('rsvp_title')}</h1>
            <p className="mt-2 text-sm text-gray-500">{t('rsvp_subtitle')}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {!guest ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('rsvp_enter_code')}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                className="block w-full text-center text-2xl font-mono tracking-widest rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-4"
                maxLength={8}
              />
              <button
                onClick={() => handleLookup()}
                disabled={loading || !code.trim()}
                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 disabled:opacity-50"
              >
                {loading ? '...' : t('rsvp_lookup')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  {guest.first_name} {guest.last_name}
                </p>
              </div>

              {/* RSVP Choice */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRsvpStatus('attending')}
                  className={`py-4 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    rsvpStatus === 'attending'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t('rsvp_attending')}
                </button>
                <button
                  onClick={() => setRsvpStatus('not_attending')}
                  className={`py-4 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    rsvpStatus === 'not_attending'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t('rsvp_not_attending')}
                </button>
              </div>

              {rsvpStatus === 'attending' && (
                <>
                  {/* Plus one */}
                  {guest.plus_one_allowed && (
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={plusOneAttending}
                          onChange={(e) => setPlusOneAttending(e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{t('plus_one')}</span>
                      </label>
                      {plusOneAttending && (
                        <input
                          placeholder={t('plus_one_name')}
                          value={plusOneName}
                          onChange={(e) => setPlusOneName(e.target.value)}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        />
                      )}
                    </div>
                  )}

                  {/* Dietary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('dietary_restrictions')}
                    </label>
                    <input
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('message')}
                </label>
                <textarea
                  placeholder={t('rsvp_message_placeholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !rsvpStatus}
                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 disabled:opacity-50"
              >
                {loading ? '...' : t('rsvp_submit')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
