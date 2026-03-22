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
  available:   { label: 'พร้อมทำ',          dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',    text: 'text-blue-700',   bg: 'bg-blue-50/80 backdrop-blur-sm',   border: 'border-blue-200' },
  in_progress: { label: 'กำลังดำเนินการ',   dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',   text: 'text-amber-700',  bg: 'bg-amber-50/80 backdrop-blur-sm',  border: 'border-amber-200' },
  completed:   { label: 'สำเร็จแล้ว',       dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]', text: 'text-emerald-700',bg: 'bg-emerald-50/80 backdrop-blur-sm',border: 'border-emerald-200' },
  locked:      { label: 'ยังไม่พร้อม',      dot: 'bg-slate-300',   text: 'text-slate-500',  bg: 'bg-slate-50/80 backdrop-blur-sm',  border: 'border-slate-200' },
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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.25 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border} shadow-sm transition-all duration-300`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse-slow`} />
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={activity.title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[8px]"
        onClick={onClose}
        style={{ animation: 'fade-in 0.3s ease-out forwards' }}
      />

      {/* Modal panel */}
      <div
        className="relative w-full sm:max-w-[540px] bg-white sm:rounded-[32px] rounded-t-[32px] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden max-h-[90dvh] flex flex-col transform-gpu"
        style={{ animation: 'slide-up-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* ── Cover ────────────────────────────────── */}
        <div className={`relative h-56 flex-shrink-0 bg-gradient-to-br ${activity.coverFrom} ${activity.coverTo} overflow-hidden
          ${isLocked ? 'grayscale-[50%] bg-blend-multiply opacity-90' : isCompleted ? 'opacity-90' : ''}`}
        >
          {/* Glass Overlay Effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
          
          {/* Animated Glow Orbs */}
          {!isLocked && (
             <div className="absolute inset-0 overflow-hidden opacity-50">
               <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[150%] bg-white/20 blur-3xl rounded-full transform rotate-45" />
               <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[150%] bg-white/10 blur-3xl rounded-full transform -rotate-45" />
             </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/20 backdrop-blur-xl border border-white/20
              flex items-center justify-center text-white/90 hover:bg-black/40 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg"
            aria-label="ปิด"
          >
            <X className="w-4 h-4 text-white font-bold" />
          </button>

          {/* Coin badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg group-hover:scale-105 transition-transform">
            <Coins className="w-4 h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
            <span className="text-[13px] font-bold text-white tracking-wide">+{activity.reward} coins</span>
          </div>

          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className={`w-20 h-20 rounded-3xl bg-white/90 backdrop-blur-xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.3)] flex items-center justify-center border border-white/40 transform group-hover:scale-110 transition-transform duration-500
              ${!isLocked && !isCompleted ? `shadow-[0_0_30px_rgba(255,255,255,0.4)] ring-4 ring-white/20` : ''}`}
            >
              {isLocked
                ? <Lock className="w-9 h-9 text-slate-400" />
                : isCompleted
                  ? <Icon className="w-9 h-9 text-emerald-500" />
                  : <Icon className={`w-9 h-9 ${activity.textColor} drop-shadow-md`} />
              }
            </div>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────── */}
        <div className="overflow-y-auto flex-1 overscroll-contain bg-slate-50/50">
          <div className="p-6 sm:p-8 space-y-7">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 mb-3">
                  <Star className="w-3 h-3 text-slate-500" />
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">
                    {activity.category}
                  </p>
                </div>
                <h2 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">{activity.title}</h2>
              </div>
              <div className="mt-1">
                <StatusPill status={activity.status} />
              </div>
            </div>

            {/* Full description */}
            <p className="text-[15px] text-slate-600 leading-relaxed">{activity.fullDescription}</p>

            {/* Progress (in_progress) */}
            {isInProgress && activity.progress && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 shadow-inner space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-amber-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" /> ความคืบหน้า
                  </span>
                  <div className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold shadow-sm">
                    {pct}%
                  </div>
                </div>
                <div className="h-3 rounded-full bg-amber-200/50 overflow-hidden shadow-inner p-0.5">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 relative overflow-hidden"
                    style={{ width: `${pct}%` }}>
                      {/* Animated stripes inside progress */}
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
                  </div>
                </div>
                <p className="text-xs font-medium text-amber-700/80">{activity.progress.label}</p>
              </div>
            )}

            {/* Completed info */}
            {isCompleted && activity.completedAt && (
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 shadow-inner border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 drop-shadow-sm" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900 mb-0.5">กิจกรรมนี้สำเร็จแล้ว</p>
                  <p className="text-[13px] font-medium text-emerald-700/80">เสร็จเมื่อ {activity.completedAt}</p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2" />

            {/* How to */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-[10px] bg-blue-50 flex items-center justify-center shadow-inner">
                  <ListChecks className="w-4 h-4 text-[#176daf]" />
                </div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">วิธีทำ</h3>
              </div>
              <ol className="space-y-3.5">
                {activity.howTo.map((step, i) => (
                  <li key={i} className="flex items-start gap-3.5 group">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#176daf]/10 text-[#176daf] text-xs font-bold flex items-center justify-center mt-0.5 border border-[#176daf]/20 group-hover:bg-[#176daf] group-hover:text-white transition-colors duration-300 shadow-sm">
                      {i + 1}
                    </span>
                    <span className="text-[14px] text-slate-600 leading-relaxed font-medium pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Conditions */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-[10px] bg-amber-50 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">เงื่อนไข</h3>
              </div>
              <ul className="space-y-3">
                {activity.conditions.map((cond, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-slate-300 mt-2 shadow-inner" />
                    <span className="text-[14px] text-slate-500 leading-relaxed">{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md hover:bg-white transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ระยะเวลา</span>
                </div>
                <p className="text-[14px] font-bold text-slate-700">{activity.duration}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md hover:bg-white transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">จำนวนครั้ง</span>
                </div>
                <p className="text-[14px] font-bold text-slate-700">{activity.limitPerSeller}</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Footer CTA ────────────────────────────── */}
        <div className="flex-shrink-0 p-5 sm:px-8 sm:py-6 bg-white border-t border-slate-100 rounded-b-[32px] z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          {/* Reward summary */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-bold text-slate-500">รางวัลที่ได้รับ</span>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-lg font-black text-amber-600 tabular-nums tracking-tight">+{activity.reward} coins</span>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">≈ ฿{activity.reward}</span>
            </div>
          </div>

          {/* Action button */}
          {isCompleted ? (
            <div className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 shadow-inner">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-[15px] font-bold text-emerald-700">ได้รับ Coins แล้ว</span>
            </div>
          ) : isLocked ? (
            <div className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-[14px] font-bold text-slate-500">ทำกิจกรรมก่อนหน้าให้สำเร็จก่อน</span>
            </div>
          ) : isInProgress ? (
            <button className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 py-4 rounded-2xl
              bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[15px]
              hover:from-amber-400 hover:to-orange-400 hover:shadow-[0_8px_25px_rgba(245,158,11,0.4)]
              active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-lg group">
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shine" />
              <Clock className="w-5 h-5 drop-shadow-md" />
              <span className="drop-shadow-sm">กำลังดำเนินการอยู่</span>
            </button>
          ) : (
            <button className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 py-4 rounded-2xl
              bg-[#176daf] text-white font-bold text-[15px]
              hover:bg-[#1f7cc4] hover:shadow-[0_8px_25px_rgba(23,109,175,0.4)]
              active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-lg group">
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shine" />
              <span className="drop-shadow-sm">รับกิจกรรมนี้</span>
              <ArrowRight className="w-5 h-5 drop-shadow-md group-hover:translate-x-1 transition-transform" />
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
  const isAvailable  = activity.status === 'available'
  const pct = activity.progress
    ? Math.round((activity.progress.current / activity.progress.total) * 100)
    : 0

  return (
    <article
      className={`group relative flex flex-col bg-white rounded-3xl border overflow-hidden transition-all duration-500 ease-out
        ${isLocked
          ? 'border-slate-100/60 opacity-60 cursor-not-allowed bg-slate-50/50 grayscale-[20%]'
          : isCompleted
            ? 'border-slate-200 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-slate-300'
            : isAvailable || isInProgress
              ? 'border-slate-200/80 shadow-md cursor-pointer hover:shadow-[0_12px_40px_-10px_rgba(23,109,175,0.2)] hover:-translate-y-1.5 hover:border-blue-300/50 hover:ring-2 hover:ring-blue-100 z-10'
              : ''
        }`}
      onClick={isLocked ? undefined : onOpen}
    >
      {/* Glow effect on hover for available ones */}
      {(isAvailable || isInProgress) && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      {/* ── Cover Area ────────────────── */}
      <div className={`relative h-48 sm:h-52 overflow-hidden bg-gradient-to-br ${activity.coverFrom} ${activity.coverTo}
        ${isLocked ? 'opacity-80' : isCompleted ? 'opacity-90' : ''}`}
      >
        {/* Soft Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30 z-10" />

        {/* Ambient Gradient Glows inside Cover */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-2xl rounded-full mix-blend-overlay group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 blur-2xl rounded-full mix-blend-overlay" />

        {/* Coin badge */}
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-hover:bg-white/30 transition-colors">
            <Coins className="w-4 h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
            <span className="text-xs font-black text-white tabular-nums tracking-wide">+{activity.reward}</span>
          </div>
        </div>
        
        {/* Status badge */}
        <div className="absolute top-4 right-4 z-20">
          <StatusPill status={activity.status} />
        </div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className={`relative w-16 h-16 rounded-[20px] bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex items-center justify-center border border-white/60
            ${!isLocked && !isCompleted ? 'group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-500 ease-out' : 'transition-transform duration-300'}
            `}
          >
            {/* Inner shimmer */}
            <div className="absolute inset-0 rounded-[20px] overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-tr from-transparent via-white/40 to-transparent transform -translate-x-full group-hover:animate-shine" />
            </div>

            {isLocked
              ? <Lock className="w-7 h-7 text-slate-400" />
              : isCompleted
                ? <CheckCircle2 className="w-8 h-8 text-emerald-500 relative z-10 drop-shadow-sm" />
                : <Icon className={`w-8 h-8 ${activity.textColor} relative z-10 drop-shadow-md`} />
            }
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────── */}
      <div className="flex flex-col flex-1 p-5 gap-3.5 relative z-20 bg-white">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3 h-3 text-amber-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{activity.category}</p>
          </div>
          <h3 className={`text-[17px] font-black leading-snug tracking-tight
            ${isLocked ? 'text-slate-500' : isCompleted ? 'text-slate-600' : 'text-slate-800'}`}
          >
            {activity.title}
          </h3>
        </div>

        <p className={`text-[13px] leading-[1.6] line-clamp-2 flex-1 font-medium
          ${isLocked || isCompleted ? 'text-slate-400' : 'text-slate-500'}`}
        >
          {activity.description}
        </p>

        {/* Progress */}
        {isInProgress && activity.progress && (
          <div className="space-y-2 py-1">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-bold text-amber-700/80 uppercase tracking-wide">{activity.progress.label}</span>
              <span className="text-[12px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden shadow-inner p-0.5 border border-slate-200/50">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 relative overflow-hidden"
                style={{ width: `${pct}%` }}>
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
              </div>
            </div>
          </div>
        )}

        {/* Completed date */}
        {isCompleted && activity.completedAt && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600/80 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            เสร็จเมื่อ {activity.completedAt}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner border
              ${isCompleted ? 'bg-emerald-50 border-emerald-100' : isLocked ? 'bg-slate-50 border-slate-100' : 'bg-amber-50 border-amber-100'}`}
            >
              <Coins className={`w-4 h-4 ${isCompleted ? 'text-emerald-500' : isLocked ? 'text-slate-400' : 'text-amber-500 drop-shadow-sm'}`} />
            </div>
            <span className={`text-[15px] font-black tabular-nums tracking-tight
              ${isCompleted ? 'text-emerald-600' : isLocked ? 'text-slate-400' : 'text-amber-600'}`}
            >
              {isCompleted ? '' : '+'}{activity.reward}
              <span className="text-xs font-semibold text-slate-400 ml-1">coins</span>
            </span>
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />รับแล้ว
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full shadow-inner border border-slate-200/50">
              <Lock className="w-3.5 h-3.5" />ล็อกอยู่
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onOpen() }}
              className="group/btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold
                bg-[#176daf] text-white hover:bg-[#1a5b8f] active:scale-[0.97]
                transition-all duration-300 shadow-[0_4px_12px_rgba(23,109,175,0.3)] hover:shadow-[0_6px_16px_rgba(23,109,175,0.4)] cursor-pointer
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176daf]
                overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover/btn:animate-shine" />
              ดูรายละเอียด<ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
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
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes slide-up-scale { 
          0%{transform: translateY(30px) scale(0.95); opacity:0;} 
          100%{transform: translateY(0) scale(1); opacity:1;} 
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes progress {
          0% { background-position: 0 0; }
          100% { background-position: 1rem 0; }
        }
        @keyframes shine {
          100% { transform: translateX(100%); }
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12 space-y-8">

        {/* ── Premium Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[32px] shadow-[0_20px_40px_-15px_rgba(23,109,175,0.4)] border border-blue-400/20"
          style={{ background: 'linear-gradient(135deg, #091321 0%, #11284a 50%, #176daf 100%)' }}
        >
          {/* Noise Texture */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
          />
          
          {/* Animated Glow Orbs & Light leaks */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-400/20 blur-[100px] pointer-events-none" style={{ animation: 'float-slow 8s ease-in-out infinite' }} />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" style={{ animation: 'float-slow 10s ease-in-out infinite reverse' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-cyan-400/10 blur-[60px] pointer-events-none mix-blend-screen" />

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

          <div className="relative px-6 py-10 sm:px-12 sm:py-14 z-10">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-sm">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-[11px] font-black text-white/90 tracking-[0.2em] uppercase">Seller Privileges</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-4 tracking-tight drop-shadow-md">
                  ศูนย์รวม<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">กิจกรรม</span>
                </h1>
                <p className="text-blue-100/80 text-[15px] sm:text-[17px] font-medium leading-relaxed max-w-xl mb-8">
                  ชวนคุณมาอัปสเปคโปรไฟล์ ทำภารกิจสุดท้าทายเพื่อสะสม Coins 
                  แล้วเปลี่ยนความพยายามเป็นเงินสด 
                  <span className="text-amber-300 ml-1">ยิ่งทำมาก ยิ่งคุ้มค่า!</span>
                </p>
                
                {/* Master Progress */}
                <div className="max-w-md p-5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 shadow-inner">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-white/80 font-bold flex items-center gap-2">
                       <Target className="w-4 h-4 text-emerald-400" /> ความคืบหน้าของภารกิจทั้งหมด
                    </span>
                    <span className="text-white font-black">{completedCount} <span className="text-white/50">/ {totalActivities}</span></span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-2 shadow-inner">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 relative"
                      style={{ width: `${completionPct}%` }}>
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-white/50 text-right">{completionPct}% สำเร็จแล้ว</p>
                </div>
              </div>

              {/* Glass Stats Cards Setup */}
              <div className="flex flex-col sm:flex-row gap-4 xl:w-[480px]">
                {/* Earned Card */}
                <div className="flex-1 group relative p-6 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300 hover:bg-white/[0.15]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 flex items-center justify-center border border-white/30">
                      <Coins className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <div>
                      <p className="text-[13px] text-white/70 font-bold mb-1 tracking-wide uppercase">Coins ที่ได้รับแล้ว</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-white tabular-nums tracking-tight">{coinsEarned}</p>
                        <span className="text-amber-300 font-bold text-sm">≈ ฿{coinsEarned.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Card */}
                <div className="flex-1 group relative p-6 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300 hover:bg-white/[0.15]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-md">
                      <TrendingUp className="w-6 h-6 text-cyan-300 drop-shadow-sm" />
                    </div>
                    <div>
                      <p className="text-[13px] text-white/70 font-bold mb-1 tracking-wide uppercase">รอรับได้อีก</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-white tabular-nums tracking-tight">{coinsAvailable}</p>
                        <span className="text-cyan-300 font-bold text-sm">coins</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quick stats ───────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Award,       iconColor: 'text-[#176daf]',   iconBg: 'bg-blue-50/80 ring-1 ring-blue-100',   label: 'กิจกรรมทั้งหมด',  value: totalActivities,                                          unit: 'รายการ', sub: 'รวมทุกประเภท' },
            { icon: CheckCircle2,iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50/80 ring-1 ring-emerald-100',label: 'ทำสำเร็จแล้ว',       value: completedCount,                                           unit: 'รายการ', sub: `${completionPct}% ของทั้งหมด` },
            { icon: Zap,         iconColor: 'text-amber-600',   iconBg: 'bg-amber-50/80 ring-1 ring-amber-100',  label: 'พร้อมทำตอนนี้',   value: ACTIVITIES.filter(a => a.status === 'available').length,  unit: 'รายการ', sub: 'ไม่ต้องรอ ลุยเลย!' },
            { icon: Coins,       iconColor: 'text-amber-600',   iconBg: 'bg-amber-50/80 ring-1 ring-amber-100',  label: 'Coins สะสมแล้ว',  value: coinsEarned,                                              unit: 'coins',   sub: `รวมมูลค่า ฿${coinsEarned.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="group bg-white rounded-3xl border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 px-6 flex items-center gap-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 cursor-default">
              <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${s.iconBg} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className={`w-6 h-6 ${s.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-500 font-bold tracking-wide uppercase mb-1 leading-none">{s.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-800 tabular-nums">{s.value}</span>
                  <span className="text-[13px] font-bold text-slate-400">{s.unit}</span>
                </div>
                <p className="text-[12px] font-medium text-slate-400 mt-0.5 truncate">{s.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Activity grid ─────────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Flame className="w-6 h-6 text-[#176daf]" /> รายการกิจกรรม
              </h2>
              <p className="text-[14px] font-medium text-slate-500 mt-1">
                แสดงผล {filtered.length} รายการ {filter !== 'all' && <span className="text-[#176daf]">({FILTERS.find(f => f.value === filter)?.label})</span>}
              </p>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-x-auto hide-scrollbar">
              {FILTERS.map(tab => (
                <button key={tab.value} onClick={() => setFilter(tab.value)}
                  className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold whitespace-nowrap transition-all duration-300 cursor-pointer
                    ${filter === tab.value 
                      ? 'bg-[#176daf] text-white shadow-[0_4px_12px_rgba(23,109,175,0.3)]' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-slate-200 py-24 text-center shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Zap className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-lg font-bold text-slate-700">ไม่มีกิจกรรมในหมวดหมู่นี้</p>
              <p className="text-sm font-medium text-slate-400 mt-1">ลองเปลี่ยนตัวกรองด้านบนเพื่อดูหมวดหมู่อื่นๆ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(activity => (
                <ActivityCard key={activity.id} activity={activity} onOpen={() => openModal(activity)} />
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-[13px] font-medium text-slate-400 pb-4 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> อัตราแลกเปลี่ยน 1 coin = ฿1 · มีกิจกรรมใหม่ส่งตรงให้คุณทุกเดือน
        </p>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      {selected && <ActivityModal activity={selected} onClose={closeModal} />}
    </div>
  )
}
