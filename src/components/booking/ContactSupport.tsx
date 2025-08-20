import { CONTACT_INFO, SUPPORT_MESSAGES } from '@/constants/booking'

interface ContactSupportProps {
  className?: string
}

export default function ContactSupport({ className = '' }: ContactSupportProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-3">{SUPPORT_MESSAGES.title}</h4>
      <div className="space-y-2">
        <a 
          href={`tel:${CONTACT_INFO.phone.number}`}
          className="block w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm text-center"
        >
          {CONTACT_INFO.phone.display}
        </a>
        <a 
          href={CONTACT_INFO.line.url}
          className="block w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm text-center"
        >
          {CONTACT_INFO.line.display}
        </a>
      </div>
    </div>
  )
}
