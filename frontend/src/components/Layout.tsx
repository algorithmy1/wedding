import { Fragment, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTranslation } from 'react-i18next'
import { Dialog, Transition } from '@headlessui/react'
import {
  ChartBarIcon,
  UsersIcon,
  CalendarDaysIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'dashboard', href: '/', icon: ChartBarIcon },
  { name: 'guests', href: '/guests', icon: UsersIcon },
  { name: 'events', href: '/events', icon: CalendarDaysIcon },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const toggleLanguage = () => {
    const langs = ['fr', 'en', 'ar']
    const current = langs.indexOf(i18n.language)
    const next = langs[(current + 1) % langs.length]
    i18n.changeLanguage(next)
  }

  const navItems = navigation.map((item) => (
    <Link
      key={item.name}
      to={item.href}
      className={classNames(
        location.pathname === item.href
          ? 'bg-primary-100 text-primary-900'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
        'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
      )}
      onClick={() => setSidebarOpen(false)}
    >
      <item.icon
        className={classNames(
          location.pathname === item.href
            ? 'text-primary-700'
            : 'text-gray-400 group-hover:text-gray-500',
          'mr-3 flex-shrink-0 h-5 w-5'
        )}
      />
      {t(item.name)}
    </Link>
  ))

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center px-4">
                    <h1 className="text-xl font-serif font-bold text-primary-800">Wedding</h1>
                  </div>
                  <nav className="mt-5 px-2 space-y-1">{navItems}</nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-serif font-bold text-primary-800">Wedding</h1>
              </div>
              <nav className="mt-8 flex-1 px-3 space-y-1">{navItems}</nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={toggleLanguage}
                  className="ml-2 p-2 text-gray-400 hover:text-gray-500"
                  title="Toggle language"
                >
                  <LanguageIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={logout}
                  className="ml-1 p-2 text-gray-400 hover:text-gray-500"
                  title={t('logout')}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
