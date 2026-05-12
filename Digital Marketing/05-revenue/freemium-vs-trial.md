# 16. FREEMIUM vs FREE TRIAL
## Pilih yang Mana untuk Produk Lo — Decision Framework

**📚 Sumber:** Wes Bush "Product-Led Growth", OpenView research, ProfitWell + Paddle pricing studies, Lenny Rachitsky analysis

---

## 🎯 KEPUTUSAN STRATEGIS, BUKAN KOSMETIK

Quote Wes Bush:
> *"The wrong free model can kill your SaaS. Either too many free users that you can't monetize (freemium wrong), or trial pressure that scares away buyers (trial wrong)."*

Ini bukan A/B test sederhana. Ini **strategic decision** yang mempengaruhi:
- Acquisition (low/high barrier)
- Conversion (urgency vs comfort)
- Unit economics (cost serving free user)
- Product roadmap (free tier feature decision)

---

## 📐 DEFINISI 4 MODEL

### 1. FREE TRIAL (Time-Limited, Full Feature)
- 7-30 hari gratis
- Akses ke full produk (atau hampir full)
- Setelah trial expire → bayar atau lose access
- **Contoh:** Ahrefs (7 hari $7), HubSpot Sales Pro trial, Adobe Creative Cloud

### 2. FREEMIUM (Forever Free, Limited Features/Usage)
- Tier gratis selamanya
- Feature/usage limited (storage, seats, API calls, etc.)
- Upgrade trigger: hit limit atau butuh advanced feature
- **Contoh:** Notion, Slack, Figma, Dropbox, Canva

### 3. REVERSE TRIAL (Premium → Downgrade to Free)
- Start dengan full feature (typically 14 hari)
- Setelah trial, **otomatis downgrade ke free tier** (bukan blocked)
- User experience semua feature, lalu pilih: stay free atau upgrade
- **Contoh:** Lemon Squeezy, Linear, Notion (sebagian)

### 4. FREEMIUM-PLUS-TRIAL (Hybrid)
- Free forever tier + trial untuk pro features
- User bisa stuck di free tier, atau coba pro lewat trial
- **Contoh:** HubSpot (free CRM + trial untuk Sales/Service)

---

## 🤔 DECISION FRAMEWORK: PILIH YANG MANA

Wes Bush's framework "MOAT":

**M — Market Strategy:**
- Red ocean (kompetisi, customer aware) → **Freemium** (lowest friction, viral)
- Blue ocean (new category, butuh edukasi) → **Free Trial** (urgency push)

**O — Ocean Conditions:**
- Customer udah tau need → **Freemium** (mereka try sendiri)
- Customer belum aware → **Free Trial** + sales handhold

**A — Audience:**
- Bottom-up (end user) → **Freemium** (viral spread di organisasi)
- Top-down (decision maker) → **Free Trial** + sales

**T — Time to Value:**
- TTV pendek (<24 jam) → **Freemium** OK (user langsung dapet value, conversion natural)
- TTV panjang (>1 minggu) → **Free Trial** (push completion)

---

## 💚 FREEMIUM — KAPAN MENANG

### Cocok kalau:

**1. Network Effect / Viral Mechanics**
Slack: makin banyak orang di workspace = makin valuable. Free tier = invite teammates = expansion natural.
Figma: collaborator perlu akses sama = free seat = viral spread.

**2. Cost Serving Free User Rendah**
Cloud cost minimal per free user. Margin oke.
**HATI-HATI 2026:** AI-heavy product bisa rugi serving free user karena token cost. Banyak yang shift ke usage-based atau remove freemium.

**3. Free Tier Cukup untuk Word-of-Mouth**
User dapet meaningful value bahkan di free → recommend ke temen → organic growth.

**4. Conversion Trigger Jelas**
Hit storage limit (Dropbox 2GB → upgrade).
Need >3 collaborator (Figma).
Want history >10K messages (Slack lama).

### Conversion Rate Benchmark Freemium

Per ProductLed + Mixpanel 2026:
- **Free → Paid:** 2-5% (median), 8-12% (top quartile)
- Catatan: persentase rendah, tapi base bisa massive (Slack jutaan free user)

### Trap Freemium

❌ **Free tier terlalu generous** — no incentive upgrade. Notion sempat over-generous, lalu adjust 2024.
❌ **Free tier terlalu limited** — frustrating, user cabut sebelum experience value.
❌ **Conversion trigger nggak jelas** — user nggak tau kapan harus upgrade.

**Sweet spot:** Free tier cukup untuk **demonstrate full value untuk small/individual use case**, tapi limit yang bikin **team/business use** butuh upgrade.

---

## 🔴 FREE TRIAL — KAPAN MENANG

### Cocok kalau:

**1. Time-to-Value Cepat tapi Butuh Urgency**
Tanpa deadline, user procrastinate. Trial 7-14 hari = urgency push.

**2. Cost Serving Free User Tinggi**
Heavy compute (AI), real-time data, storage premium. Freemium = profit drain.

**3. Premium Positioning**
Premium tool yang "kelihatannya gratis selamanya" = perceived low value. Trial = signal "ini premium, coba dulu."

**4. Decision Maker = Buyer**
B2B mid-market+: pembeli butuh evaluasi terbatas, bukan trial tak berbatas. Trial 14 hari ideal.

### Conversion Rate Benchmark Trial

- **Trial 14 hari → Paid:** 15-20% median, 25-30% top quartile
- **Trial 7 hari → Paid:** 10-15% median, 20-25% top quartile
- **Trial dengan credit card upfront:** 50-60% conversion (tapi sign-up rate lebih rendah)
- **Trial tanpa credit card (opt-in):** 15-25% conversion (sign-up rate lebih tinggi)

