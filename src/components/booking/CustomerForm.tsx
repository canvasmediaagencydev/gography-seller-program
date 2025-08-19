import { CustomerData } from '../../hooks/useCustomers'

interface CustomerFormProps {
    customer: CustomerData
    index: number
    onUpdate: (index: number, field: keyof CustomerData, value: string) => void
    onRemove: (index: number) => void
    canRemove: boolean
}

export default function CustomerForm({ 
    customer, 
    index, 
    onUpdate, 
    onRemove, 
    canRemove 
}: CustomerFormProps) {
    const isMainCustomer = index === 0

    return (
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    {isMainCustomer ? 'ผู้ติดต่อหลัก' : `ผู้เดินทางคนที่ ${index + 1}`}
                </h3>
                {canRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-red-600 hover:text-red-800"
                    >
                        ลบ
                    </button>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ-นามสกุล *
                    </label>
                    <input
                        type="text"
                        required={isMainCustomer}
                        value={customer.full_name}
                        onChange={(e) => onUpdate(index, 'full_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        อีเมล {isMainCustomer && '*'}
                    </label>
                    <input
                        type="email"
                        required={isMainCustomer}
                        value={customer.email}
                        onChange={(e) => onUpdate(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        เบอร์โทรศัพท์ {isMainCustomer && '*'}
                    </label>
                    <input
                        type="tel"
                        required={isMainCustomer}
                        value={customer.phone}
                        onChange={(e) => onUpdate(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        วันเกิด
                    </label>
                    <input
                        type="date"
                        value={customer.date_of_birth}
                        onChange={(e) => onUpdate(index, 'date_of_birth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        เลขบัตรประชาชน
                    </label>
                    <input
                        type="text"
                        value={customer.id_card}
                        onChange={(e) => onUpdate(index, 'id_card', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        เลขพาสปอร์ต
                    </label>
                    <input
                        type="text"
                        value={customer.passport_number}
                        onChange={(e) => onUpdate(index, 'passport_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
            </div>
        </div>
    )
}
