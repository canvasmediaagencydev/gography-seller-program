interface ContactSupportProps {
  className?: string
}

export default function ContactSupport({ className = '' }: ContactSupportProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-3">ต้องการความช่วยเหลือ?</h4>
      <div className="space-y-2">
        <a 
          href="tel:02-123-4567" 
          className="block w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm text-center"
        >
          📞 โทร 02-123-4567
        </a>
        <a 
          href="https://line.me/ti/p/@geography" 
          className="block w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm text-center"
        >
          💬 แชท LINE
        </a>
      </div>
    </div>
  )
}
