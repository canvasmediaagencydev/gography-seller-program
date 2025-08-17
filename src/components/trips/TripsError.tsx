interface TripsErrorProps {
    message: string
}

export function TripsError({ message }: TripsErrorProps) {
    return (
        <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">เกิดข้อผิดพลาดในการโหลดข้อมูล: {message}</p>
            </div>
        </div>
    )
}
