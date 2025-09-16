import { formatPrice } from '../../utils/bookingUtils'

interface BookingSummaryProps {
    customerCount: number
    pricePerPerson: number
    totalAmount: number
    onBooking: () => void
    isBooking: boolean
    canBook: boolean
    error?: string | null
    sellerRefCode?: string | null
}

export default function BookingSummary({ 
    customerCount, 
    pricePerPerson, 
    totalAmount,
    onBooking,
    isBooking,
    canBook,
    error,
    sellerRefCode
}: BookingSummaryProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-6">สรุปการจอง</h3>

            <div className="space-y-4">
                {/* Customer Count */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">จำนวนผู้เดินทาง</span>
                    <span className="font-semibold">{customerCount} คน</span>
                </div>

                {/* Price Per Person */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">ราคาต่อคน</span>
                    <span className="font-semibold">{formatPrice(pricePerPerson)}</span>
                </div>

                {/* Seller Ref Code */}
                {sellerRefCode && (
                    <div className="flex text-sm gap-2 items-center">
                        <span className="text-gray-400">รหัสแนะนำ</span>
                        <span className="text-gray-400">{sellerRefCode}</span>
                    </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">ยอดรวม</span>
                        <span className="text-xl font-bold text-primary-yellow">{formatPrice(totalAmount)}</span>
                    </div>
                </div>

                {/* Features */}
                {/* <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">รวมในราคา</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <span className="text-green-500">✓</span>
                            <span>ประกันการเดินทาง</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-green-500">✓</span>
                            <span>ไกด์นำเที่ยวมืออาชีพ</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-green-500">✓</span>
                            <span>ยกเลิกได้ก่อนเดินทาง</span>
                        </div>
                    </div>
                </div> */}

                {/* Security */}
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center space-x-2">
                        <span className="text-green-600">🔒</span>
                        <span className="text-sm text-green-700">การชำระเงินปลอดภัย</span>
                    </div>
                </div>

                {/* Booking Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                        onClick={onBooking}
                        disabled={isBooking || !canBook}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                            isBooking || !canBook
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-primary-blue text-white hover:bg-primary-blue'
                        }`}
                    >
                        {isBooking ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>กำลังจอง...</span>
                            </div>
                        ) : (
                            'ยืนยันการจอง'
                        )}
                    </button>

                    <p className="text-xs text-center text-gray-500 mt-3">
                        การกดยืนยัน หมายถึงคุณยอมรับ
                        <span className="text-primary-yellow"> ข้อกำหนดและเงื่อนไข</span>
                    </p>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
