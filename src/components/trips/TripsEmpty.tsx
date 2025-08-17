import { FaMapLocation } from "react-icons/fa6";

export function TripsEmpty() {
    return (
        <div className="text-center py-12">
           <FaMapLocation className="mx-auto h-60 w-60 text-gray-200 mt-20" />
            <h3 className="mt-10 text-xl font-medium text-gray-600">ไม่มีข้อมูล Trips</h3>
        </div>
    )
}
