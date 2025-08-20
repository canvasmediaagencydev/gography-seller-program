import { CountryFilter } from './CountryFilter'

interface Country {
  id: string
  name: string
  flag_emoji: string
}

interface TripsHeaderProps {
  totalTrips: number
  selectedCountries?: string[]
  onCountriesChange?: (countries: string[]) => void
  availableCountries?: Country[]
}

export function TripsHeader({ 
  totalTrips, 
  selectedCountries = [], 
  onCountriesChange, 
  availableCountries = [] 
}: TripsHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ข้อมูล Trips</h1>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{totalTrips} ทริป</div>
          </div>
        </div>
        
        {onCountriesChange && availableCountries.length > 0 && (
          <div className="flex items-center">
            <CountryFilter
              selectedCountries={selectedCountries}
              onCountriesChange={onCountriesChange}
              availableCountries={availableCountries}
            />
          </div>
        )}
      </div>
    </div>
  )
}
