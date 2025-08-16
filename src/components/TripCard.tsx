'use client'

import TripImage from './TripImage'
import { useTripData } from '../hooks/useTripData'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { formatPrice } from '../utils/tripUtils'
import { TRIP_CARD_CONSTANTS } from '../constants/tripCard'
import { TripCardProps } from '../types/trip'
import { BsInfoCircle } from "react-icons/bs"
import { LuPlaneTakeoff } from "react-icons/lu"
import { LuClock4 } from "react-icons/lu"
import { ImLink } from "react-icons/im"
import { FaUser } from "react-icons/fa"
import { MdOutlineDateRange } from "react-icons/md";

export default function TripCard({ trip, viewType = 'general', currentSellerId }: TripCardProps) {
    const { copySuccess, handleCopy } = useCopyToClipboard()
    const { duration, commission, dateRange, deadlineInfo, availableSeats, mySales } = useTripData(trip)

    const handleCopyLink = () => {
        handleCopy(trip.geography_link)
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
            {/* Trip Image with Price Overlay */}
            <div className={`relative ${TRIP_CARD_CONSTANTS.IMAGE_HEIGHT} mb-4 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200`}>
                {trip.cover_image_url ? (
                    <TripImage
                        src={trip.cover_image_url}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                        {trip.countries?.flag_emoji || TRIP_CARD_CONSTANTS.DEFAULT_FLAG}
                    </div>
                )}

                {/* Price Badge */}
                <div className="absolute bottom-2 right-2 bg-gray-900/20 rounded-md text-white px-3 py-1">
                    <div className="text-sm font-bold text-right">
                        {TRIP_CARD_CONSTANTS.LABELS.PER_PERSON}
                    </div>
                    <div className="text-3xl font-bold text-right">
                        {formatPrice(trip.price_per_person)}
                    </div>
                </div>
            </div>

            {/* Trip Info */}
            <div className="px-4 pt-0 py-4 flex flex-col h-full">
                {/* Trip Title */}
                <h3 className={`font-semibold text-gray-800 text-xl mb-4 ${TRIP_CARD_CONSTANTS.TITLE_HEIGHT} ${TRIP_CARD_CONSTANTS.TITLE_LINES} leading-6`}>
                    {trip.title}
                </h3>

                {/* Trip Details */}
                <div className="space-y-2 text-sm text-gray-600 mb-4 text-nowrap flex-grow">
                    <div className="flex items-center gap-2">
                        <LuPlaneTakeoff className="w-5 h-5" />
                        <span>{TRIP_CARD_CONSTANTS.LABELS.TRAVEL_DATES}</span>
                        <span className="flex-1" />
                        <span className="text-gray-800 font-semibold">
                            {dateRange}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <LuClock4 className="w-5 h-5" />
                        <span>{TRIP_CARD_CONSTANTS.LABELS.DURATION}</span>
                        <span className="flex-1" />
                        <span className="text-gray-800 font-semibold">
                            {`${duration.days} วัน ${duration.nights} คืน`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MdOutlineDateRange className="w-5 h-5" />
                        <span>{TRIP_CARD_CONSTANTS.LABELS.DEADLINE}</span>
                        <span className="flex-1" />
                        <span className="text-gray-800 font-semibold">
                            {deadlineInfo}
                        </span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex justify-between items-center mb-4 bg-gray-50 p-4 rounded-lg mt-auto">
                    <div className="flex-1 text-center">
                        <div className="text-lg font-bold text-gray-800 flex items-center justify-center">
                            {availableSeats}
                            <span className="text-sm ml-2">
                                <FaUser className="inline text-gray-400" />
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">{TRIP_CARD_CONSTANTS.LABELS.AVAILABLE}</div>
                    </div>

                    <div className="h-8 w-px bg-gray-300 mx-4" />

                    {viewType === 'seller' ? (
                        <div className="flex-1 text-center">
                            <div className="text-lg font-bold text-gray-800">{mySales}</div>
                            <div className="text-xs text-gray-500">{TRIP_CARD_CONSTANTS.LABELS.MY_SALES}</div>
                        </div>
                    ) : (
                        <div className="flex-1 text-center">
                            <div className="text-lg font-bold text-gray-800">-</div>
                            <div className="text-xs text-gray-500">{TRIP_CARD_CONSTANTS.LABELS.SALES}</div>
                        </div>
                    )}

                    <div className="h-8 w-px bg-gray-300 mx-4" />

                    <div className="flex-1 text-center">
                        <div className="text-lg font-bold text-gray-800">
                            {formatPrice(commission)}
                        </div>
                        <div className="text-xs text-gray-500">{TRIP_CARD_CONSTANTS.LABELS.COMMISSION}</div>
                    </div>
                </div>

                {/* Share Button */}
                <div className="w-full px-2 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 bg-gray-800 text-white cursor-pointer">
                    <button
                        onClick={handleCopyLink}
                        disabled={!trip.geography_link}
                        className="w-full rounded-md py-2 hover:text-orange-600 hover:scale-110 transition-all duration-200 ease-in-out flex items-center justify-center gap-2 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ImLink className="text-xl" />
                        <span>
                            {copySuccess 
                                ? TRIP_CARD_CONSTANTS.COPY_SUCCESS_TEXT 
                                : TRIP_CARD_CONSTANTS.COPY_DEFAULT_TEXT
                            }
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}
