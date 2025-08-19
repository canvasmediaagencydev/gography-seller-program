import { TabType } from '../../hooks/useTripFilters'
import { ViewToggle, ViewMode } from "../ui/ViewToggle"

interface TabProps {
    id: TabType
    label: string
    isActive: boolean
    onClick: (tabId: TabType) => void
}

export function Tab({ id, label, isActive, onClick }: TabProps) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`whitespace-nowrap py-2 px-4 font-medium text-md transition-colors rounded-full ${
                isActive
                    ? 'text-white bg-orange-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
            {label}
        </button>
    )
}

interface TripTabsProps {
    activeTab: TabType
    onTabChange: (tabId: TabType) => void
    showTabs: boolean
    viewMode: ViewMode
    onViewModeChange: (mode: ViewMode) => void
}

export function TripTabs({ activeTab, onTabChange, showTabs, viewMode, onViewModeChange }: TripTabsProps) {
    if (!showTabs) return null

    const tabs = [
        { id: 'all' as TabType, label: 'ทั้งหมด' },
        { id: 'sold' as TabType, label: 'ทริปที่คุณขายได้' },
        { id: 'not_sold' as TabType, label: 'ทริปที่คุณยังไม่ขาย' },
        { id: 'full' as TabType, label: 'ทริปที่เต็มแล้ว' }
    ]

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center">
                <nav className="flex space-x-2">
                    {tabs.map((tab) => (
                        <Tab
                            key={tab.id}
                            id={tab.id}
                            label={tab.label}
                            isActive={activeTab === tab.id}
                            onClick={onTabChange}
                        />
                    ))}
                </nav>

                {/* //* Note ปิดไว้ยังไม่เปิดใช้ ปรับปรุง list view ยังไม่สมบูรณ์ */}
                
                {/* <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} /> */}
            </div>
        </div>
    )
}
