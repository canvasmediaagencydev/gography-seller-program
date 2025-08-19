import { CustomerData } from '../../hooks/useCustomers'

interface CustomerFormWrapperProps {
    customers: CustomerData[]
    onAddCustomer: () => void
    onRemoveCustomer: (index: number) => void
    onUpdateCustomer: (index: number, field: keyof CustomerData, value: string) => void
}

export default function CustomerFormWrapper({ 
    customers, 
    onAddCustomer, 
    onRemoveCustomer, 
    onUpdateCustomer 
}: CustomerFormWrapperProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">ข้อมูลผู้เดินทาง</h3>
                <button
                    type="button"
                    onClick={onAddCustomer}
                    className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors text-sm"
                >
                    + เพิ่มผู้เดินทาง
                </button>
            </div>

            <div className="space-y-6">
                {customers.map((customer, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-700">
                                {index === 0 ? 'ผู้ติดต่อหลัก' : `ผู้เดินทางคนที่ ${index + 1}`}
                            </h4>
                            {customers.length > 1 && index > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveCustomer(index)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    ลบ
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อ-นามสกุล {index === 0 && '*'}
                                </label>
                                <input
                                    type="text"
                                    required={index === 0}
                                    value={customer.full_name}
                                    onChange={(e) => onUpdateCustomer(index, 'full_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="กรอกชื่อ-นามสกุล"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    อีเมล {index === 0 && '*'}
                                </label>
                                <input
                                    type="email"
                                    required={index === 0}
                                    value={customer.email}
                                    onChange={(e) => onUpdateCustomer(index, 'email', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="กรอกอีเมล"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เบอร์โทรศัพท์ {index === 0 && '*'}
                                </label>
                                <input
                                    type="tel"
                                    required={index === 0}
                                    value={customer.phone}
                                    onChange={(e) => onUpdateCustomer(index, 'phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="กรอกเบอร์โทรศัพท์"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    วันเกิด
                                </label>
                                <input
                                    type="date"
                                    value={customer.date_of_birth}
                                    onChange={(e) => onUpdateCustomer(index, 'date_of_birth', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เลขบัตรประชาชน
                                </label>
                                <input
                                    type="text"
                                    value={customer.id_card}
                                    onChange={(e) => onUpdateCustomer(index, 'id_card', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="กรอกเลขบัตรประชาชน"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เลขพาสปอร์ต
                                </label>
                                <input
                                    type="text"
                                    value={customer.passport_number}
                                    onChange={(e) => onUpdateCustomer(index, 'passport_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="กรอกเลขพาสปอร์ต"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
