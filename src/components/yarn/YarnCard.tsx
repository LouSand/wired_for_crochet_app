import Link from 'next/link'
import type { YarnEntry } from '@/types/database'

function formatWeight(weight: string): string {
  return weight.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface YarnCardProps {
  yarn: YarnEntry
}

export default function YarnCard({ yarn }: YarnCardProps) {
  return (
    <Link
      href={`/yarn/${yarn.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    >
      <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
        {yarn.name}
      </h3>

      <div className="mt-3 space-y-1.5 text-sm text-gray-600">
        {yarn.brand && (
          <p>
            <span className="font-medium text-gray-700">Brand:</span>{' '}
            {yarn.brand}
          </p>
        )}
        {yarn.colour && (
          <p>
            <span className="font-medium text-gray-700">Colour:</span>{' '}
            {yarn.colour}
          </p>
        )}
        {yarn.weight_category && (
          <p>
            <span className="font-medium text-gray-700">Weight:</span>{' '}
            {formatWeight(yarn.weight_category)}
          </p>
        )}
        <p>
          <span className="font-medium text-gray-700">Qty Owned:</span>{' '}
          {yarn.quantity_owned}
        </p>
      </div>
    </Link>
  )
}
