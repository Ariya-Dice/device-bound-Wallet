# 🔐 DeviceBound Wallet

یک کیف پول هوشمند مبتنی بر WebAuthn/Passkey که کلید‌های خصوصی را در دستگاه شما نگه می‌دارد و از قراردادهای هوشمند برای مدیریت دارایی‌ها استفاده می‌کند.

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Solidity](https://img.shields.io/badge/Solidity-e6e6e6?style=for-the-badge&logo=solidity&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

## 📋 فهرست مطالب

- [مقدمه](#-مقدمه)
- [ویژگی‌ها](#-ویژگی‌ها)
- [معماری پروژه](#-معماری-پروژه)
- [نصب و راه‌اندازی](#-نصب-و-راه‌اندازی)
- [استفاده](#-استفاده)
- [ساختار پروژه](#-ساختار-پروژه)
- [تکنولوژی‌های استفاده شده](#-تکنولوژی‌های-استفاده-شده)
- [امنیت](#-امنیت)
- [توسعه](#-توسعه)

## 🎯 مقدمه

**DeviceBound Wallet** یک کیف پول غیرمتمرکز است که از استاندارد WebAuthn (Passkey) برای احراز هویت استفاده می‌کند. برخلاف کیف پول‌های سنتی که نیاز به ذخیره seed phrase یا کلید خصوصی دارند، این کیف پول از قابلیت‌های امنیتی دستگاه شما (مانند Touch ID، Face ID، Windows Hello) استفاده می‌کند.

### چرا DeviceBound Wallet؟

- ✅ **بدون Seed Phrase**: دیگر نیازی به نوشتن و نگهداری seed phrase نیست
- ✅ **امنیت سخت‌افزاری**: کلید‌ها در Trusted Platform Module (TPM) دستگاه شما ذخیره می‌شوند
- ✅ **تجربه کاربری بهتر**: استفاده از بیومتریک برای تایید تراکنش‌ها
- ✅ **قابل بازیابی**: می‌توانید کیف پول را با استفاده از Passkey بازیابی کنید
- ✅ **چند دستگاه**: پشتیبانی از حداکثر 3 دستگاه برای یک کیف پول

## ✨ ویژگی‌ها

### 🔑 ایجاد کیف پول جدید
- ایجاد کیف پول با استفاده از WebAuthn/Passkey
- استخراج کلید عمومی از attestation object
- استقرار خودکار قرارداد هوشمند روی بلاک‌چین
- پشتیبانی از چندین شبکه (Sepolia, BSC Testnet, و...)

### 🔄 بازیابی کیف پول
- بازیابی کیف پول با استفاده از آدرس قرارداد
- تایید هویت با Passkey دستگاه
- بارگذاری خودکار اطلاعات کیف پول

### 💸 ارسال تراکنش
- ارسال اتر/توکن به آدرس‌های دیگر
- امضای تراکنش با Passkey
- تبدیل امضای ASN.1 به فرمت ECDSA
- محافظت در برابر replay attack با استفاده از nonce

### 📱 Progressive Web App (PWA)
- قابلیت نصب روی دستگاه‌های موبایل و دسکتاپ
- کار آفلاین با Service Worker
- تجربه کاربری مشابه اپلیکیشن‌های native

## 🏗️ معماری پروژه

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Create   │  │ Dashboard│  │ Recover  │              │
│  │ Wallet   │  │          │  │ Wallet   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       │              │              │                   │
│       └──────────────┼──────────────┘                   │
│                      │                                   │
│              ┌───────▼────────┐                         │
│              │  useWallet Hook │                         │
│              └───────┬────────┘                         │
└──────────────────────┼──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐  ┌─────▼─────┐  ┌───▼────┐
    │ WebAuthn│  │  Ethers.js│  │ Local  │
    │   API   │  │  Provider │  │Storage │
    └────┬────┘  └─────┬─────┘  └────────┘
         │            │
         │            │
    ┌────▼────────────▼────┐
    │   Smart Contract     │
    │ DeviceBoundWallet.sol │
    └───────────────────────┘
```

### جریان ایجاد کیف پول

1. **درخواست WebAuthn**: کاربر با دستگاه خود (Touch ID/Face ID) تایید می‌کند
2. **استخراج کلید عمومی**: از `attestationObject` کلید عمومی COSE استخراج می‌شود
3. **محاسبه Hash**: SHA-256 از کلید عمومی محاسبه می‌شود
4. **استقرار قرارداد**: قرارداد هوشمند با `pubKeyHash` و `label` استقرار می‌یابد
5. **ذخیره اطلاعات**: اطلاعات کیف پول در localStorage ذخیره می‌شود

### جریان ارسال تراکنش

1. **ساخت تراکنش**: کاربر آدرس گیرنده و مبلغ را وارد می‌کند
2. **محاسبه Hash**: از جزئیات تراکنش + nonce یک hash ساخته می‌شود
3. **امضای WebAuthn**: کاربر با Passkey تراکنش را امضا می‌کند
4. **تبدیل امضا**: امضای ASN.1 به فرمت (r, s) تبدیل می‌شود
5. **فراخوانی قرارداد**: تابع `execute` قرارداد فراخوانی می‌شود
6. **تایید و اجرا**: قرارداد امضا را تایید کرده و تراکنش را اجرا می‌کند

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

- **Node.js** نسخه 18 یا بالاتر
- **npm** یا **yarn**
- **MetaMask** یا هر کیف پول Web3 دیگر (برای اتصال به بلاک‌چین)
- **مرورگر پشتیبانی کننده از WebAuthn** (Chrome, Edge, Safari, Firefox)

### نصب

```bash
# کلون کردن پروژه
git clone <repository-url>
cd dvbwallet

# نصب وابستگی‌ها
npm install
```

### اجرای محیط توسعه

```bash
# اجرای سرور توسعه
npm run dev
```

پروژه روی `http://localhost:3000` اجرا می‌شود.

### ساخت نسخه Production

```bash
# کامپایل TypeScript و ساخت پروژه
npm run build
```

فایل‌های ساخته شده در پوشه `dist` قرار می‌گیرند.

### پیش‌نمایش نسخه Production

```bash
npm run preview
```

## 📖 استفاده

### ایجاد کیف پول جدید

1. اپلیکیشن را باز کنید
2. روی "New Wallet" کلیک کنید
3. یک برچسب برای دستگاه خود وارد کنید (مثلاً "My Laptop")
4. شبکه مورد نظر را انتخاب کنید
5. روی "Create & Deploy Wallet" کلیک کنید
6. درخواست WebAuthn/Passkey را تایید کنید
7. منتظر بمانید تا قرارداد استقرار یابد

### بازیابی کیف پول

1. روی "Recover Wallet" کلیک کنید
2. آدرس قرارداد کیف پول را وارد کنید
3. روی "Recover" کلیک کنید
4. با Passkey دستگاه خود تایید کنید
5. کیف پول شما بازیابی می‌شود

### ارسال تراکنش

1. در داشبورد، آدرس گیرنده را وارد کنید
2. مبلغ را مشخص کنید
3. روی "Send" کلیک کنید
4. با Passkey تراکنش را تایید کنید
5. منتظر تایید تراکنش بمانید

## 📁 ساختار پروژه

```
dvbwallet/
├── src/
│   ├── components/          # کامپوننت‌های React
│   │   ├── Header.tsx       # هدر اپلیکیشن
│   │   ├── RecoverWallet.tsx # فرم بازیابی کیف پول
│   │   └── Spinner.tsx      # لودینگ اسپینر
│   ├── hooks/               # React Hooks
│   │   └── useWallet.tsx    # هوک مدیریت کیف پول
│   ├── lib/                 # کتابخانه‌های کمکی
│   │   ├── chains.ts       # تنظیمات شبکه‌های بلاک‌چین
│   │   ├── crypto.ts       # توابع رمزنگاری (ASN.1 parsing)
│   │   └── webauthn.ts     # توابع WebAuthn
│   ├── pages/              # صفحات اصلی
│   │   ├── CreateWallet.tsx # صفحه ایجاد کیف پول
│   │   └── Dashboard.tsx    # داشبورد کیف پول
│   ├── types.ts            # تعاریف TypeScript
│   ├── constants.ts        # ثوابت (ABI, Bytecode)
│   ├── App.tsx             # کامپوننت اصلی
│   └── index.tsx           # نقطه ورود
├── public/                  # فایل‌های استاتیک
│   ├── manifest.json       # PWA manifest
│   └── service-worker.js   # Service Worker
├── DeviceBoundWallet.sol   # قرارداد هوشمند
├── package.json            # وابستگی‌های npm
├── tsconfig.json           # تنظیمات TypeScript
├── vite.config.ts          # تنظیمات Vite
└── tailwind.config.js      # تنظیمات Tailwind CSS
```

### توضیح فایل‌های مهم

#### `src/lib/webauthn.ts`
این فایل شامل توابع اصلی برای کار با WebAuthn است:
- `createNewCredential`: ایجاد credential جدید
- `getWebAuthnSignature`: دریافت امضا برای تراکنش
- `extractCosePublicKeyFromAttestation`: استخراج کلید عمومی از attestation

#### `src/lib/crypto.ts`
توابع رمزنگاری:
- `parseASN1Signature`: تبدیل امضای ASN.1 به (r, s)
- `getDevicePublicKeyHash`: محاسبه hash کلید عمومی

#### `src/hooks/useWallet.tsx`
هوک اصلی برای مدیریت وضعیت کیف پول:
- `walletData`: اطلاعات کیف پول فعلی
- `checkWallet`: بررسی و بارگذاری کیف پول از localStorage
- `recoverWallet`: بازیابی کیف پول با آدرس قرارداد
- `setWalletData`: ذخیره/حذف اطلاعات کیف پول

#### `DeviceBoundWallet.sol`
قرارداد هوشمند اصلی:
- `constructor`: استقرار با pubKeyHash اولیه
- `addDevice`: افزودن دستگاه جدید (حداکثر 3 دستگاه)
- `execute`: اجرای تراکنش با تایید امضا
- `reconnectWallet`: تایید هویت برای بازیابی

## 🛠️ تکنولوژی‌های استفاده شده

### Frontend
- **React 18**: کتابخانه UI
- **TypeScript**: تایپ‌سیفیتی
- **Vite**: بیلدر و dev server
- **Tailwind CSS**: استایل‌دهی
- **Ethers.js v6**: تعامل با بلاک‌چین

### WebAuthn
- **WebAuthn API**: استاندارد W3C برای احراز هویت
- **CBOR**: فرمت داده برای COSE keys
- **cbor-x**: کتابخانه decode/encode CBOR

### Smart Contract
- **Solidity ^0.8.24**: زبان برنامه‌نویسی قرارداد
- **ECDSA**: الگوریتم امضای دیجیتال

### PWA
- **vite-plugin-pwa**: پشتیبانی از Progressive Web App
- **Workbox**: مدیریت Service Worker

## 🔒 امنیت

### ویژگی‌های امنیتی

1. **Device-Bound Keys**: کلید‌ها در TPM دستگاه ذخیره می‌شوند و قابل استخراج نیستند
2. **Nonce Protection**: هر تراکنش یک nonce یکتا دارد تا از replay attack جلوگیری شود
3. **Signature Verification**: قرارداد هوشمند هر امضا را قبل از اجرا تایید می‌کند
4. **Device Registration**: فقط دستگاه‌های ثبت شده می‌توانند تراکنش ارسال کنند
5. **View Function**: `reconnectWallet` یک view function است و state را تغییر نمی‌دهد

### نکات امنیتی مهم

⚠️ **هشدار**: این پروژه در حال توسعه است و نباید برای دارایی‌های واقعی استفاده شود.

- همیشه از شبکه‌های testnet برای تست استفاده کنید
- قبل از استفاده در production، قرارداد را audit کنید
- از دستگاه‌های امن برای نگهداری کیف پول استفاده کنید
- هرگز credentialId یا اطلاعات حساس را به اشتراک نگذارید

## 🧪 توسعه

### ساخت قرارداد هوشمند

قرارداد در فایل `DeviceBoundWallet.sol` تعریف شده است. برای کامپایل:

```bash
# اگر از Foundry استفاده می‌کنید
forge build

# یا از Hardhat/Truffle
npx hardhat compile
```

### تست قرارداد

```bash
# با Foundry
forge test

# با Hardhat
npx hardhat test
```

### افزودن شبکه جدید

برای افزودن یک شبکه جدید، فایل `src/lib/chains.ts` را ویرایش کنید:

```typescript
export const CHAINS: Record<string, ChainConfig> = {
  'YOUR_CHAIN_ID': {
    id: YOUR_CHAIN_ID,
    chainType: 'evm',
    name: 'Your Chain Name',
    rpcUrl: 'https://your-rpc-url',
    explorerUrl: 'https://your-explorer-url',
    pubKeyCurve: 'secp256k1',
    currency: { name: 'TOKEN', symbol: 'TOKEN', decimals: 18 },
    domainSeparator: 'YOUR:domain',
  },
  // ...
};
```

### ساختار قرارداد هوشمند

```solidity
contract DeviceBoundWallet {
    // حداکثر تعداد دستگاه‌ها
    uint256 public constant MAX_DEVICES = 3;
    
    // مالک اولیه (کسی که قرارداد را استقرار داده)
    address payable public immutable OWNER;
    
    // شناسه کیف پول (hash کلید عمومی اولیه)
    bytes32 public immutable WALLET_ID;
    
    // تعداد دستگاه‌های ثبت شده
    uint256 public deviceCount;
    
    // نگاشت hash کلید عمومی به اطلاعات دستگاه
    mapping(bytes32 => Device) public devices;
    
    // نگاشت nonce به استفاده شده/نشده
    mapping(bytes32 => bool) public usedNonces;
}
```

## 📝 مجوز

این پروژه تحت مجوز MIT منتشر شده است.

## 🤝 مشارکت

مشارکت‌ها، پیشنهادات و گزارش باگ‌ها خوش‌آمد هستند! لطفاً ابتدا یک issue باز کنید تا در مورد تغییرات مورد نظر بحث کنیم.

## 📧 تماس

برای سوالات و پشتیبانی، لطفاً یک issue در repository باز کنید.

---

<div align="center">

**ساخته شده با ❤️ برای جامعه Web3**

</div>



https://device-bound-wallet.vercel.app/