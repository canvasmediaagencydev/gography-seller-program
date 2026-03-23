import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import { MapPin } from 'lucide-react'

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatShortDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

async function getTripData(tripId: string, sellerRef?: string | null) {
  const supabase = createAdminClient()

  const { data: trip } = await supabase
    .from('trips')
    .select(`*, countries(id, name, flag_emoji), partners(id, name, logo_url)`)
    .eq('id', tripId)
    .eq('is_active', true)
    .single()

  if (!trip) return null

  const { data: nextSchedule } = await supabase
    .from('trip_schedules')
    .select('*')
    .eq('trip_id', tripId)
    .eq('is_active', true)
    .gte('departure_date', new Date().toISOString())
    .order('departure_date', { ascending: true })
    .limit(1)
    .single()

  let seller = null
  if (sellerRef) {
    // Try referral_code first, then fallback to id
    const { data: byCode } = await supabase
      .from('user_profiles')
      .select('id, full_name, referral_code, phone')
      .eq('referral_code', sellerRef)
      .eq('role', 'seller')
      .eq('status', 'approved')
      .single()

    if (byCode) {
      seller = byCode
    } else {
      const { data: byId } = await supabase
        .from('user_profiles')
        .select('id, full_name, referral_code, phone')
        .eq('id', sellerRef)
        .eq('role', 'seller')
        .eq('status', 'approved')
        .single()
      seller = byId
    }
  }

  return { trip, nextSchedule, seller }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tripId: string }>
  searchParams: Promise<{ seller?: string }>
}): Promise<Metadata> {
  const { tripId } = await params
  const data = await getTripData(tripId)

  if (!data) return { title: 'ไม่พบทริป | Paydee' }

  const { trip } = data
  return {
    title: `${trip.title} | Paydee Travel`,
    description: `${trip.title} — ${trip.duration_days} วัน ${trip.duration_nights} คืน`,
    openGraph: {
      title: trip.title,
      description: `${trip.title} — เริ่มต้น ฿${formatPrice(trip.price_per_person)}/ท่าน`,
      images: trip.cover_image_url ? [trip.cover_image_url] : [],
      type: 'website',
    },
  }
}

