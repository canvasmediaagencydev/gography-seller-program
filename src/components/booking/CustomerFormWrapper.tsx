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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">ข้อมูลผู้เดินทาง</h3>
                <button
                    type="button"
                    onClick={onAddCustomer}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                    + เพิ่มผู้เดินทาง
                </button>
            </div>

            <div className="space-y-6">
                {customers.map((customer, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                        index === 0 
                            ? 'border-orange-200 bg-orange-50' 
                            : 'border-gray-200 bg-gray-50'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">
                                {index === 0 ? 'ผู้ติดต่อหลัก' : `ผู้เดินทางคนที่ ${index + 1}`}
                            </h4>
                            {index > 0 && (
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
                                    ชื่อ-นามสกุล *
                                </label>
                                <input
                                    type="text"
                                    value={customer.full_name}
                                    onChange={(e) => onUpdateCustomer(index, 'full_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="กรอกชื่อ-นามสกุล"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    อีเมล {index === 0 && '*'}
                                </label>
                                <input
                                    type="email"
                                    value={customer.email}
                                    onChange={(e) => onUpdateCustomer(index, 'email', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="กรอกอีเมล"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เบอร์โทรศัพท์ {index === 0 && '*'}
                                </label>
                                <input
                                    type="tel"
                                    value={customer.phone}
                                    onChange={(e) => onUpdateCustomer(index, 'phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="กรอกเบอร์โทรศัพท์"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    วันเกิด *
                                </label>
                                <input
                                    type="date"
                                    value={customer.date_of_birth}
                                    onChange={(e) => onUpdateCustomer(index, 'date_of_birth', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start space-x-3">
                    <span className="text-blue-600 mt-0.5">💡</span>
                    <div>
                        <p className="text-sm font-medium text-blue-800">เคล็ดลับ</p>
                        <p className="text-sm text-blue-700">
                            กรุณาตรวจสอบข้อมูลให้ถูกต้อง โดยเฉพาะข้อมูลผู้ติดต่อหลัก เพื่อรับการติดต่อจากทีมงาน
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}