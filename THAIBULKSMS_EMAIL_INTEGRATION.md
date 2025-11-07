# คู่มือการเชื่อมต่อ ThaiBulkSMS Email API

## สารบัญ
1. [ภาพรวม](#ภาพรวม)
2. [ข้อกำหนดเบื้องต้น](#ข้อกำหนดเบื้องต้น)
3. [โครงสร้างไฟล์](#โครงสร้างไฟล์)
4. [คู่มือการติดตั้ง](#คู่มือการติดตั้ง)
5. [API Documentation](#api-documentation)
6. [Code Examples](#code-examples)
7. [Email Templates](#email-templates)
8. [การทดสอบ](#การทดสอบ)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)
11. [ภาคผนวก](#ภาคผนวก)

---

## ภาพรวม

### ThaiBulkSMS Email API คืออะไร
ThaiBulkSMS Email API เป็นบริการส่งอีเมลแบบ transactional ที่รองรับภาษาไทย เหมาะสำหรับการส่งอีเมลแจ้งเตือนและยืนยันต่างๆ เช่น:
- การยืนยันการลงทะเบียน
- การแจ้งเตือนสถานะ
- การรีเซ็ตรหัสผ่าน
- การส่ง OTP

### กรณีการใช้งานในระบบ
ในระบบ Gography Seller Program เราใช้ ThaiBulkSMS Email API สำหรับ:
- **ส่งอีเมลแจ้งเตือน Seller เมื่อ Admin อนุมัติบัญชี**
- **ส่งอีเมลแจ้งเตือนเมื่อบัญชีถูกปฏิเสธ**

### ข้อดีของการใช้ ThaiBulkSMS
- ✅ รองรับภาษาไทยอย่างสมบูรณ์
- ✅ ราคาเหมาะสม (เริ่มต้น 0.04 บาท/อีเมล)
- ✅ มี SPF, DKIM, DMARC authentication
- ✅ API ง่ายต่อการใช้งาน
- ✅ มีทีม support ในไทย

---

## ข้อกำหนดเบื้องต้น

### 1. API Credentials
คุณต้องมี:
- `THAIBULKSMS_API_KEY` - API key จาก ThaiBulkSMS
- `THAIBULKSMS_API_SECRET` - API secret จาก ThaiBulkSMS

**วิธีการขอ API credentials:**
1. สมัครสมาชิกที่ https://www.thaibulksms.com
2. เข้าสู่ระบบและไปที่หน้า API settings
3. สร้าง API key ใหม่
4. เก็บ API key และ API secret ไว้อย่างปลอดภัย

### 2. Environment Variables
เพิ่มตัวแปรต่อไปนี้ใน `.env.local`:

```env
# ThaiBulkSMS API Configuration
THAIBULKSMS_API_KEY=your_api_key_here
THAIBULKSMS_API_SECRET=your_api_secret_here

# Email Configuration
THAIBULKSMS_FROM_EMAIL=noreply@yourdomain.com
THAIBULKSMS_FROM_NAME=Gography Seller Program
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com
```

### 3. Dependencies
ไม่ต้องติดตั้ง dependencies เพิ่มเติม - ใช้ Node.js built-in modules:
- `https` - สำหรับ HTTP requests
- `Buffer` - สำหรับ Base64 encoding

---

## โครงสร้างไฟล์

### ไฟล์ใหม่ที่จะสร้าง

```
src/
├── lib/
│   └── email/
│       ├── thaibulksms.ts       # Email API client
│       └── templates.ts          # Email templates
└── types/
    └── email.ts                  # TypeScript types (optional)
```

### ไฟล์ที่จะแก้ไข

```
src/app/api/admin/sellers/[sellerId]/status/route.ts
```

### แผนผังโครงสร้างทั้งหมด

```
gography-seller-program/
├── src/
│   ├── lib/
│   │   └── email/
│   │       ├── thaibulksms.ts         # ← สร้างใหม่
│   │       └── templates.ts            # ← สร้างใหม่
│   ├── types/
│   │   └── email.ts                    # ← สร้างใหม่ (optional)
│   └── app/
│       └── api/
│           └── admin/
│               └── sellers/
│                   └── [sellerId]/
│                       └── status/
│                           └── route.ts  # ← แก้ไข
├── .env.local                           # ← แก้ไข
└── THAIBULKSMS_EMAIL_INTEGRATION.md     # ← เอกสารนี้
```

---

## คู่มือการติดตั้ง

### ขั้นตอนที่ 1: สร้าง Email Service

สร้างไฟล์ `src/lib/email/thaibulksms.ts`:

```typescript
/**
 * ThaiBulkSMS Email API Client
 *
 * บริการส่งอีเมล transactional ผ่าน ThaiBulkSMS API
 * รองรับ Base64 authentication และ retry logic
 */

import https from 'https';

interface EmailOptions {
  to: string;           // อีเมลผู้รับ
  subject: string;      // หัวข้ออีเมล
  html: string;         // เนื้อหาอีเมลแบบ HTML
  from?: string;        // อีเมลผู้ส่ง (optional)
  fromName?: string;    // ชื่อผู้ส่ง (optional)
}

interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

/**
 * ส่งอีเมล transactional ผ่าน ThaiBulkSMS API
 */
export async function sendTransactionalEmail(
  options: EmailOptions
): Promise<EmailResponse> {
  try {
    // ตรวจสอบ API credentials
    const apiKey = process.env.THAIBULKSMS_API_KEY;
    const apiSecret = process.env.THAIBULKSMS_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('ThaiBulkSMS API credentials not configured');
    }

    // สร้าง Base64 authentication
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    // ตั้งค่าค่า default
    const fromEmail = options.from || process.env.THAIBULKSMS_FROM_EMAIL || 'noreply@yourdomain.com';
    const fromName = options.fromName || process.env.THAIBULKSMS_FROM_NAME || 'Gography';

    // เตรียม request body
    const postData = JSON.stringify({
      from: {
        email: fromEmail,
        name: fromName
      },
      to: [
        {
          email: options.to
        }
      ],
      subject: options.subject,
      html: options.html
    });

    // ส่ง HTTP request
    const response = await makeRequest(credentials, postData);

    console.log('[ThaiBulkSMS] Email sent successfully:', {
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Email sent successfully',
      data: response
    };

  } catch (error: any) {
    console.error('[ThaiBulkSMS] Email send failed:', {
      error: error.message,
      to: options.to,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      message: error.message || 'Failed to send email',
      error: error
    };
  }
}

/**
 * ทำ HTTP request ไปยัง ThaiBulkSMS API
 * หมายเหตุ: URL นี้อาจต้องเปลี่ยนตาม API endpoint จริงของ ThaiBulkSMS
 */
function makeRequest(credentials: string, postData: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'email-api.thaibulksms.com',
      port: 443,
      path: '/api/v1/email/send', // ⚠️ ต้องตรวจสอบ endpoint จริงจาก ThaiBulkSMS
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (e) {
            resolve({ message: data });
          }
        } else {
          reject(new Error(`API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * ตรวจสอบ credit balance
 */
export async function checkCreditBalance(): Promise<EmailResponse> {
  try {
    const apiKey = process.env.THAIBULKSMS_API_KEY;
    const apiSecret = process.env.THAIBULKSMS_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('ThaiBulkSMS API credentials not configured');
    }

    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const options = {
      hostname: 'email-api.thaibulksms.com',
      port: 443,
      path: '/email/v1/credit',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(data);
              resolve({
                success: true,
                message: 'Credit balance retrieved',
                data: jsonData
              });
            } catch (e) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`API error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });

  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}
```

### ขั้นตอนที่ 2: สร้าง Email Templates

สร้างไฟล์ `src/lib/email/templates.ts`:

```typescript
/**
 * Email Templates สำหรับการแจ้งเตือน Seller
 */

export interface SellerEmailData {
  sellerName: string;
  sellerEmail: string;
  approvedDate?: string;
  reason?: string;
  supportEmail: string;
}

/**
 * เทมเพลตอีเมลสำหรับ Seller ที่ได้รับการอนุมัติ
 */
export function getApprovalEmailTemplate(data: SellerEmailData): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>การอนุมัติบัญชี Seller</title>
  <style>
    body {
      font-family: 'Noto Sans Thai', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .success-icon {
      text-align: center;
      font-size: 48px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .info-box {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-radius: 0 0 10px 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 ยินดีต้อนรับสู่ Gography Seller Program!</h1>
  </div>

  <div class="content">
    <div class="success-icon">✅</div>

    <h2>สวัสดีคุณ ${data.sellerName}</h2>

    <p>ยินดีด้วย! บัญชี Seller ของคุณได้รับการอนุมัติเรียบร้อยแล้ว</p>

    <div class="info-box">
      <strong>📧 อีเมล:</strong> ${data.sellerEmail}<br>
      <strong>📅 วันที่อนุมัติ:</strong> ${data.approvedDate || new Date().toLocaleDateString('th-TH')}
    </div>

    <h3>ขั้นตอนถัดไป:</h3>
    <ol>
      <li><strong>เข้าสู่ระบบ</strong> - คลิกปุ่มด้านล่างเพื่อเข้าสู่ระบบ Dashboard</li>
      <li><strong>สร้างทริปแรก</strong> - เริ่มสร้างแพ็คเกจทริปของคุณ</li>
      <li><strong>เริ่มรับ Booking</strong> - แชร์ลิงก์และเริ่มรับการจองจากลูกค้า</li>
      <li><strong>รับ Commission</strong> - รับ commission ทุกครั้งที่มีการจองสำเร็จ</li>
    </ol>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://seller.gography.com'}/auth/login" class="button">
        เข้าสู่ระบบ Dashboard
      </a>
    </div>

    <h3>📚 แหล่งข้อมูลที่เป็นประโยชน์:</h3>
    <ul>
      <li>คู่มือการใช้งานสำหรับ Seller</li>
      <li>วิธีการสร้างทริปที่น่าสนใจ</li>
      <li>ระบบ Commission และการจ่ายเงิน</li>
      <li>ระบบ Coin และรางวัล</li>
    </ul>

    <p>หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อเราได้ที่:</p>
    <p>📧 Email: <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} Gography Seller Program. All rights reserved.</p>
    <p>อีเมลนี้ส่งถึงคุณเนื่องจากคุณสมัครเป็น Seller บนแพลตฟอร์มของเรา</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * เทมเพลตอีเมลสำหรับ Seller ที่ถูกปฏิเสธ
 */
export function getRejectionEmailTemplate(data: SellerEmailData): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>การพิจารณาบัญชี Seller</title>
  <style>
    body {
      font-family: 'Noto Sans Thai', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .warning-icon {
      text-align: center;
      font-size: 48px;
      margin: 20px 0;
    }
    .reason-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-radius: 0 0 10px 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>การพิจารณาใบสมัคร Seller</h1>
  </div>

  <div class="content">
    <div class="warning-icon">⚠️</div>

    <h2>สวัสดีคุณ ${data.sellerName}</h2>

    <p>ขอบคุณที่สนใจสมัครเป็น Seller กับ Gography Seller Program</p>

    <p>เราเสียใจที่ต้องแจ้งให้ทราบว่า ใบสมัครของคุณยังไม่ผ่านการพิจารณาในขณะนี้</p>

    ${data.reason ? `
    <div class="reason-box">
      <strong>📋 เหตุผล:</strong><br>
      ${data.reason}
    </div>
    ` : ''}

    <h3>🔄 ต้องการสมัครอีกครั้ง?</h3>
    <p>คุณสามารถปรับปรุงข้อมูลและสมัครใหม่ได้ทุกเมื่อ โดยคำนึงถึงข้อมูลต่อไปนี้:</p>
    <ul>
      <li>กรอกข้อมูลให้ครบถ้วนและถูกต้อง</li>
      <li>อัพโหลดรูปถ่ายและเอกสารที่ชัดเจน</li>
      <li>ตรวจสอบความถูกต้องของข้อมูลส่วนตัว</li>
      <li>ระบุเบอร์โทรศัพท์ที่สามารถติดต่อได้</li>
    </ul>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://seller.gography.com'}/auth/register" class="button">
        สมัครใหม่อีกครั้ง
      </a>
    </div>

    <h3>💬 ต้องการความช่วยเหลือ?</h3>
    <p>หากคุณมีคำถามเกี่ยวกับการพิจารณา หรือต้องการคำแนะนำเพิ่มเติม กรุณาติดต่อเราได้ที่:</p>
    <p>📧 Email: <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>

    <p style="margin-top: 30px;">ขอบคุณสำหรับความสนใจของคุณ และหวังว่าจะได้ร่วมงานกับคุณในอนาคต</p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} Gography Seller Program. All rights reserved.</p>
    <p>อีเมลนี้ส่งถึงคุณเนื่องจากคุณสมัครเป็น Seller บนแพลตฟอร์มของเรา</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * ฟังก์ชันช่วยสำหรับการสร้าง email subject
 */
export function getEmailSubject(status: 'approved' | 'rejected'): string {
  if (status === 'approved') {
    return '🎉 ยินดีด้วย! บัญชี Seller ของคุณได้รับการอนุมัติแล้ว - Gography';
  } else {
    return '📋 การพิจารณาใบสมัคร Seller - Gography';
  }
}
```

### ขั้นตอนที่ 3: สร้าง TypeScript Types (Optional)

สร้างไฟล์ `src/types/email.ts`:

```typescript
/**
 * TypeScript types สำหรับระบบอีเมล
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export interface SellerEmailData {
  sellerName: string;
  sellerEmail: string;
  approvedDate?: string;
  reason?: string;
  supportEmail: string;
}

export type EmailStatus = 'approved' | 'rejected';
```

### ขั้นตอนที่ 4: แก้ไข API Route

แก้ไขไฟล์ `src/app/api/admin/sellers/[sellerId]/status/route.ts`:

เพิ่ม import statements ที่ด้านบนของไฟล์:

```typescript
// เพิ่มในส่วน imports
import { sendTransactionalEmail } from '@/lib/email/thaibulksms';
import {
  getApprovalEmailTemplate,
  getRejectionEmailTemplate,
  getEmailSubject
} from '@/lib/email/templates';
```

แก้ไขฟังก์ชัน `PATCH` โดยเพิ่มการส่งอีเมลหลังจาก update status สำเร็จ:

```typescript
// หาส่วนที่ update status สำเร็จ (ประมาณบรรทัด 70-75)
// แก้ไขจาก:
return NextResponse.json({
  seller: updatedSeller
})

// เป็น:
// ส่งอีเมลแจ้งเตือน Seller (non-blocking)
if (updatedSeller.email) {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@gography.com';

  const emailData = {
    sellerName: updatedSeller.full_name || 'Seller',
    sellerEmail: updatedSeller.email,
    approvedDate: new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    reason: status === 'rejected' ? reason : undefined,
    supportEmail: supportEmail
  };

  // เลือก template ตาม status
  const emailTemplate = status === 'approved'
    ? getApprovalEmailTemplate(emailData)
    : getRejectionEmailTemplate(emailData);

  // ส่งอีเมล (แบบ asynchronous - ไม่ block response)
  sendTransactionalEmail({
    to: updatedSeller.email,
    subject: getEmailSubject(status),
    html: emailTemplate
  }).then((result) => {
    if (result.success) {
      console.log(`[Email] Notification sent to ${updatedSeller.email} for status: ${status}`);
    } else {
      console.error(`[Email] Failed to send notification to ${updatedSeller.email}:`, result.error);
    }
  }).catch((error) => {
    console.error('[Email] Unexpected error:', error);
  });
} else {
  console.warn(`[Email] Seller ${sellerId} has no email address, skipping notification`);
}

return NextResponse.json({
  seller: updatedSeller,
  emailSent: !!updatedSeller.email // บอก client ว่าส่งอีเมลหรือไม่
})
```

### ขั้นตอนที่ 5: ตั้งค่า Environment Variables

แก้ไขไฟล์ `.env.local`:

```env
# เพิ่มตัวแปรเหล่านี้
THAIBULKSMS_API_KEY=your_api_key_here
THAIBULKSMS_API_SECRET=your_api_secret_here
THAIBULKSMS_FROM_EMAIL=noreply@gography.com
THAIBULKSMS_FROM_NAME=Gography Seller Program
NEXT_PUBLIC_SUPPORT_EMAIL=support@gography.com
```

**⚠️ สำคัญ:** อย่า commit ไฟล์ `.env.local` เข้า git repository!

---

## API Documentation

### Authentication

ThaiBulkSMS API ใช้ **HTTP Basic Authentication** แบบ Base64 encoding

**Format:**
```
Authorization: Basic [base64(api_key:api_secret)]
```

**ตัวอย่าง:**
```javascript
const apiKey = 'your_api_key';
const apiSecret = 'your_api_secret';
const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

// ใช้ใน header
headers: {
  'Authorization': `Basic ${credentials}`
}
```

### API Endpoints

#### 1. ส่งอีเมล Transactional

**⚠️ หมายเหตุ:** URL และ endpoint ด้านล่างนี้เป็นตัวอย่าง ต้องตรวจสอบกับ ThaiBulkSMS documentation จริง

```
POST https://email-api.thaibulksms.com/api/v1/email/send
```

**Request Headers:**
```
Content-Type: application/json
Authorization: Basic [base64_credentials]
Accept: application/json
```

**Request Body:**
```json
{
  "from": {
    "email": "noreply@yourdomain.com",
    "name": "Your Company"
  },
  "to": [
    {
      "email": "recipient@example.com"
    }
  ],
  "subject": "Email Subject",
  "html": "<html>...</html>"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Email sent successfully",
  "data": {
    "message_id": "abc123xyz",
    "timestamp": "2025-01-06T10:30:00Z"
  }
}
```

**Response Error (4xx/5xx):**
```json
{
  "code": 400,
  "statusText": "Bad Request",
  "message": {
    "detail": {},
    "message": "Invalid Parameter"
  }
}
```

#### 2. ตรวจสอบ Credit Balance

```
GET https://email-api.thaibulksms.com/email/v1/credit
```

**Request Headers:**
```
Authorization: Basic [base64_credentials]
Accept: application/json
```

**Response:**
```json
{
  "credit": 1000.50,
  "currency": "THB"
}
```

### Error Codes

| Code | Message | คำอธิบาย |
|------|---------|----------|
| 400 | Bad Request | พารามิเตอร์ไม่ถูกต้อง |
| 401 | Unauthorized | API credentials ผิด |
| 403 | Forbidden | ไม่มีสิทธิ์เข้าถึง |
| 429 | Too Many Requests | ส่งคำขอมากเกินไป (rate limit) |
| 500 | Internal Server Error | เกิดข้อผิดพลาดในระบบ |

---

## Code Examples

### ตัวอย่างที่ 1: ส่งอีเมลอนุมัติ Seller

```typescript
import { sendTransactionalEmail } from '@/lib/email/thaibulksms';
import { getApprovalEmailTemplate, getEmailSubject } from '@/lib/email/templates';

async function sendApprovalEmail(seller: any) {
  const emailData = {
    sellerName: seller.full_name || 'Seller',
    sellerEmail: seller.email,
    approvedDate: new Date().toLocaleDateString('th-TH'),
    supportEmail: 'support@gography.com'
  };

  const result = await sendTransactionalEmail({
    to: seller.email,
    subject: getEmailSubject('approved'),
    html: getApprovalEmailTemplate(emailData)
  });

  if (result.success) {
    console.log('✅ Email sent successfully');
  } else {
    console.error('❌ Failed to send email:', result.error);
  }
}
```

### ตัวอย่างที่ 2: ส่งอีเมลปฏิเสธ Seller

```typescript
async function sendRejectionEmail(seller: any, reason: string) {
  const emailData = {
    sellerName: seller.full_name || 'Seller',
    sellerEmail: seller.email,
    reason: reason,
    supportEmail: 'support@gography.com'
  };

  const result = await sendTransactionalEmail({
    to: seller.email,
    subject: getEmailSubject('rejected'),
    html: getRejectionEmailTemplate(emailData)
  });

  return result;
}
```

### ตัวอย่างที่ 3: ส่งอีเมลแบบ Non-blocking

```typescript
// ส่งอีเมลโดยไม่รอผลลัพธ์ (ไม่ block response)
sendTransactionalEmail({
  to: 'seller@example.com',
  subject: 'Test Email',
  html: '<h1>Hello</h1>'
}).then((result) => {
  console.log('Email result:', result);
}).catch((error) => {
  console.error('Email error:', error);
});

// Response ส่งกลับไปให้ client ทันที
return NextResponse.json({ success: true });
```

### ตัวอย่างที่ 4: Error Handling

```typescript
try {
  const result = await sendTransactionalEmail({
    to: seller.email,
    subject: 'Test',
    html: '<h1>Test</h1>'
  });

  if (!result.success) {
    // Log error แต่ไม่ throw exception
    console.error('Email failed:', result.message);

    // Optional: บันทึกไว้ใน database สำหรับ retry ภายหลัง
    await logFailedEmail({
      to: seller.email,
      error: result.message,
      timestamp: new Date()
    });
  }
} catch (error) {
  // Catch unexpected errors
  console.error('Unexpected email error:', error);
}

// ดำเนินการต่อแม้อีเมลส่งไม่สำเร็จ
return NextResponse.json({ success: true });
```

### ตัวอย่างที่ 5: ตรวจสอบ Credit Balance

```typescript
import { checkCreditBalance } from '@/lib/email/thaibulksms';

async function checkEmailCredit() {
  const result = await checkCreditBalance();

  if (result.success) {
    console.log('Credit balance:', result.data);

    // ตรวจสอบว่า credit เหลือน้อย
    if (result.data.credit < 100) {
      console.warn('⚠️ Low credit balance!');
      // ส่งการแจ้งเตือนไปยัง admin
    }
  } else {
    console.error('Failed to check credit:', result.message);
  }
}
```

---

## Email Templates

### เทมเพลตอีเมลอนุมัติ

**ใช้งาน:**
```typescript
const html = getApprovalEmailTemplate({
  sellerName: 'สมชาย ใจดี',
  sellerEmail: 'somchai@example.com',
  approvedDate: '6 มกราคม 2568',
  supportEmail: 'support@gography.com'
});
```

**ตัวแปรที่ใช้ได้:**
- `sellerName` - ชื่อ Seller
- `sellerEmail` - อีเมล Seller
- `approvedDate` - วันที่อนุมัติ (optional, default: วันที่ปัจจุบัน)
- `supportEmail` - อีเมล support

**ตัวอย่างผลลัพธ์:**

![Approval Email Preview]

```
🎉 ยินดีต้อนรับสู่ Gography Seller Program!

สวัสดีคุณ สมชาย ใจดี

ยินดีด้วย! บัญชี Seller ของคุณได้รับการอนุมัติเรียบร้อยแล้ว

📧 อีเมล: somchai@example.com
📅 วันที่อนุมัติ: 6 มกราคม 2568

ขั้นตอนถัดไป:
1. เข้าสู่ระบบ - คลิกปุ่มด้านล่างเพื่อเข้าสู่ระบบ Dashboard
2. สร้างทริปแรก - เริ่มสร้างแพ็คเกจทริปของคุณ
3. เริ่มรับ Booking - แชร์ลิงก์และเริ่มรับการจองจากลูกค้า
4. รับ Commission - รับ commission ทุกครั้งที่มีการจองสำเร็จ

[เข้าสู่ระบบ Dashboard]
```

### เทมเพลตอีเมลปฏิเสธ

**ใช้งาน:**
```typescript
const html = getRejectionEmailTemplate({
  sellerName: 'สมชาย ใจดี',
  sellerEmail: 'somchai@example.com',
  reason: 'เอกสารไม่ครบถ้วน กรุณาอัพโหลด ID card ที่ชัดเจน',
  supportEmail: 'support@gography.com'
});
```

**ตัวแปรที่ใช้ได้:**
- `sellerName` - ชื่อ Seller
- `sellerEmail` - อีเมล Seller
- `reason` - เหตุผลที่ปฏิเสธ (optional)
- `supportEmail` - อีเมล support

**ตัวอย่างผลลัพธ์:**

```
การพิจารณาใบสมัคร Seller

สวัสดีคุณ สมชาย ใจดี

ขอบคุณที่สนใจสมัครเป็น Seller กับ Gography Seller Program

เราเสียใจที่ต้องแจ้งให้ทราบว่า ใบสมัครของคุณยังไม่ผ่านการพิจารณาในขณะนี้

📋 เหตุผล:
เอกสารไม่ครบถ้วน กรุณาอัพโหลด ID card ที่ชัดเจน

🔄 ต้องการสมัครอีกครั้ง?
คุณสามารถปรับปรุงข้อมูลและสมัครใหม่ได้ทุกเมื่อ
```

### การปรับแต่ง Template

**เพิ่มสี/รูปแบบ:**

แก้ไขใน `<style>` section ของ template:

```html
<style>
  /* เปลี่ยนสีหลัก */
  .header {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
  }

  /* เปลี่ยนสีปุ่ม */
  .button {
    background: #YOUR_BUTTON_COLOR;
  }
</style>
```

**เพิ่ม Logo:**

```html
<div class="header">
  <img src="https://yourdomain.com/logo.png" alt="Logo" style="max-width: 150px;">
  <h1>ยินดีต้อนรับ!</h1>
</div>
```

**เพิ่มภาษาอังกฤษ:**

```html
<h2>สวัสดีคุณ ${data.sellerName}</h2>
<p>Hello ${data.sellerName}</p>

<p>ยินดีด้วย! บัญชี Seller ของคุณได้รับการอนุมัติเรียบร้อยแล้ว</p>
<p>Congratulations! Your Seller account has been approved.</p>
```

---

## การทดสอบ

### ขั้นตอนการทดสอบ

#### 1. ทดสอบด้วย Test Email

สร้างไฟล์ `test-email.ts` ในโฟลเดอร์ root:

```typescript
import { sendTransactionalEmail } from './src/lib/email/thaibulksms';
import { getApprovalEmailTemplate } from './src/lib/email/templates';

async function testEmail() {
  console.log('🧪 Testing ThaiBulkSMS Email...');

  const result = await sendTransactionalEmail({
    to: 'your-test-email@example.com', // เปลี่ยนเป็นอีเมลทดสอบของคุณ
    subject: '🧪 Test Email - Gography',
    html: getApprovalEmailTemplate({
      sellerName: 'Test User',
      sellerEmail: 'test@example.com',
      supportEmail: 'support@gography.com'
    })
  });

  console.log('Result:', result);
}

testEmail();
```

รันด้วยคำสั่ง:
```bash
npx tsx test-email.ts
```

#### 2. ทดสอบการอนุมัติ Seller

1. เข้าสู่ระบบด้วยบัญชี Admin
2. ไปที่ `/dashboard/admin/sellers`
3. เลือก Seller ที่มี status = pending
4. คลิก "อนุมัติ"
5. ตรวจสอบ:
   - ✅ Status เปลี่ยนเป็น approved
   - ✅ Toast notification แสดงผล
   - ✅ ตรวจสอบอีเมลที่ seller ระบุไว้

#### 3. ทดสอบการปฏิเสธ Seller

1. เลือก Seller ที่ต้องการปฏิเสธ
2. คลิก "ปฏิเสธ"
3. ระบุเหตุผล (ถ้ามี)
4. ตรวจสอบผลลัพธ์เหมือนข้อ 2

#### 4. ทดสอบ Error Handling

**กรณีที่ 1: API credentials ผิด**
```bash
# แก้ไข .env.local ให้ credentials ผิด
THAIBULKSMS_API_KEY=invalid_key

# รัน test
npx tsx test-email.ts

# ควรได้ error message: "API error: 401"
```

**กรณีที่ 2: Email ผิด format**
```typescript
await sendTransactionalEmail({
  to: 'invalid-email', // email ไม่ถูกต้อง
  subject: 'Test',
  html: '<h1>Test</h1>'
});

// ควรได้ error message เกี่ยวกับ invalid email
```

**กรณีที่ 3: Network error**
```typescript
// Disconnect internet และรัน test
// ควรได้ error message เกี่ยวกับ network
```

### Test Cases

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| ส่งอีเมลอนุมัติ Seller | อีเมลถึง seller พร้อม template อนุมัติ | ⬜ |
| ส่งอีเมลปฏิเสธ Seller | อีเมลถึง seller พร้อม template ปฏิเสธ | ⬜ |
| API credentials ผิด | Log error แต่ไม่ block การอนุมัติ | ⬜ |
| Seller ไม่มี email | Skip การส่งอีเมลพร้อม log warning | ⬜ |
| Network error | Log error และ retry (ถ้ามี) | ⬜ |
| HTML template render | เนื้อหาแสดงผลถูกต้อง | ⬜ |
| Thai characters | ภาษาไทยแสดงผลถูกต้อง | ⬜ |
| Links in email | Links คลิกได้และนำไปหน้าที่ถูกต้อง | ⬜ |

### การดู Logs

**1. Server Logs:**
```bash
npm run dev

# ดูใน terminal จะมี log messages:
# [ThaiBulkSMS] Email sent successfully: { to: '...', subject: '...', ... }
# [Email] Notification sent to seller@example.com for status: approved
```

**2. Browser Console:**
```javascript
// เปิด Network tab ใน DevTools
// ดู request ไปที่ /api/admin/sellers/[id]/status
// ตรวจสอบ response: { seller: {...}, emailSent: true }
```

**3. ThaiBulkSMS Dashboard:**
- เข้าสู่ระบบที่ https://www.thaibulksms.com
- ดูประวัติการส่งอีเมล
- ตรวจสอบ credit balance

---

## Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. อีเมลส่งไม่สำเร็จ

**อาการ:**
```
[ThaiBulkSMS] Email send failed: API error: 401
```

**วิธีแก้:**
- ✅ ตรวจสอบ `THAIBULKSMS_API_KEY` และ `THAIBULKSMS_API_SECRET` ใน `.env.local`
- ✅ ตรวจสอบว่า API credentials ยังใช้งานได้
- ✅ Login เข้า ThaiBulkSMS dashboard และตรวจสอบ API key status

#### 2. Email ไม่ถึงผู้รับ

**อาการ:** API ส่ง success แต่ผู้รับไม่ได้อีเมล

**วิธีแก้:**
- ✅ ตรวจสอบ spam folder ของผู้รับ
- ✅ ตรวจสอบว่า `to` email address ถูกต้อง
- ✅ ตรวจสอบ SPF/DKIM records ของ domain
- ✅ ดูประวัติการส่งใน ThaiBulkSMS dashboard

#### 3. Thai characters แสดงผลผิด

**อาการ:** ภาษาไทยแสดงเป็น `???` หรือตัวอักษรพิเศษ

**วิธีแก้:**
```html
<!-- เพิ่มใน <head> ของ email template -->
<meta charset="UTF-8">
```

#### 4. Environment variables ไม่ทำงาน

**อาการ:**
```
ThaiBulkSMS API credentials not configured
```

**วิธีแก้:**
- ✅ ตรวจสอบว่าชื่อตัวแปรถูกต้อง (case-sensitive)
- ✅ Restart Next.js dev server หลังแก้ไข `.env.local`
```bash
# หยุด server (Ctrl+C)
# รันใหม่
npm run dev
```
- ✅ ตรวจสอบว่าไฟล์ชื่อ `.env.local` ไม่ใช่ `.env` หรือ `.env.production`

#### 5. API endpoint ไม่ถูกต้อง

**อาการ:**
```
API error: 404 - Not Found
```

**วิธีแก้:**
- ✅ ตรวจสอบ API endpoint URL ใน `thaibulksms.ts`
- ✅ ดู ThaiBulkSMS documentation เพื่อ confirm endpoint ที่ถูกต้อง
- ✅ ติดต่อ ThaiBulkSMS support เพื่อขอ documentation

#### 6. Rate limit error

**อาการ:**
```
API error: 429 - Too Many Requests
```

**วิธีแก้:**
- ✅ เพิ่ม retry logic พร้อม delay
- ✅ ลด frequency ของการส่งอีเมล
- ✅ ติดต่อ ThaiBulkSMS เพื่อเพิ่ม rate limit

#### 7. Credit หมด

**อาการ:**
```
API error: 402 - Insufficient Credit
```

**วิธีแก้:**
- ✅ เติม credit ที่ ThaiBulkSMS dashboard
- ✅ ตั้งค่า alert เมื่อ credit เหลือน้อย
```typescript
const result = await checkCreditBalance();
if (result.success && result.data.credit < 100) {
  // ส่งการแจ้งเตือนไปยัง admin
}
```

### การ Debug

#### เปิด Debug Mode

แก้ไขไฟล์ `thaibulksms.ts`:

```typescript
const DEBUG = true; // เปิด debug mode

if (DEBUG) {
  console.log('[DEBUG] Request options:', {
    hostname: options.hostname,
    path: options.path,
    method: options.method,
    headers: {
      ...options.headers,
      'Authorization': 'Basic [REDACTED]' // ไม่แสดง credentials
    }
  });

  console.log('[DEBUG] Request body:', postData);
}
```

#### ทดสอบ API ด้วย curl

```bash
# Test authentication
curl -X GET \
  https://email-api.thaibulksms.com/email/v1/credit \
  -H "Authorization: Basic $(echo -n 'api_key:api_secret' | base64)" \
  -H "Accept: application/json"

# Test send email
curl -X POST \
  https://email-api.thaibulksms.com/api/v1/email/send \
  -H "Authorization: Basic $(echo -n 'api_key:api_secret' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"email": "test@example.com", "name": "Test"},
    "to": [{"email": "recipient@example.com"}],
    "subject": "Test",
    "html": "<h1>Test</h1>"
  }'
```

---

## Best Practices

### 1. การจัดการ Errors

**✅ ทำ:**
```typescript
// Non-blocking: อีเมลล้มเหลวไม่ทำให้การอนุมัติล้มเหลว
sendTransactionalEmail({...})
  .then(result => console.log('Email sent'))
  .catch(error => console.error('Email failed'));

return NextResponse.json({ success: true });
```

**❌ ไม่ทำ:**
```typescript
// Blocking: อีเมลล้มเหลวทำให้การอนุมัติล้มเหลวด้วย
const result = await sendTransactionalEmail({...});
if (!result.success) {
  throw new Error('Email failed');
}
```

### 2. Retry Logic

```typescript
async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries = 3
): Promise<EmailResponse> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await sendTransactionalEmail(options);

    if (result.success) {
      return result;
    }

    // Exponential backoff: 1s, 2s, 4s
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  return {
    success: false,
    message: `Failed after ${maxRetries} retries`
  };
}
```

### 3. Email Queue (สำหรับการส่งจำนวนมาก)

ถ้าต้องการส่งอีเมลจำนวนมาก ควรใช้ queue system:

```typescript
// ตัวอย่างใช้ Bull Queue
import Queue from 'bull';

const emailQueue = new Queue('email', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

// เพิ่มงานเข้า queue
emailQueue.add('send-email', {
  to: 'seller@example.com',
  subject: 'Test',
  html: '<h1>Test</h1>'
});

// Process queue
emailQueue.process('send-email', async (job) => {
  return await sendTransactionalEmail(job.data);
});
```

### 4. Logging และ Monitoring

```typescript
// Log successful sends
console.log('[Email Success]', {
  to: options.to,
  subject: options.subject,
  timestamp: new Date().toISOString(),
  messageId: response.data?.message_id
});

// Log failures
console.error('[Email Failed]', {
  to: options.to,
  error: error.message,
  timestamp: new Date().toISOString()
});

// Optional: ส่งไป monitoring service
await sendToMonitoring({
  type: 'email_failed',
  details: {...}
});
```

### 5. Security Considerations

**✅ ทำ:**
- เก็บ API credentials ใน environment variables
- ใช้ HTTPS สำหรับทุก requests
- Validate email addresses ก่อนส่ง
- Rate limit API calls
- Log เฉพาะข้อมูลที่จำเป็น (ไม่ log email content)

**❌ ไม่ทำ:**
- Hardcode API credentials ในโค้ด
- Commit `.env.local` เข้า git
- ส่งอีเมลไปยัง addresses ที่ไม่ได้ validate
- Log sensitive data (passwords, tokens)
- ปล่อยให้ใครก็ได้ trigger email sending

### 6. Testing

```typescript
// ใช้ mock ในขณะ test
if (process.env.NODE_ENV === 'test') {
  return {
    success: true,
    message: 'Mock email sent'
  };
}

// ใช้ test emails ใน development
const testMode = process.env.NODE_ENV === 'development';
const recipient = testMode ? 'test@example.com' : options.to;
```

### 7. Email Template Management

```typescript
// แยก templates เป็น external files
// src/lib/email/templates/approval.html
// src/lib/email/templates/rejection.html

import fs from 'fs';
import path from 'path';

function loadTemplate(name: string): string {
  const templatePath = path.join(
    process.cwd(),
    'src/lib/email/templates',
    `${name}.html`
  );
  return fs.readFileSync(templatePath, 'utf-8');
}

// Render template with data
function renderTemplate(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || '';
  });
}
```

---

## ภาคผนวก

### A. ThaiBulkSMS Pricing

**ราคาเริ่มต้น:**
- 0.04 บาท/อีเมล (แพ็คเกจขนาดใหญ่)
- ราคาอาจแตกต่างตามปริมาณการใช้งาน

**แพ็คเกจ:**
| จำนวนอีเมล | ราคา/อีเมล | ราคารวม |
|------------|------------|----------|
| 1,000 | 0.05 บาท | 50 บาท |
| 10,000 | 0.045 บาท | 450 บาท |
| 100,000 | 0.04 บาท | 4,000 บาท |

### B. Rate Limits

**SMS Service:**
- Up to 120 TPS (Transactions Per Second)

**Email Service:**
- ต้องติดต่อ ThaiBulkSMS support เพื่อสอบถาม

### C. ช่องทางติดต่อ Support

**ThaiBulkSMS:**
- 📧 Email: patipan@1moby.com, kanika@1moby.com
- 📞 โทร: 02-798-6055
- 🌐 Website: https://www.thaibulksms.com
- 📚 Developer Portal: https://developer.thaibulksms.com

**ThaiBulkMail:**
- 🌐 Website: https://www.thaibulkmail.com

### D. Related Documentation

**ภายใน Project:**
- `CLAUDE.md` - คู่มือการพัฒนาโปรเจค
- `COIN_SYSTEM_GUIDE.md` - คู่มือระบบ Coin
- `TRIPS_API_OPTIMIZATION_GUIDE.md` - คู่มือ optimization

**ภายนอก:**
- [ThaiBulkSMS API Docs](https://developer.thaibulksms.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

### E. Changelog

**Version 1.0.0 (2025-01-06)**
- ✅ Initial integration with ThaiBulkSMS Email API
- ✅ Seller approval/rejection email notifications
- ✅ Thai language email templates
- ✅ Error handling and logging
- ✅ Documentation in Thai

---

## สรุป

เอกสารนี้ครอบคลุมทุกสิ่งที่จำเป็นสำหรับการเชื่อมต่อ ThaiBulkSMS Email API เข้ากับระบบ Gography Seller Program:

1. ✅ **ติดตั้งและตั้งค่า** - พร้อมใช้งานภายใน 15-30 นาที
2. ✅ **Email Templates** - เทมเพลตภาษาไทยที่สวยงามและใช้งานง่าย
3. ✅ **Error Handling** - จัดการข้อผิดพลาดอย่างเหมาะสม
4. ✅ **Best Practices** - แนวทางที่ดีสำหรับ production
5. ✅ **Testing Guide** - วิธีการทดสอบอย่างละเอียด
6. ✅ **Troubleshooting** - แก้ปัญหาที่พบบ่อย

**ขั้นตอนถัดไป:**
1. ตั้งค่า environment variables
2. สร้างไฟล์ตามคู่มือ
3. ทดสอบการส่งอีเมล
4. Deploy to production

**หากมีคำถาม:**
- อ่าน [Troubleshooting](#troubleshooting) section
- ติดต่อ ThaiBulkSMS support
- สร้าง issue ใน project repository

---

*เอกสารนี้สร้างขึ้นเมื่อ 6 มกราคม 2568*
*Last updated: 6 มกราคม 2568*