export default async function ShareTripPage({
  params,
  searchParams
}: {
  params: Promise<{ tripId: string }>
  searchParams: Promise<{ seller?: string }>
}) {
  const { tripId } = await params
  const { seller: sellerRef } = await searchParams
  const data = await getTripData(tripId, sellerRef)

  if (!data) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center">
        <div className="text-center px-6">
          <MapPin className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">ไม่พบทริป</h1>
          <p className="text-white/50 text-sm">ทริปนี้อาจถูกปิดหรือไม่มีอยู่ในระบบ</p>
        </div>
      </div>
    )
  }

  const { trip, nextSchedule, seller } = data
  const countries = trip.countries as { id: string; name: string; flag_emoji: string | null } | null
  const partners = trip.partners as { id: string; name: string; logo_url: string | null } | null

  const sellerIdentifier = seller?.referral_code || seller?.id?.slice(-6) || null
  const lineMessage = seller
    ? `สนใจทริป: ${trip.title} (รหัสผู้แนะนำ: ${sellerIdentifier})`
    : `สนใจทริป: ${trip.title}`
  const lineUrl = `https://line.me/R/oaMessage/@paydeeme/?${encodeURIComponent(lineMessage)}`

  return (
    <div className="h-dvh relative overflow-hidden bg-black [touch-action:manipulation]">

      {/* ── Full-screen background ── */}
      {trip.cover_image_url ? (
        <Image
          src={trip.cover_image_url}
          alt={trip.title}
          fill
          className="object-cover scale-105"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}

      {/* Cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/5 to-black/60" />
      <div className="absolute bottom-0 inset-x-0 h-[60%] bg-gradient-to-t from-black via-black/90 to-transparent" />

      {/* ── Content ── */}
      <div className="relative z-10 h-full flex flex-col justify-between">

        {/* ▸ Top */}
        <div className="px-6 pt-[max(env(safe-area-inset-top),16px)] pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/paydeeLOGO.svg"
                alt="Paydee"
                width={24}
                height={24}
                className="brightness-0 invert opacity-70"
              />
              <div className="h-3.5 w-px bg-white/20" />
              <span className="text-white/50 text-[10px] font-semibold tracking-[0.25em] uppercase">Travel</span>
            </div>
            {countries && (
              <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1 border border-white/10">
                <span className="text-xs text-white/80">{countries.flag_emoji} {countries.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* ▸ Spacer */}
        <div className="flex-1" />

        {/* ▸ Bottom */}
        <div className="px-6 pb-[max(env(safe-area-inset-bottom),24px)]">

          {/* Partner */}
          {partners && (
            <div className="flex items-center gap-2 mb-2.5">
              {partners.logo_url && (
                <Image
                  src={partners.logo_url}
                  alt={partners.name}
                  width={16}
                  height={16}
                  className="rounded-full opacity-70"
                />
              )}
              <span className="text-[10px] text-white/40 font-medium tracking-[0.15em] uppercase">
                {partners.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-[26px] sm:text-[34px] font-bold text-white leading-[1.12] tracking-tight">
            {trip.title}
          </h1>

          {/* Info chips row */}
          <div className="flex items-center gap-2 mt-3 mb-5 flex-wrap">
            <span className="bg-white/10 backdrop-blur-sm border border-white/[0.06] rounded-full px-3 py-1 text-[12px] text-white/60">
              {trip.duration_days} วัน {trip.duration_nights} คืน
            </span>
            {nextSchedule && (
              <span className="bg-white/10 backdrop-blur-sm border border-white/[0.06] rounded-full px-3 py-1 text-[12px] text-white/60">
                {formatShortDate(nextSchedule.departure_date)}
              </span>
            )}
            {nextSchedule && nextSchedule.available_seats > 0 && (
              <span className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/20 rounded-full px-3 py-1 text-[12px] text-emerald-300 font-medium">
                {nextSchedule.available_seats} ที่นั่ง
              </span>
            )}
          </div>

          {/* Glass card */}
          <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 mb-4">
            <div className="flex items-end justify-between">
              {/* Price */}
              <div>
                <p className="text-[10px] text-white/35 font-medium tracking-wider uppercase mb-1">ราคาเริ่มต้น</p>
                <div className="flex items-baseline">
                  <span className="text-white/40 text-base font-medium mr-0.5">฿</span>
                  <span className="text-[28px] sm:text-[32px] font-extrabold text-white leading-none tracking-tight">
                    {formatPrice(trip.price_per_person)}
                  </span>
                  <span className="text-white/35 text-xs ml-1.5">/ท่าน</span>
                </div>
              </div>

              {/* Seller */}
              {seller && (
                <div className="text-right pl-4">
                  <p className="text-[9px] text-white/30 font-medium tracking-wider uppercase mb-1">แนะนำโดย</p>
                  <p className="text-[13px] font-semibold text-white/80 leading-tight truncate max-w-[140px]">
                    {seller.full_name || 'ผู้แนะนำ'}
                  </p>
                  <p className="text-[10px] text-white/25 font-mono tracking-widest mt-0.5">
                    REF {sellerIdentifier}
                  </p>
                </div>
              )}
            </div>

            {/* Deadline */}
            {nextSchedule?.registration_deadline && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                <p className="text-[11px] text-white/40">
                  ปิดรับสมัคร <span className="text-white/60 font-medium">{formatShortDate(nextSchedule.registration_deadline)}</span>
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center gap-2.5 w-full bg-[#06C755] active:scale-[0.97] text-white font-bold py-[18px] rounded-[16px] transition-all duration-200 cursor-pointer text-[15px] overflow-hidden shadow-[0_0_50px_rgba(6,199,85,0.35)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
            <div className="relative flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-current flex-shrink-0" aria-hidden="true">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              <span className="tracking-wide">สนใจทริปนี้ — แชทเลย</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
