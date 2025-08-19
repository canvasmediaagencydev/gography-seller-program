import { formatPrice } from '../../utils/bookingUtils'

interface BookingSummaryProps {
    customerCount: number
    pricePerPerson: number
    totalAmount: number
}

export default function BookingSummary({ 
    customerCount, 
    pricePerPerson, 
    totalAmount 
}: BookingSummaryProps) {
    return (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">สรุปการจอง</h3>
            <div className="flex justify-between items-center mb-2">
                <span>จำนวนผู้เดินทาง</span>
                <span className="font-semibold">{customerCount} คน</span>
            </div>
            <div className="flex justify-between items-center mb-2">
                <span>ราคาต่อคน</span>
                <span className="font-semibold">{formatPrice(pricePerPerson)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center text-lg font-bold">
                <span>รวมทั้งหมด</span>
                <span className="text-orange-600">{formatPrice(totalAmount)}</span>
            </div>
        </div>
    )
}
