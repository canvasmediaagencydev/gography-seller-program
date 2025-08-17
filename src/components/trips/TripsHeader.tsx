interface TripsHeaderProps {
    totalTrips: number
}

export function TripsHeader({ totalTrips }: TripsHeaderProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ข้อมูล Trips</h1>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{totalTrips} ทริป</div>
                </div>
            </div>
        </div>
    )
}
