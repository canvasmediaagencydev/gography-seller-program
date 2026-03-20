'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Share2, UserCheck, ShoppingBag, Users, Camera, ShieldCheck, Star, Target,
  CheckCircle2, Lock, ChevronRight, Coins, Flame, TrendingUp, Award, Zap,
  X, Clock, RotateCcw, ListChecks, ArrowRight, Sparkles,
} from 'lucide-react'

// ─── Design Tokens ─────────────────────────────────────────────────────────
// Primary: #176daf  Secondary: #5c9ad2  Gold: #fe9813  Dark: #0f1b2d

// ─── Types ─────────────────────────────────────────────────────────────────

type Status = 'available' | 'in_progress' | 'completed' | 'locked'

interface Activity {
  id: string
  category: string
  title: string
  description: string
  reward: number
  status: Status
  icon: React.ElementType
  textColor: string
  coverFrom: string
  coverTo: string
  completedAt?: string
  progress?: { current: number; total: number; label: string }
  // Modal detail fields
  fullDescription: string
  conditions: string[]
  howTo: string[]
  duration: string
  limitPerSeller: string
}

// ─── Mock Data ─────────────────────────────────────────────────────────────

const ACTIVITIES: Activity[] = [
  {
    id: '1',
    category: 'การแชร์',
    title: 'แชร์ทริปของคุณ',
    description: 'แชร์ทริปที่คุณสร้างไปยัง Facebook หรือ LINE เพื่อดึงดูดลูกค้าใหม่',
    fullDescription:
      'แชร์ทริปที่คุณสร้างผ่านช่องทางโซเชียลมีเดียอย่างน้อย 1 ช่องทาง ระบบจะตรวจสอบลิงก์แชร์ภายใน 24 ชั่วโมง เมื่อยืนยันแล้ว Coins จะถูกเพิ่มเข้าบัญชีของคุณทันที',
    conditions: [
      'ต้องมีทริปที่เผยแพร่แล้วอย่างน้อย 1 ทริป',
      'แชร์ผ่าน Facebook, LINE, Instagram, หรือ Twitter',
      'โพสต์ต้องเป็นสาธารณะ (Public) เท่านั้น',
      'กด "แชร์" ผ่านปุ่มในระบบ Paydee เพื่อให้ระบบติดตามได้',
    ],
    howTo: [
      'ไปที่หน้าจัดการทริปของคุณ',
      'เลือกทริปที่ต้องการแชร์',
      'กดปุ่ม "แชร์" และเลือกช่องทาง',
      'รอการยืนยันจากระบบภายใน 24 ชั่วโมง',
    ],
    reward: 50,
    status: 'available',
    icon: Share2,
    textColor: 'text-blue-600',
    coverFrom: 'from-blue-400',
    coverTo: 'to-blue-600',
    duration: 'ไม่จำกัดเวลา',
    limitPerSeller: 'ได้ 1 ครั้ง / ทริป',
  },
  {
    id: '2',
    category: 'โปรไฟล์',
    title: 'โปรไฟล์สมบูรณ์',
    description: 'กรอกข้อมูลโปรไฟล์ให้ครบถ้วน รวมถึงรูปภาพและข้อมูลติดต่อ',
    fullDescription:
      'กรอกข้อมูลโปรไฟล์ของคุณให้ครบทุกส่วน ตั้งแต่รูปภาพ ชื่อ-นามสกุล เบอร์โทรศัพท์ และคำอธิบายตัวเอง เพื่อเพิ่มความน่าเชื่อถือให้กับลูกค้า',
    conditions: [
      'อัปโหลดรูปโปรไฟล์ที่ชัดเจน',
      'กรอกชื่อ-นามสกุลจริง',
      'ระบุเบอร์โทรศัพท์ที่ติดต่อได้',
      'เขียนคำอธิบายตัวเองอย่างน้อย 50 ตัวอักษร',
    ],
    howTo: [
      'ไปที่หน้าโปรไฟล์ของคุณ',
      'กรอกข้อมูลทุกช่องให้ครบ',
      'อัปโหลดรูปภาพที่ชัดเจน',
      'กด "บันทึก" ระบบจะตรวจสอบและมอบ Coins อัตโนมัติ',
    ],
    reward: 100,
    status: 'completed',
    icon: UserCheck,
    textColor: 'text-emerald-600',
    coverFrom: 'from-emerald-400',
    coverTo: 'to-teal-600',
    completedAt: '15 มี.ค. 2569',
    duration: 'ครั้งเดียว',
    limitPerSeller: '1 ครั้ง ตลอดชีพ',
  },
  {
    id: '3',
    category: 'การจอง',
    title: 'รับการจองแรก',
    description: 'รับการจองทริปครั้งแรกจากลูกค้า และดำเนินการจนเสร็จสมบูรณ์',
    fullDescription:
      'กิจกรรมนี้จะสำเร็จเมื่อคุณได้รับการจองจากลูกค้าจริงครั้งแรก และลูกค้ายืนยันการชำระเงินเรียบร้อยแล้ว เป็นก้าวแรกของการเป็นเซลเลอร์มืออาชีพ',
    conditions: [
      'ต้องมีทริปที่เผยแพร่แล้วอย่างน้อย 1 ทริป',
      'ลูกค้าต้องยืนยันการจองและชำระเงินแล้ว',
      'สถานะการจองต้องเป็น "ยืนยันแล้ว"',
    ],
    howTo: [
      'สร้างทริปและตั้งค่าราคาให้น่าดึงดูด',
      'รอลูกค้าส่งคำขอจอง',
      'ยืนยันการจองภายใน 24 ชั่วโมง',
      'Coins จะถูกมอบหลังลูกค้าชำระเงิน',
    ],
    reward: 200,
    status: 'in_progress',
    icon: ShoppingBag,
    textColor: 'text-amber-600',
    coverFrom: 'from-amber-400',
    coverTo: 'to-orange-500',
    progress: { current: 1, total: 1, label: 'รอยืนยันจากลูกค้า' },
    duration: 'ครั้งเดียว',
    limitPerSeller: '1 ครั้ง ตลอดชีพ',
  },
  {
    id: '4',
    category: 'การแนะนำ',
    title: 'แนะนำเพื่อนเซลเลอร์',
    description: 'แนะนำเพื่อนให้มาสมัครเป็นเซลเลอร์โดยใช้รหัสอ้างอิงของคุณ',
    fullDescription:
      'แชร์รหัสอ้างอิง (Referral Code) ของคุณให้เพื่อน เมื่อเพื่อนสมัครและได้รับการอนุมัติเป็นเซลเลอร์แล้ว คุณจะได้รับ Coins ทันที',
    conditions: [
      'เพื่อนต้องใช้รหัสอ้างอิงของคุณในการสมัคร',
      'เพื่อนต้องผ่านการยืนยันตัวตน',
      'เพื่อนต้องได้รับการอนุมัติจากทีมงาน Paydee',
      'ไม่นับกรณีบัญชีที่ถูกระงับ',
    ],
    howTo: [
      'ไปที่หน้าโปรไฟล์เพื่อดูรหัสอ้างอิง',
      'แชร์รหัสให้เพื่อนที่สนใจ',
      'เพื่อนกรอกรหัสตอนสมัคร',
      'รอเพื่อนผ่านการอนุมัติ',
    ],
    reward: 150,
    status: 'available',
    icon: Users,
    textColor: 'text-violet-600',
    coverFrom: 'from-violet-400',
    coverTo: 'to-purple-600',
    duration: 'ไม่จำกัดเวลา',
    limitPerSeller: 'ได้ทุกครั้งที่แนะนำสำเร็จ',
  },
  {
    id: '5',
    category: 'คอนเทนต์',
    title: 'อัปโหลดรูปทริป',
    description: 'อัปโหลดรูปภาพคุณภาพสูงสำหรับทริปของคุณอย่างน้อย 5 รูป',
    fullDescription:
      'รูปภาพที่สวยงามช่วยเพิ่มยอดจองได้อย่างมาก อัปโหลดรูปคุณภาพสูงที่แสดงถึงความสวยงามของทริป เพื่อดึงดูดลูกค้าและรับ Coins',
    conditions: [
      'อัปโหลดอย่างน้อย 5 รูปต่อทริป',
      'ขนาดรูปต้องไม่น้อยกว่า 1MB',
      'ความละเอียดต้องไม่ต่ำกว่า 1024x768 พิกเซล',
      'รูปต้องเป็นรูปจริง ไม่ใช่รูป stock',
    ],
    howTo: [
      'ไปที่หน้าจัดการทริป',
      'เลือกทริปที่ต้องการเพิ่มรูป',
      'กด "จัดการรูปภาพ"',
      'อัปโหลดรูปอย่างน้อย 5 รูป',
    ],
    reward: 30,
    status: 'available',
    icon: Camera,
    textColor: 'text-rose-600',
    coverFrom: 'from-rose-400',
    coverTo: 'to-pink-600',
    duration: 'ไม่จำกัดเวลา',
    limitPerSeller: 'ได้ 1 ครั้ง / ทริป',
  },
  {
    id: '6',
    category: 'การยืนยัน',
    title: 'ยืนยันตัวตน',
    description: 'ส่งเอกสารยืนยันตัวตนและรอการอนุมัติจากทีมงาน Paydee',
    fullDescription:
      'การยืนยันตัวตนช่วยเพิ่มความน่าเชื่อถือให้กับโปรไฟล์ของคุณ ลูกค้าจะเชื่อมั่นและจองทริปกับคุณมากขึ้น',
    conditions: [
      'ส่งสำเนาบัตรประชาชนหรือพาสปอร์ต',
      'เอกสารต้องอยู่ในสภาพดี อ่านได้ชัดเจน',
      'ต้องตรงกับข้อมูลที่ลงทะเบียน',
    ],
    howTo: [
      'ไปที่หน้าโปรไฟล์',
      'กด "ยืนยันตัวตน"',
      'อัปโหลดเอกสารที่กำหนด',
      'รอทีมงานตรวจสอบภายใน 1-3 วันทำการ',
    ],
    reward: 100,
    status: 'completed',
    icon: ShieldCheck,
    textColor: 'text-teal-600',
    coverFrom: 'from-teal-400',
    coverTo: 'to-cyan-600',
    completedAt: '10 มี.ค. 2569',
    duration: 'ครั้งเดียว',
    limitPerSeller: '1 ครั้ง ตลอดชีพ',
  },
  {
    id: '7',
    category: 'คอนเทนต์',
    title: 'สร้างทริปพรีเมียม',
    description: 'สร้างทริปที่มีราคาเริ่มต้นตั้งแต่ 5,000 บาท พร้อมรายละเอียดครบถ้วน',
    fullDescription:
      'ทริปพรีเมียมดึงดูดกลุ่มลูกค้าที่มีกำลังซื้อสูง กรอกรายละเอียดให้ครบถ้วนและตั้งราคาที่สะท้อนคุณค่าของทริป',
    conditions: [
      'ราคาทริปต้องเริ่มต้นที่ 5,000 บาทขึ้นไป',
      'ต้องมีรูปภาพอย่างน้อย 5 รูป',
      'ต้องมีคำอธิบายทริปไม่น้อยกว่า 200 ตัวอักษร',
      'ต้องระบุ itinerary ทุกวัน',
    ],
    howTo: [
      'ยืนยันตัวตนให้สำเร็จก่อน',
      'สร้างทริปใหม่พร้อมรายละเอียดครบถ้วน',
      'ตั้งราคาที่ 5,000 บาทขึ้นไป',
      'เผยแพร่ทริปให้สาธารณะ',
    ],
    reward: 80,
    status: 'locked',
    icon: Star,
    textColor: 'text-slate-500',
    coverFrom: 'from-slate-300',
    coverTo: 'to-slate-400',
    duration: 'ไม่จำกัดเวลา',
    limitPerSeller: 'ได้ 1 ครั้ง / ทริป',
  },
  {
    id: '8',
    category: 'ยอดขาย',
    title: 'ทำยอดขาย 10,000 บาท',
    description: 'สะสมยอดขายรวมถึง 10,000 บาท จากการจองทริปของลูกค้าทั้งหมด',
    fullDescription:
      'ยอดขายสะสมคำนวณจากการจองที่ได้รับการยืนยันและชำระเงินแล้ว เมื่อยอดรวมถึง 10,000 บาท ระบบจะมอบ Coins ให้โดยอัตโนมัติ',
    conditions: [
      'คำนวณจากยอดชำระจริงเท่านั้น',
      'ไม่นับการจองที่ถูกยกเลิก',
      'นับสะสมตั้งแต่วันที่เริ่มใช้งาน',
    ],
    howTo: [
      'รับการจองแรกให้สำเร็จก่อน',
      'สะสมยอดขายอย่างต่อเนื่อง',
      'ตรวจสอบความคืบหน้าในหน้านี้',
      'Coins จะมอบอัตโนมัติเมื่อถึงเป้า',
    ],
    reward: 500,
    status: 'locked',
    icon: Target,
    textColor: 'text-slate-500',
    coverFrom: 'from-slate-300',
    coverTo: 'to-slate-400',
    duration: 'ไม่จำกัดเวลา',
    limitPerSeller: '1 ครั้ง ตลอดชีพ',
  },
]

