import { CountryFilter } from './CountryFilter'
import { PartnerFilter } from './PartnerFilter'

interface Country {
  id: string
  name: string
  flag_emoji: string
}

interface Partner {
  id: string
  name: string
  logo_url: string | null
}

interface TripsHeaderProps {
  totalTrips: number
  selectedCountries?: string[]
  onCountriesChange?: (countries: string[]) => void
  availableCountries?: Country[]
  selectedPartners?: string[]
  onPartnersChange?: (partners: string[]) => void
  availablePartners?: Partner[]
}

export function TripsHeader({
  totalTrips,
  selectedCountries = [],
  onCountriesChange,
  availableCountries = [],
  selectedPartners = [],
  onPartnersChange,
  availablePartners = []
}: TripsHeaderProps) {
  return (
    <div className="mb-6 md:mt-0 mt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center md:gap-5 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ข้อมูล Trips</h1>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-yellow">{totalTrips} ทริป</div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:ml-0 ml-4">
          {onPartnersChange && availablePartners.length > 0 && (
            <PartnerFilter
              selectedPartners={selectedPartners}
              onPartnersChange={onPartnersChange}
              availablePartners={availablePartners}
            />
          )}

          {onCountriesChange && availableCountries.length > 0 && (
            <CountryFilter
              selectedCountries={selectedCountries}
              onCountriesChange={onCountriesChange}
              availableCountries={availableCountries}
            />
          )}
        </div>
      </div>
    </div>
  )
}