### Trap Trial

❌ **Trial terlalu panjang** (30+ hari) untuk produk TTV pendek = buang urgency
❌ **Trial terlalu pendek** untuk produk kompleks = user belum sempat ngerasain value
❌ **Credit card mandatory upfront** scary buat SMB self-serve
❌ **Nggak ada onboarding di trial** — user nggak tau ngapain, expire tanpa convert

**Aturan praktis Wes Bush:** Trial duration = 1.5x dari TTV typical lo.
- TTV 1 hari → trial 7 hari cukup
- TTV 5 hari → trial 14 hari
- TTV 2 minggu → trial 30 hari

---

## ✨ REVERSE TRIAL — RISING TREND 2026

Pattern yang growing 2024-2026:

**Cara kerja:**
- User signup → langsung dapet full premium akses (14 hari)
- Trial expire → otomatis downgrade ke free tier
- User pilih: stay free atau upgrade

**Why it works:**
- **Sunk cost psychology:** user udah pake premium feature, susah lepas
- **Demonstrate full value upfront** (vs freemium yang mungkin lo nggak pernah ngerasain advanced)
- **Lower friction sign-up** (gratis selamanya as safety net)

**Conversion rate reverse trial: 25-35% (top quartile 45%+).** Lebih tinggi dari standard trial atau freemium pure.

**Contoh implementasi:** Lemon Squeezy, Linear (selectively), Notion AI feature.

**Trap:** Butuh in-app machinery untuk handle smooth downgrade tanpa data loss.

---

## 📊 PERBANDINGAN HEAD-TO-HEAD

| Dimension | Freemium | Free Trial | Reverse Trial |
|-----------|----------|-----------|---------------|
| **Signup friction** | Terendah | Rendah-Sedang | Rendah |
| **User base size** | Massive | Moderate | Moderate-Large |
| **Conversion rate** | 2-5% | 15-25% | 25-35% |
| **Cost serving free** | Tinggi (lots of free) | Rendah (limited time) | Sedang |
| **Urgency** | Lemah | Kuat | Sedang |
| **Best for** | Network effect, viral | Premium B2B, sales-assisted | Modern PLG SaaS |
| **Setup complexity** | Sedang | Sederhana | Tinggi |

---

## 🚀 HYBRID MODEL: OFTEN THE WINNER

**Banyak SaaS sukses 2026 pake hybrid:**

**HubSpot:**
- Free CRM (forever) — lead-gen tool
- Trial untuk Sales/Marketing/Service Pro (push upgrade)
- Hasil: massive top-of-funnel + clear upgrade path

**Canva:**
- Freemium (forever, ample feature) — viral
- Pro trial (untuk push upgrade)
- Hasil: massive base + 6%+ conversion

**Notion:**
- Free Personal (forever, unlimited blocks) — student/individual
- Free trial Pro untuk team (push)
- Hasil: bottom-up enterprise penetration

**Aturan hybrid:** Pakai freemium untuk **acquisition + viral**, pakai trial untuk **push specific feature/tier upgrade**.

---

## 🛠️ SARAN EKSEKUSI UNTUK SAAS LO

**Week 1 — Diagnose:**
1. **Audit model lo sekarang** (freemium/trial/hybrid)
2. **Hitung conversion rate aktual** dari free/trial → paid
3. **Compare ke benchmark** di atas — di mana lo posisi?
4. **Pilih MOAT framework** — produk lo cocok yang mana?

**Bulan ini — Test:**
5. **Kalau freemium rendah converting** (<2%), coba:
   - Tighten free tier (lower limits)
   - Tambah feature gating yang jelas
   - Add Pro trial sebagai entry option
6. **Kalau trial rendah converting** (<10%):
   - Improve onboarding (file 09)
   - Adjust trial length
   - Test reverse trial format

**Quarter:**
7. **Quarterly A/B test pricing model** — jangan stuck setahun di model yang nggak optimal
8. **Subscribe ke pricing research** (ProfitWell, OpenView, Paddle)

---

## ⚠️ TRAP UMUM

### 1. Pakai Model Karena Kompetitor Pake
Kompetitor lo mungkin punya unit economics berbeda. Decision lo harus based on **your data**.

### 2. Set & Forget
Decision freemium vs trial bukan one-time. Re-evaluate per quarter. Yang work tahun lalu mungkin nggak work sekarang.

### 3. AI Era Cost Trap
Freemium AI-heavy product bisa eat profit. Per Q4 2025, banyak company shift dari freemium ke trial atau usage-based.

### 4. Tidak Track Behavior Free User
Free user yang **active** punya conversion lebih tinggi 5-10x dari inactive. Track activity, push upgrade ke active free user.

---

## 📖 BACAAN LANJUT

- **Wes Bush — PLG book Chapter 7-9** (free chapter di productled.com/book)
- **Patrick Campbell — Freemium Conversion series** (paddle.com/blog)
- **Lenny Rachitsky — "Should you offer a free trial or a freemium?"** (lennysnewsletter.com)
- **OpenView PLG Index** annual report

---

## ❓ PERTANYAAN REFLEKSI

1. Produk lo cocok freemium, trial, atau hybrid?
2. Conversion rate aktual lo above atau below benchmark?
3. Berapa cost lo serving free user (terutama kalau AI-heavy)?
4. Reverse trial worth dicoba untuk lo?

Jangan asumsi model awal lo udah optimal. **Pricing & free model = iterate continuously.**
