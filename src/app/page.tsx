'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero section */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Budget Tracker
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Gestiona tu presupuesto de manera inteligente y sencilla.
            <br />
            Controla tus gastos, visualiza tu progreso y alcanza tus metas financieras.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {status === 'loading' ? (
              <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
            ) : session ? (
              <Link
                href="/dashboard"
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              >
                Ir al Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Crear Cuenta
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                    />
                  </svg>
                </div>
                Control de Gastos
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                Registra y categoriza tus gastos para tener un control completo de tus finanzas.
              </dd>
            </div>

            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                </div>
                Visualización Clara
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                Gráficos y estadísticas para entender rápidamente tu situación financiera.
              </dd>
            </div>

            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                </div>
                Períodos Flexibles
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                Organiza tu presupuesto por períodos que se ajusten a tus necesidades.
              </dd>
            </div>

            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                Datos Seguros
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                Tus datos están protegidos con autenticación segura y encriptación.
              </dd>
            </div>
          </dl>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Built with Next.js 14, TypeScript, Prisma, and Supabase</p>
        </div>
      </div>
    </div>
  )
}