// ─── Derived stats ──────────────────────────────────────────────────────────

const totalActivities = ACTIVITIES.length
const completedCount = ACTIVITIES.filter(a => a.status === 'completed').length
const coinsEarned = ACTIVITIES.filter(a => a.status === 'completed').reduce((s, a) => s + a.reward, 0)
const coinsAvailable = ACTIVITIES.filter(a => a.status === 'available' || a.status === 'in_progress').reduce((s, a) => s + a.reward, 0)
const completionPct = Math.round((completedCount / totalActivities) * 100)

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CFG = {
  available:   { label: 'พร้อมทำ',          dot: 'bg-blue-500',    text: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  in_progress: { label: 'กำลังดำเนินการ',   dot: 'bg-amber-500',   text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  completed:   { label: 'สำเร็จแล้ว',       dot: 'bg-emerald-500', text: 'text-emerald-700',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  locked:      { label: 'ยังไม่พร้อม',      dot: 'bg-slate-300',   text: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-slate-200' },
}

type Filter = 'all' | Status
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',         label: 'ทั้งหมด' },
  { value: 'available',   label: 'พร้อมทำ' },
  { value: 'in_progress', label: 'กำลังทำ' },
  { value: 'completed',   label: 'สำเร็จแล้ว' },
  { value: 'locked',      label: 'ล็อก' },
]

// ─── StatusPill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Status }) {
  const c = STATUS_CFG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

// ─── ActivityModal ──────────────────────────────────────────────────────────

function ActivityModal({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  const Icon = activity.icon
  const isCompleted  = activity.status === 'completed'
  const isLocked     = activity.status === 'locked'
  const isInProgress = activity.status === 'in_progress'
  const isAvailable  = activity.status === 'available'
  const pct = activity.progress
    ? Math.round((activity.progress.current / activity.progress.total) * 100)
    : 0

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={activity.title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease' }}
      />

      {/* Modal panel */}
      <div
        className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col"
        style={{ animation: 'slideUp 0.25s cubic-bezier(0.32,0.72,0,1)' }}
      >
        {/* ── Cover ────────────────────────────────── */}
        <div className={`relative h-48 flex-shrink-0 bg-gradient-to-br ${activity.coverFrom} ${activity.coverTo}
          ${isLocked || isCompleted ? 'grayscale-[30%] opacity-80' : ''}`}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)', animation: 'shimmer 2.5s infinite' }}
            />
          </div>
          {/* Skeleton lines */}
          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
            <div className="h-2.5 rounded-full bg-white/20 w-1/2" />
            <div className="h-2 rounded-full bg-white/15 w-1/3" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/20
              flex items-center justify-center text-white hover:bg-black/50 transition-colors duration-150 cursor-pointer"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Coin badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-sm font-bold text-white">+{activity.reward} coins</span>
          </div>

          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl flex items-center justify-center">
              {isLocked
                ? <Lock className="w-7 h-7 text-slate-400" />
                : isCompleted
                  ? <Icon className="w-7 h-7 text-slate-400" />
                  : <Icon className={`w-7 h-7 ${activity.textColor}`} />
              }
            </div>
          </div>

          {/* Completed checkmark */}
          {isCompleted && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-bold text-white">สำเร็จแล้ว</span>
            </div>
          )}
        </div>

        {/* ── Scrollable body ───────────────────────── */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <div className="p-5 space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {activity.category}
                </p>
                <h2 className="text-xl font-bold text-slate-800 leading-snug">{activity.title}</h2>
              </div>
              <StatusPill status={activity.status} />
            </div>

            {/* Full description */}
            <p className="text-sm text-slate-600 leading-relaxed">{activity.fullDescription}</p>

            {/* Progress (in_progress) */}
            {isInProgress && activity.progress && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-amber-800">ความคืบหน้า</span>
                  <span className="text-xs font-bold text-amber-800">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-amber-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700"
                    style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-amber-700">{activity.progress.label}</p>
              </div>
            )}

            {/* Completed info */}
            {isCompleted && activity.completedAt && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">กิจกรรมนี้สำเร็จแล้ว</p>
                  <p className="text-xs text-emerald-600">เสร็จเมื่อ {activity.completedAt}</p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* How to */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ListChecks className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">วิธีทำ</h3>
              </div>
              <ol className="space-y-2">
                {activity.howTo.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#176daf]/10 text-[#176daf] text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-slate-600 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">เงื่อนไข</h3>
              </div>
              <ul className="space-y-2">
                {activity.conditions.map((cond, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" />
                    <span className="text-xs text-slate-500 leading-relaxed">{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ระยะเวลา</span>
                </div>
                <p className="text-sm font-semibold text-slate-700">{activity.duration}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">จำนวนครั้ง</span>
                </div>
                <p className="text-sm font-semibold text-slate-700">{activity.limitPerSeller}</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Footer CTA ────────────────────────────── */}
        <div className="flex-shrink-0 p-4 border-t border-slate-100 bg-white">
          {/* Reward summary */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs text-slate-400">รางวัลที่ได้รับ</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Coins className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-base font-bold text-amber-600 tabular-nums">+{activity.reward} coins</span>
              </div>
              <span className="text-xs text-slate-400">≈ ฿{activity.reward}</span>
            </div>
          </div>

          {/* Action button */}
          {isCompleted ? (
            <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">ได้รับ Coins แล้ว</span>
            </div>
          ) : isLocked ? (
            <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-50 border border-slate-200">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-400">ทำกิจกรรมก่อนหน้าให้สำเร็จก่อน</span>
            </div>
          ) : isInProgress ? (
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm
              hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-150 cursor-pointer
              shadow-md shadow-amber-200">
              <Clock className="w-4 h-4" />
              กำลังดำเนินการอยู่
            </button>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-[#176daf] text-white font-semibold text-sm
              hover:bg-[#1460a0] active:scale-[0.98] transition-all duration-150 cursor-pointer
              shadow-md shadow-blue-200">
              รับกิจกรรมนี้
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ActivityCard ───────────────────────────────────────────────────────────

function ActivityCard({ activity, onOpen }: { activity: Activity; onOpen: () => void }) {
  const Icon = activity.icon
  const isLocked     = activity.status === 'locked'
  const isCompleted  = activity.status === 'completed'
  const isInProgress = activity.status === 'in_progress'
  const pct = activity.progress
    ? Math.round((activity.progress.current / activity.progress.total) * 100)
    : 0

  return (
    <article
      className={`group relative flex flex-col bg-white rounded-2xl border overflow-hidden transition-all duration-200
        ${isLocked
          ? 'border-slate-100 opacity-60 cursor-not-allowed'
          : isCompleted
            ? 'border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5'
            : 'border-slate-200 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-slate-300'
        }`}
      onClick={isLocked ? undefined : onOpen}
    >
      {/* ── Cover skeleton ────────────────── */}
      <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${activity.coverFrom} ${activity.coverTo}
        ${isLocked || isCompleted ? 'opacity-60 grayscale-[40%]' : ''}`}
      >
        {/* Shimmer sweep */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', animation: 'shimmer 2.2s infinite' }}
          />
        </div>
        {/* Skeleton content lines */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="h-2.5 rounded-full bg-white/20 w-3/5" />
          <div className="h-2 rounded-full bg-white/15 w-2/5" />
        </div>
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
        />
        {/* Coin badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-xs font-bold text-white tabular-nums">+{activity.reward}</span>
          </div>
        </div>
        {/* Status badge */}
        <div className="absolute top-3 right-3 z-10">
          <StatusPill status={activity.status} />
        </div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-14 h-14 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl flex items-center justify-center
            ${!isLocked && !isCompleted ? 'group-hover:scale-110 transition-transform duration-300' : ''}`}
          >
            {isLocked
              ? <Lock className="w-6 h-6 text-slate-400" />
              : isCompleted
                ? <Icon className="w-6 h-6 text-slate-400" />
                : <Icon className={`w-6 h-6 ${activity.textColor}`} />
            }
          </div>
        </div>
        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute inset-0 flex items-end justify-end p-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-bold text-white">สำเร็จแล้ว</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{activity.category}</p>
          <h3 className={`text-sm font-bold leading-snug
            ${isLocked ? 'text-slate-400' : isCompleted ? 'text-slate-500' : 'text-slate-800'}`}
          >
            {activity.title}
          </h3>
        </div>

        <p className={`text-xs leading-relaxed line-clamp-2 flex-1
          ${isLocked || isCompleted ? 'text-slate-400' : 'text-slate-500'}`}
        >
          {activity.description}
        </p>

        {/* Progress */}
        {isInProgress && activity.progress && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[11px] font-medium text-amber-700">{activity.progress.label}</span>
              <span className="text-[11px] font-bold text-amber-700">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700"
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Completed date */}
        {isCompleted && activity.completedAt && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            เสร็จเมื่อ {activity.completedAt}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
              ${isCompleted ? 'bg-emerald-100' : isLocked ? 'bg-slate-100' : 'bg-amber-100'}`}
            >
              <Coins className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-500' : isLocked ? 'text-slate-400' : 'text-amber-500'}`} />
            </div>
            <span className={`text-sm font-bold tabular-nums
              ${isCompleted ? 'text-emerald-600' : isLocked ? 'text-slate-400' : 'text-amber-600'}`}
            >
              {isCompleted ? '' : '+'}{activity.reward}
              <span className="text-[11px] font-medium text-slate-400 ml-1">coins</span>
            </span>
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />รับแล้ว
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
              <Lock className="w-3.5 h-3.5" />ล็อกอยู่
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onOpen() }}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold
                bg-[#176daf] text-white hover:bg-[#1460a0] active:scale-[0.97]
                transition-all duration-150 shadow-sm shadow-blue-200/60 cursor-pointer
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176daf]"
            >
              ดูรายละเอียด<ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [filter, setFilter]       = useState<Filter>('all')
  const [selected, setSelected]   = useState<Activity | null>(null)

  const filtered = filter === 'all' ? ACTIVITIES : ACTIVITIES.filter(a => a.status === filter)
  const openModal  = useCallback((a: Activity) => setSelected(a), [])
  const closeModal = useCallback(() => setSelected(null), [])

  return (
    <div className="min-h-dvh bg-slate-50">
      <style>{`
        @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideUp  { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-10 space-y-6">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl"
          style={{ background: 'linear-gradient(135deg,#0f1b2d 0%,#176daf 100%)' }}
        >
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px)' }}
          />
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 mb-5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-white/80 tracking-wide">ACTIVITY CENTER</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-2">ศูนย์กิจกรรม</h1>
                <p className="text-blue-200/80 text-sm leading-relaxed max-w-md mb-7">ทำกิจกรรมเพื่อสะสม Coins แลกเป็นเงินสด ยิ่งทำมาก ยิ่งได้มาก</p>
                <div className="max-w-sm space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-200/70 font-medium">ความคืบหน้าโดยรวม</span>
                    <span className="text-white font-bold">{completedCount}/{totalActivities} กิจกรรม</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-700"
                      style={{ width: `${completionPct}%` }} />
                  </div>
                  <p className="text-[11px] text-blue-200/50">{completionPct}% สำเร็จแล้ว</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[220px]">
                <div className="flex-1 lg:flex-none flex items-center gap-4 px-5 py-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] text-blue-200/60 font-medium mb-0.5">Coins ที่ได้รับแล้ว</p>
                    <p className="text-2xl font-bold text-white tabular-nums">{coinsEarned}</p>
                    <p className="text-[11px] text-amber-300/80">≈ ฿{coinsEarned.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex-1 lg:flex-none flex items-center gap-4 px-5 py-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-[11px] text-blue-200/60 font-medium mb-0.5">รอรับได้อีก</p>
                    <p className="text-2xl font-bold text-white tabular-nums">{coinsAvailable}</p>
                    <p className="text-[11px] text-blue-200/60">coins จากกิจกรรมที่ยังทำได้</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quick stats ───────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Award,       iconColor: 'text-[#176daf]',   iconBg: 'bg-blue-50',   label: 'กิจกรรมทั้งหมด',  value: totalActivities,                                          unit: 'กิจกรรม', sub: 'รวมทุกประเภท' },
            { icon: CheckCircle2,iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50',label: 'สำเร็จแล้ว',       value: completedCount,                                           unit: 'กิจกรรม', sub: `${completionPct}% ของทั้งหมด` },
            { icon: Zap,         iconColor: 'text-amber-600',   iconBg: 'bg-amber-50',  label: 'พร้อมทำตอนนี้',   value: ACTIVITIES.filter(a => a.status === 'available').length,  unit: 'กิจกรรม', sub: 'ไม่ต้องรอ ทำได้เลย' },
            { icon: Coins,       iconColor: 'text-amber-600',   iconBg: 'bg-amber-50',  label: 'Coins สะสมแล้ว',  value: coinsEarned,                                              unit: 'coins',   sub: `≈ ฿${coinsEarned.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex items-start gap-4 transition-shadow duration-200 hover:shadow-sm">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium mb-1 leading-none">{s.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-800 tabular-nums">{s.value}</span>
                  <span className="text-xs text-slate-400">{s.unit}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Activity grid ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">รายการกิจกรรม</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {filtered.length} กิจกรรม{filter !== 'all' && ` · ${FILTERS.find(f => f.value === filter)?.label}`}
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-100 rounded-xl shadow-xs overflow-x-auto">
              {FILTERS.map(tab => (
                <button key={tab.value} onClick={() => setFilter(tab.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer
                    ${filter === tab.value ? 'bg-[#176daf] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">ไม่มีกิจกรรมในหมวดนี้</p>
              <p className="text-xs text-slate-400 mt-1">ลองเลือกหมวดอื่น</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(activity => (
                <ActivityCard key={activity.id} activity={activity} onOpen={() => openModal(activity)} />
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-slate-400 pb-2">1 coin = ฿1 · กิจกรรมใหม่จะถูกเพิ่มทุกเดือน</p>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      {selected && <ActivityModal activity={selected} onClose={closeModal} />}
    </div>
  )
}
