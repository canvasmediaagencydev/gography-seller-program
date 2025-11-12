# 📧 ThaiBulkSMS Email API – คู่มือการใช้งานฉบับสมบูรณ์

คู่มือการใช้งาน API ส่งอีเมลผ่านระบบ ThaiBulkSMS สำหรับนักพัฒนา
โดยใช้ **API Key / Secret** เพื่อความปลอดภัย และรองรับการส่งอีเมลด้วย **Template + Merge Tag**

**เวอร์ชัน:** 1.1
**อัปเดตล่าสุด:** 2025-01-12

---

## 📑 สารบัญ

1. [ภาพรวมระบบ](#-ภาพรวมระบบ)
2. [การตั้งค่าเบื้องต้น](#-การตั้งค่าเบื้องต้น)
3. [การตั้งค่า Email Sender Profile](#-การตั้งค่า-email-sender-profile-สำคัญ)
4. [การสร้าง Email Template](#-การสร้าง-email-template)
5. [การส่งอีเมลผ่าน API](#-การส่งอีเมลผ่าน-api)
6. [ตัวอย่างโค้ดการใช้งาน](#-ตัวอย่างโค้ดการใช้งาน)
7. [Error Codes และการแก้ไข](#-error-response)
8. [Best Practices](#-best-practices)
9. [Troubleshooting](#-troubleshooting)

---

## 🧩 ภาพรวมระบบ

Email API จาก **ThaiBulkSMS (1Moby Co., Ltd.)**
รองรับการทำงานดังนี้:

- ใช้ **API Key / Secret** แทน Username/Password
- Response เป็น **JSON**
- รองรับ **Merge Tag** สำหรับข้อความเฉพาะบุคคล
- รองรับการส่งด้วย **Template UUID**
- สามารถเชื่อม **Webhook** เพื่อรับสถานะการส่ง (Delivery Report)
- รองรับการจำกัด IP ด้วย **IP Whitelist**
- **รองรับ Email Sender Profile** (รูปโปรไฟล์ผู้ส่ง)

---

## 🚀 การส่งอีเมลผ่าน API

**Endpoint**
```
POST https://tbs-email-api-gateway.omb.to/email/v1/send_template
```

**Authorization**
```
Basic Auth:
Username = {API_KEY}
Password = {API_SECRET}
```

### 🔧 Request Parameters

| Parameter | Type | Description |
|------------|------|-------------|
| `template_id` | uuid | รหัส UUID ของเทมเพลตอีเมล (คัดลอกจาก Dashboard) |
| `payload` | string | ค่าของ Merge Tag (ข้อมูลเฉพาะแต่ละผู้รับ) |
| `mail_from` | string | อีเมลผู้ส่ง |
| `name` | string | ชื่อแสดงผู้ส่ง |
| `mail_to` | string | อีเมลผู้รับ |
| `subject` | string | หัวข้ออีเมล |

### 🧱 ตัวอย่าง Request JSON
```json
{
  "template_id": "d8d5d980-xxxx-xxxx-xxxx-xxxxxxxxxx",
  "payload": {
    "FIRST_NAME": "John"
  },
  "mail_from": "noreply@company.com",
  "name": "Company Team",
  "mail_to": "customer@example.com",
  "subject": "ยินดีต้อนรับคุณ John!"
}
```

### 🧾 ตัวอย่าง Response
```json
{
  "message_id": "664b7625-981e-4b2a-b174-0c0e2c234d45",
  "credit_type": "email",
  "credit_used": 1,
  "credit_remain": 29954
}
```

---

## 🔧 การตั้งค่าเบื้องต้น

### 🔑 ขั้นตอนที่ 1: การสร้าง API Key / Secret

1. เข้าสู่ระบบ [https://dashboard.thaibulksms.com](https://dashboard.thaibulksms.com)
2. ไปที่ **ตั้งค่า > API Key**
3. คลิก **"สร้าง API Key"**
   - กรอกชื่อโปรเจกต์ (เช่น "MyEmailApp")
   - ใส่ **Webhook URL** (เฉพาะแพ็กเกจ Corporate - ไม่บังคับ)
   - ตั้งค่า **IP Whitelist** (ไม่บังคับ แต่แนะนำสำหรับความปลอดภัย)
4. ระบบจะสร้าง **API Key** และ **API Secret**
5. **⚠️ สำคัญ:** คัดลอกและเก็บรักษาทั้งสองค่าไว้อย่างปลอดภัย (จะไม่สามารถดูอีกครั้งได้)

### 💾 การจัดเก็บ Credentials

สร้างไฟล์ `.env.local` หรือ `.env` (แล้วแต่โปรเจกต์):

```bash
EMAIL_API_KEY=your_api_key_here
EMAIL_API_SECRET=your_api_secret_here
TEMPLATE_ID=your_template_uuid_here
```

**⚠️ อย่าลืม:** เพิ่ม `.env.local` ใน `.gitignore` เพื่อไม่ให้ commit ขึ้น Git

---

## 👤 การตั้งค่า Email Sender Profile (สำคัญ!)

### ⚠️ ข้อสำคัญ

**รูปโปรไฟล์และโลโก้ของผู้ส่งอีเมล ไม่สามารถส่งผ่าน API ได้**

คุณ**ต้องตั้งค่าผ่าน Dashboard ก่อน** แล้วค่อยใช้อีเมลนั้นใน API

### 📝 ขั้นตอนที่ 2: ลงทะเบียน Email Sender

1. เข้า **Dashboard** > **Email Settings** หรือ **Sender Management**
2. คลิก **"เพิ่มอีเมลผู้ส่ง"** (Add Sender Email)
3. กรอกข้อมูล:
   - **Email Address**: เช่น `noreply@yourdomain.com`, `support@paydee.me`
   - **Display Name**: ชื่อที่จะแสดง เช่น "Paydee Team", "Company Support"
   - **Profile Picture/Logo**: อัปโหลดรูป (แนะนำ 200x200px, PNG/JPG)
4. คลิก **"ยืนยัน"** หรือ **"Submit"**
5. ระบบจะส่ง **Verification Email** ไปที่อีเมลที่ระบุ
6. คลิกลิงก์ยืนยันในอีเมล
7. รอ**อนุมัติ** (อาจใช้เวลา 1-24 ชั่วโมง)

### 🔐 ขั้นตอนที่ 3: Email Authentication (แนะนำ)

เพื่อเพิ่ม deliverability และลดโอกาสติด spam:

#### SPF Record
เพิ่ม TXT record ใน DNS ของโดเมน:
```
v=spf1 include:_spf.thaibulksms.com ~all
```

#### DKIM
- ThaiBulkSMS จะให้ DKIM key หลังจากลงทะเบียนอีเมล
- เพิ่ม CNAME record ใน DNS ตามที่ระบุ

#### DMARC (ไม่บังคับแต่แนะนำ)
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### ✅ การตรวจสอบ

หลังจากลงทะเบียนสำเร็จ:
- อีเมลผู้ส่งจะปรากฏในรายการ "Verified Senders"
- สถานะจะเป็น **"Active"** หรือ **"Verified"**
- รูปโปรไฟล์จะแสดงเมื่อส่งอีเมล

**❌ หากไม่ลงทะเบียน:** API จะ return error `ERROR_SENDER_EMAIL_NOT_FOUND`

---

## 📧 การสร้าง Email Template

### ขั้นตอนที่ 4: สร้าง Template

1. ไปที่ **Dashboard** > **Email Templates** หรือ **เทมเพลตอีเมล**
2. คลิก **"สร้างเทมเพลตใหม่"** (Create New Template)
3. เลือกวิธีการสร้าง:
   - **ใช้เทมเพลตสำเร็จรูป** (เลือกจากคลัง)
   - **สร้างเอง** (HTML Editor)
   - **อัปโหลด HTML** (Upload HTML file)

### 🏷️ การใช้ Merge Tags

Merge Tags ใช้แทนที่ข้อมูลเฉพาะบุคคล:

**ตัวอย่างใน Template:**
```html
<h1>สวัสดีคุณ {{FIRST_NAME}}</h1>
<p>อีเมลของคุณคือ: {{EMAIL}}</p>
<p>รหัสคำสั่งซื้อ: {{ORDER_ID}}</p>
```

**ตัวอย่างใน API Payload:**
```json
{
  "FIRST_NAME": "สมชาย",
  "EMAIL": "somchai@example.com",
  "ORDER_ID": "ORD-12345"
}
```

**ผลลัพธ์ที่ผู้รับเห็น:**
```
สวัสดีคุณ สมชาย
อีเมลของคุณคือ: somchai@example.com
รหัสคำสั่งซื้อ: ORD-12345
```

### 📋 Merge Tags ที่แนะนำ

| Tag | คำอธิบาย | ตัวอย่าง |
|-----|---------|---------|
| `{{FIRST_NAME}}` | ชื่อจริง | "สมชาย" |
| `{{LAST_NAME}}` | นามสกุล | "ใจดี" |
| `{{EMAIL}}` | อีเมลผู้รับ | "somchai@example.com" |
| `{{PHONE}}` | เบอร์โทรศัพท์ | "081-234-5678" |
| `{{ORDER_ID}}` | รหัสคำสั่งซื้อ | "ORD-12345" |
| `{{AMOUNT}}` | ยอดเงิน | "1,250.00" |
| `{{DATE}}` | วันที่ | "12 มกราคม 2568" |
| `{{LINK}}` | ลิงก์ | "https://example.com/verify" |

### 💾 บันทึก Template

1. คลิก **"บันทึก"** (Save)
2. ตั้งชื่อเทมเพลต (เช่น "Welcome Email", "Order Confirmation")
3. ระบบจะสร้าง **Template UUID** (เช่น `d8d5d980-xxxx-xxxx-xxxx-xxxxxxxxxx`)
4. **คัดลอก UUID** นี้ไว้ใช้งานใน API

---

## 🔁 การสร้าง Webhook (Delivery Report)

ใช้เพื่อรับข้อมูลสถานะการส่งอีเมล (DR)

- สร้าง endpoint เช่น  
  ```
  https://yourdomain.com/callback_dr
  ```
- นำลิงก์นี้ไปผูกกับ API Key ใน Dashboard  
- ตัวอย่างข้อมูลที่ ThaiBulkSMS ส่งกลับ:
  ```
  message_id=5025d86e-2741-4829-9028-bec9bb6xxxxx&
  recipient=example@mail.com&
  status=delivered&
  reason=success&
  click_url=https://example.com
  ```

---

## 🔒 IP Whitelist

สามารถระบุ IP ที่อนุญาตให้เรียกใช้ API ได้  
> หาก IP ไม่ตรงกับที่ตั้งค่าไว้ จะไม่สามารถใช้งาน API ได้

แนะนำให้ใช้ **Fixed IP** เพื่อความปลอดภัย

---

## 💳 ตรวจสอบเครดิตคงเหลือ

**Endpoint**
```
GET https://tbs-email-api-gateway.omb.to/email/v1/credit
```

**Authorization:**  
ใช้ Basic Auth (API Key / Secret)

**Response ตัวอย่าง**
```json
{
  "credit_remain": 29954
}
```

---

## ⚠️ Error Response

### โครงสร้าง Error
```json
{
  "statusCode": 404,
  "timestamp": "2024-01-10T10:14:48.814Z",
  "path": "/email/v1/send_template",
  "message": "ERROR_EMAIL_SENDER_NOT_FOUND"
}
```

### รายการรหัส Error สำคัญ

| Status | Code | Description |
|---------|------|-------------|
| 400 | `ERROR_CALLBACK_URL` | Callback URL ไม่ถูกต้อง |
| 401 | `ERROR_AUTHENTICATION_FAILED` | Authentication ผิด |
| 402 | `ERROR_INSUFFICIENT_CREDIT` | เครดิตไม่พอ |
| 403 | `ERROR_IP_NOT_ALLOWED` | IP ไม่อยู่ใน Whitelist |
| 404 | `ERROR_SENDER_EMAIL_NOT_FOUND` | ไม่พบอีเมลผู้ส่ง |
| 404 | `ERROR_TEMPLATE_EMAIL_NOT_FOUND` | ไม่พบเทมเพลต |

---

---

## 💻 ตัวอย่างโค้ดการใช้งาน

### Node.js / JavaScript (ES Modules)

```javascript
import axios from 'axios';

const API_KEY = process.env.EMAIL_API_KEY;
const API_SECRET = process.env.EMAIL_API_SECRET;
const TEMPLATE_ID = process.env.TEMPLATE_ID;

async function sendEmail(recipientEmail, firstName) {
  try {
    const response = await axios.post(
      'https://tbs-email-api-gateway.omb.to/email/v1/send_template',
      {
        template_uuid: TEMPLATE_ID,
        payload: {
          FIRST_NAME: firstName,
          EMAIL: recipientEmail
        },
        mail_from: {
          email: 'noreply@yourdomain.com',  // ต้องลงทะเบียนก่อน
          name: 'Your Company'
        },
        mail_to: {
          email: recipientEmail
        },
        subject: `ยินดีต้อนรับคุณ ${firstName}`
      },
      {
        auth: {
          username: API_KEY,
          password: API_SECRET
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Email sent:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
    throw error;
  }
}

// การใช้งาน
await sendEmail('customer@example.com', 'สมชาย');
```

### Next.js API Route

```typescript
// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { mail_to, first_name, mail_from, name, subject } = await request.json();

    // Validate
    if (!mail_to || !first_name || !mail_from || !name || !subject) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const apiKey = process.env.EMAIL_API_KEY;
    const apiSecret = process.env.EMAIL_API_SECRET;
    const templateId = process.env.TEMPLATE_ID;

    const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const response = await fetch(
      'https://tbs-email-api-gateway.omb.to/email/v1/send_template',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          template_uuid: templateId,
          payload: {
            FIRST_NAME: first_name,
            EMAIL: mail_to
          },
          mail_from: { email: mail_from, name },
          mail_to: { email: mail_to },
          subject
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to send email' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งอีเมลสำเร็จ',
      data
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Python

```python
import requests
import os
from requests.auth import HTTPBasicAuth

API_KEY = os.getenv('EMAIL_API_KEY')
API_SECRET = os.getenv('EMAIL_API_SECRET')
TEMPLATE_ID = os.getenv('TEMPLATE_ID')

def send_email(recipient_email, first_name):
    url = 'https://tbs-email-api-gateway.omb.to/email/v1/send_template'

    data = {
        'template_uuid': TEMPLATE_ID,
        'payload': {
            'FIRST_NAME': first_name,
            'EMAIL': recipient_email
        },
        'mail_from': {
            'email': 'noreply@yourdomain.com',
            'name': 'Your Company'
        },
        'mail_to': {
            'email': recipient_email
        },
        'subject': f'ยินดีต้อนรับคุณ {first_name}'
    }

    try:
        response = requests.post(
            url,
            json=data,
            auth=HTTPBasicAuth(API_KEY, API_SECRET),
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        response.raise_for_status()

        print('✅ Email sent:', response.json())
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'❌ Error: {e}')
        if hasattr(e.response, 'json'):
            print(e.response.json())
        raise

# การใช้งาน
send_email('customer@example.com', 'สมชาย')
```

---

## 📊 Best Practices

### 1. การจัดการ Credentials
- ✅ เก็บ API Key/Secret ใน environment variables
- ✅ ใช้ `.env.local` และเพิ่มใน `.gitignore`
- ❌ อย่า hard-code credentials ในโค้ด
- ❌ อย่า commit credentials ขึ้น Git

### 2. Error Handling
```javascript
try {
  const result = await sendEmail(email, name);
  // บันทึก message_id สำหรับ tracking
  await db.saveMessageId(result.message_id, email);
} catch (error) {
  if (error.response?.status === 402) {
    // เครดิตหมด - แจ้งเตือน admin
    await notifyAdmin('Email credit insufficient');
  } else if (error.response?.status === 404) {
    // Sender email ไม่ได้ลงทะเบียน
    console.error('Sender email not verified');
  }
  // Log error
  logger.error('Email send failed', { email, error });
}
```

### 3. Rate Limiting
- ส่งอีเมลทีละ batch (แนะนำ 10-50 emails/batch)
- ใส่ delay ระหว่าง requests (~100-200ms)
- ตรวจสอบเครดิตก่อนส่งจำนวนมาก

### 4. Validation
```javascript
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePayload(payload) {
  // ตรวจสอบว่า merge tags ครบถ้วน
  const requiredTags = ['FIRST_NAME', 'EMAIL'];
  return requiredTags.every(tag => payload[tag]);
}
```

### 5. Logging & Monitoring
- บันทึก `message_id` ทุกครั้งที่ส่งสำเร็จ
- Track delivery status ผ่าน Webhook
- ตั้งค่า alert เมื่อ error rate สูง
- Monitor เครดิตคงเหลือ

### 6. Template Management
- ใช้ Template ต่างกันสำหรับ purpose ต่างกัน
- ทดสอบ Template ก่อนใช้งานจริง
- เก็บ Template UUID ใน config/database

---

## 🔍 Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. `ERROR_SENDER_EMAIL_NOT_FOUND` (404)
**สาเหตุ:** อีเมลผู้ส่งยังไม่ได้ลงทะเบียนหรือยังไม่ verified

**วิธีแก้:**
- ตรวจสอบว่าอีเมลใน `mail_from.email` ตรงกับที่ลงทะเบียนใน Dashboard
- ตรวจสอบสถานะ verification (ต้องเป็น "Active")
- รอการอนุมัติจาก ThaiBulkSMS (อาจใช้เวลา 1-24 ชั่วโมง)

#### 2. `ERROR_AUTHENTICATION_FAILED` (401)
**สาเหตุ:** API Key หรือ Secret ไม่ถูกต้อง

**วิธีแก้:**
- ตรวจสอบว่า API_KEY และ API_SECRET ถูกต้อง
- ตรวจสอบว่าไม่มีช่องว่างหรืออักขระพิเศษปะปนใน credentials
- ลองสร้าง API Key ใหม่

#### 3. `ERROR_INSUFFICIENT_CREDIT` (402)
**สาเหตุ:** เครดิตไม่พอ

**วิธีแก้:**
- เติมเครดิตใน Dashboard
- ตรวจสอบเครดิตคงเหลือด้วย API `/credit`

#### 4. `ERROR_IP_NOT_ALLOWED` (403)
**สาเหตุ:** IP ไม่อยู่ใน Whitelist

**วิธีแก้:**
- เพิ่ม IP ของ server ใน Dashboard > API Key > IP Whitelist
- ถ้าใช้ dynamic IP ให้ปิด IP Whitelist หรือใช้ Fixed IP

#### 5. `ERROR_TEMPLATE_EMAIL_NOT_FOUND` (404)
**สาเหตุ:** Template UUID ไม่ถูกต้อง

**วิธีแก้:**
- ตรวจสอบ Template UUID ใน Dashboard
- คัดลอก UUID ใหม่อีกครั้ง
- ตรวจสอบว่า Template ไม่ถูกลบ

#### 6. อีเมลติด Spam
**สาเหตุ:** ยังไม่ตั้งค่า SPF, DKIM, DMARC

**วิธีแก้:**
- เพิ่ม SPF record ใน DNS
- ตั้งค่า DKIM ตามที่ ThaiBulkSMS แนะนำ
- เพิ่ม DMARC record
- หลีกเลี่ยงคำที่มักถูกมองว่าเป็น spam (FREE, WIN, CLICK HERE)

#### 7. Timeout Error
**สาเหตุ:** Network หรือ API response ช้า

**วิธีแก้:**
- เพิ่ม timeout ใน request (แนะนำ 10-30 วินาที)
- ตรวจสอบ network connection
- ลอง retry 2-3 ครั้ง with exponential backoff

### การ Debug

```javascript
// เปิด debug mode
const response = await axios.post(url, data, {
  auth: { username: API_KEY, password: API_SECRET },
  validateStatus: () => true  // รับทุก status code
});

console.log('Status:', response.status);
console.log('Headers:', response.headers);
console.log('Data:', response.data);

// ตรวจสอบ request body
console.log('Request body:', JSON.stringify(data, null, 2));
```

---

## ✅ Quick Start Checklist

- [ ] สร้าง API Key/Secret
- [ ] เก็บ credentials ใน `.env.local`
- [ ] **ลงทะเบียนอีเมลผู้ส่ง + อัปโหลดรูปโปรไฟล์**
- [ ] รอ verification email และยืนยัน
- [ ] ตั้งค่า SPF/DKIM record (แนะนำ)
- [ ] สร้าง Email Template พร้อม Merge Tags
- [ ] คัดลอก Template UUID
- [ ] ทดสอบส่งอีเมล 1-2 ฉบับ
- [ ] ตรวจสอบอีเมลที่ได้รับ
- [ ] ตั้งค่า Webhook (ถ้าต้องการ tracking)
- [ ] เริ่มใช้งานจริง

---

## 📞 การติดต่อ Support

- **เว็บไซต์:** [https://www.thaibulksms.com](https://www.thaibulksms.com)
- **Dashboard:** [https://dashboard.thaibulksms.com](https://dashboard.thaibulksms.com)
- **เบอร์โทร:** 02-798-6055
- **LINE ID:** @Thaibulksms
- **Email:** support@thaibulksms.com

---

## 📚 เอกสารเพิ่มเติม

- [ThaiBulkSMS Email API Reference](https://developer.thaibulksms.com/reference)
- [คู่มือการใช้งาน Email (TH)](https://www.thaibulksms.com/user-manual/email/)
- [FAQ](https://www.thaibulksms.com/faq)

---

> © 1Moby Co., Ltd. / ThaiBulkSMS
> **เวอร์ชัน:** 1.1
> **อัปเดต:** 12 มกราคม 2568
> ข้อมูลนี้สรุปจากเอกสาร "คู่มือการใช้งาน Email API (TH)" และประสบการณ์การใช้งานจริง
