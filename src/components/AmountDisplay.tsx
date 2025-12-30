'use client'

interface AmountDisplayProps {
  label: string
  amount: number
  className?: string
}

export default function AmountDisplay({ label, amount, className = '' }: AmountDisplayProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className={`flex flex-col items-center justify-center p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">
        {label}
      </p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {formatAmount(amount)}
      </p>
    </div>
  )
}
