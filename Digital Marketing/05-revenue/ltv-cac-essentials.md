# 25. LTV : CAC ESSENTIALS
## Unit Economics yang Wajib Dipahami Setiap Founder SaaS

**📚 Sumber:** David Skok "SaaS Metrics 2.0" (forentrepreneurs.com), Bessemer Cloud Index, ChartMogul Unit Economics Guide, KeyBanc 2024 SaaS Survey, Tomasz Tunguz essays

---

## 🎯 KENAPA LO HARUS PAHAM INI SEKARANG

Quote David Skok (founder Matrix Partners, author "SaaS Metrics 2.0"):

> *"In SaaS, the most common cause of death is running out of cash. And the most common cause of running out of cash is not understanding unit economics."*

Lo bisa punya growth chart yang naik tajam, MRR tinggi, hire 50 orang, raise seri B — dan tetap mati. Kenapa? Karena lo spending $1.50 untuk dapetin customer yang cuma kasih lo balik $1.00.

**Unit economics jawab 1 pertanyaan kunci:** Per customer, **apakah bisnis lo profitable**?

Kalau iya → scale aman.
Kalau enggak → setiap customer baru lo bakar lebih banyak duit.

---

## 💰 BAGIAN 1: CUSTOMER ACQUISITION COST (CAC)

### Apa Itu CAC?

**CAC** = total biaya yang lo keluarkan untuk dapetin **1 paying customer baru**.

### Formula Dasar

```
CAC = Total Sales & Marketing Spend (period) / New Customers Acquired (period)
```

**Contoh konkret:**
- Bulan ini lo spend:
  - Google Ads: $5,000
  - Tools (HubSpot, Mailchimp): $500
  - Content writer freelance: $1,500
  - Sales rep gaji + commission: $8,000
  - **Total S&M: $15,000**
- New paid customer didapet: **30 customer**
- **CAC = $15,000 / 30 = $500/customer**

### Apa yang HARUS Masuk ke CAC

✅ **Wajib masuk:**
- Paid ads (Google, FB, LinkedIn, etc.)
- Marketing tools subscription
- Salaries marketing team + sales team
- Content creation cost (writer, video, design)
- Event/sponsor cost
- Sales commission
- Affiliate/referral payout
- Marketing agency fees

❌ **Yang SERING DI-MISS founder pemula:**
- ❌ Founder time yang habis untuk sales/marketing (kalau lo tarik gaji, harus dihitung)
- ❌ Free trial cost (cost serving free users)
- ❌ Office overhead allocation
- ❌ Onboarding cost (CSM time untuk new customer)

**Aturan emas:** Kalau ragu, **masukin**. CAC under-counted = false sense of profitability.

### Blended CAC vs Paid CAC

**Blended CAC** = total spend / total new customers (termasuk organic)
**Paid CAC** = paid channel spend / customer dari paid channel

**Why it matters:** Kalau lo punya 100 customer baru — 60 dari organic SEO, 40 dari Google Ads — blended CAC bikin angka kelihatan bagus. Tapi **paid CAC** ngebongkar: apakah channel paid lo sustainable?

**Untuk decision making:** Selalu liat **paid CAC per channel**, bukan cuma blended.

### CAC by Channel

First Page Sage 2024 data, B2B SaaS median CAC:

| Channel | Median CAC |
|---------|------------|
| **Organic Search (SEO)** | $147 |
| **Referral** | $192 |
| **Content Marketing** | $250 |
| **Outbound (Email)** | $315 |
| **Webinar** | $356 |
| **Paid Search** | $370 |
| **LinkedIn Ads** | $447 |
| **Display Ads** | $551 |
| **Event Marketing** | $811 |

**Insight:** SEO/content CAC bisa **3-5x lebih murah** dari paid ads. Tapi butuh **6-12 bulan compound** baru kelihatan hasilnya.

---

## 💎 BAGIAN 2: LIFETIME VALUE (LTV)

### Apa Itu LTV?

**LTV (Customer Lifetime Value)** = total revenue yang lo expect dapetin dari 1 customer selama dia jadi customer.

### Formula Sederhana (untuk start)

```
LTV = ARPU / Monthly Churn Rate
```

**Contoh:**
- ARPU: $100/bulan
- Monthly churn: 5%
- **LTV = $100 / 0.05 = $2,000**

Artinya: rata-rata customer lo kasih lo $2,000 selama lifetime mereka.

### Formula yang Lebih Akurat (DAVID SKOK VERSION)

Formula simple di atas **over-estimate LTV** karena ngga hitung biaya melayani customer.

David Skok's formula:

```
LTV = (ARPU × Gross Margin %) / Monthly Churn Rate
```

**Contoh:**
- ARPU: $100/bulan
- Gross margin: 80% (cost serving = 20%)
- Monthly churn: 5%
- **LTV = ($100 × 0.80) / 0.05 = $1,600**

**Penting:** Pakai **gross margin LTV**, bukan revenue LTV. Karena yang penting **profit**, bukan revenue.

### Formula Paling Akurat (dengan Expansion)

Buat SaaS yang ada upsell/expansion, formula jadi:

```
LTV = (ARPU × Gross Margin %) / (Monthly Churn Rate - Monthly Expansion Rate)
```

**Catatan:** Kalau expansion rate > churn rate → denominator negatif → LTV "infinite" (negative net churn). Ini jackpot tapi rare di SMB.

### Trap LTV yang Sering

❌ **Pakai annual ARPU bukan monthly** — bikin LTV kelihatan 12x lebih besar
❌ **Pakai annual churn padahal hitungannya monthly** — same problem
❌ **Lupa apply gross margin** — over-estimate 20-30%
❌ **Hitung LTV pakai data <6 bulan** — terlalu sedikit data, unreliable
❌ **Pakai best customer sebagai average** — survivorship bias

**Aturan emas:** Kalau LTV lo "kelihatan terlalu bagus untuk benar" — biasanya emang nggak benar.

---

## 🎯 BAGIAN 3: LTV : CAC RATIO — METRIC KING

### Apa Itu Ratio Ini?

Rasio antara LTV dan CAC. Jawab pertanyaan: **per dollar yang lo invest, berapa dollar yang lo dapet balik?**

```
LTV : CAC Ratio = LTV / CAC
```

### Interpretasi Ratio

| Ratio | Klasifikasi | Action |
|-------|-------------|--------|
| **< 1:1** | Bakar duit, bisnis ngga sustainable | STOP. Fix fundamentals |
| **1:1 - 2:1** | Marginal, struggling | Cut CAC atau naekin LTV |
| **3:1** | Standar industri (target minimum) | Healthy zone |
| **3:1 - 5:1** | Healthy | Scale carefully |
| **> 5:1** | Excellent atau **under-investing di growth** | Mungkin lo terlalu hemat di marketing |

**Wisdom:** David Skok bilang ratio **>5:1** kadang justru **bad signal** — artinya lo bisa scale lebih agresif. Customer cuan banget, kenapa nggak invest lebih ke akuisisi?

### Median Industri (Benchmarkit 2024)

- **Median B2B SaaS:** 3.6:1
- **Top quartile:** 4.5:1+
- **Bottom quartile:** <2:1

---

## ⏰ BAGIAN 4: CAC PAYBACK PERIOD

### Apa Itu CAC Payback?

Berapa bulan sampai lo "balik modal" dari acquiring 1 customer.

### Formula

```
CAC Payback (months) = CAC / (ARPU × Gross Margin %)
```

**Contoh:**
- CAC: $500
- ARPU: $100/bulan
- Gross margin: 80%
- **Payback = $500 / ($100 × 0.80) = 6.25 bulan**

### Benchmark CAC Payback

| Customer Segment | Healthy Payback |
|------------------|-----------------|
| **SMB self-serve** | <12 bulan (ideal <6) |
| **Mid-market** | 12-18 bulan |
| **Enterprise** | 18-30 bulan |

**Top quartile B2B SaaS: <12 bulan.**
**Median: 15-18 bulan.**

### Kenapa Payback Period Sama Pentingnya dengan LTV:CAC

LTV:CAC = profitability lifetime.
Payback = **cash flow timing**.

**Skenario bahaya:** LTV:CAC bagus (4:1) tapi payback 36 bulan. Lo bakar cash 3 tahun sebelum dapet balik. Kalau lo nggak punya cash buffer → mati duluan sebelum LTV terealisasi.

**Aturan praktis:** Untuk bootstrap atau lean startup, **prioritize CAC payback <12 bulan**. Sustainable cash flow > theoretical LTV.

---

## 📊 BAGIAN 5: GROSS MARGIN — FOUNDATION

### Apa Itu Gross Margin?

% revenue yang tersisa setelah dikurangi **cost of revenue** (cost serving customer, BUKAN cost akuisisi).

### Formula

```
Gross Margin = (Revenue - COGS) / Revenue × 100%
```

### Apa Itu COGS untuk SaaS

**Wajib masuk COGS:**
- Hosting/server cost (AWS, GCP)
- Third-party API cost (Stripe fees, AI API tokens, SMS gateway)
- Customer support team
- Customer success team (kalau dedicated per account)
- Data center / database cost

**TIDAK masuk COGS** (itu masuk OpEx):
- Engineering team gaji (build, bukan operate)
- Marketing & sales
- General & admin

### Benchmark Gross Margin (SaaS Capital 2025)

| Margin | Klasifikasi |
|--------|-------------|
| **<60%** | Issue — cost structure bermasalah |
| **60-70%** | Acceptable, with caveat |
| **70-80%** | Healthy SaaS standard |
| **80-90%** | Excellent (top quartile) |
| **>90%** | Elite (rare, mostly pure SaaS at scale) |

**⚠️ AI ERA WARNING 2026:** Produk AI-heavy struggle achieve >70% gross margin karena cost per token tinggi. Banyak AI startup gross margin <50%. **Pricing strategy harus accommodate ini** — usage-based atau premium pricing.

---

## 🛠️ BAGIAN 6: TEMPLATE WORKSHEET LO SENDIRI

Bikin spreadsheet ini. Isi tiap bulan.

```
=== INPUTS ===
Total S&M spend bulan ini:        $______
New paid customer didapet:        ______
Total customer aktif end of month:______
MRR end of month:                 $______
MRR churn (cancel + downgrade):   $______
MRR expansion (upsell + upgrade): $______
Cost of revenue (hosting+API+CS): $______

=== CALCULATED ===
ARPU:                = MRR / Total customer
Gross Margin:        = (MRR - COGS) / MRR
Monthly Churn Rate:  = MRR churn / MRR start of month
CAC:                 = S&M spend / New customer
LTV (simple):        = ARPU / Churn rate
LTV (Skok):          = (ARPU × Gross Margin) / Churn rate
LTV : CAC Ratio:     = LTV (Skok) / CAC
CAC Payback (month): = CAC / (ARPU × Gross Margin)

=== DIAGNOSIS ===
- LTV:CAC < 3:1? → Need fix (CAC turun atau LTV naik)
- Payback > 18 bulan? → Cash flow risk
- Gross margin < 70%? → Cost structure issue
- Churn > 5%/bulan? → Retention priority
```

Print. Tempel di meja. Update tiap akhir bulan.

---

## 💡 STRATEGI IMPROVE TIAP METRIC

### Improve LTV (yang paling powerful — compound)

1. **Reduce churn** (lihat file 12 — playbook lengkap)
2. **Naekin ARPU:**
   - Price increase (lihat file 14, 15)
   - Tier upgrade prompt contextual
   - Add-on / cross-sell
3. **Add expansion revenue:**
   - Usage-based component
   - Seat expansion (multi-user)
   - Annual upsell

### Reduce CAC

1. **Shift ke organic channel** (SEO, content, community) — file 17, 18, 23
2. **Optimize conversion rate landing page** — bikin same traffic = more customer
3. **Improve targeting paid ads** — narrower ICP, less waste spend
4. **Push referral program** — near-zero CAC kalau aktif
5. **Tolak prospect non-ICP** — sales effort yang waste

### Reduce CAC Payback

1. Push **annual plan dengan discount** — cash upfront
2. Optimize **time-to-paid** (free trial → conversion lebih cepat)
3. Reduce ARPU gap antara plan (encourage upgrade earlier)

---

## 🚨 KAPAN UNIT ECONOMICS LO "BROKEN"

Sinyal red flag:

🚨 **LTV:CAC < 1.5:1** for 3+ bulan berturut-turut
→ Stop scale acquisition. Fix unit economics.

🚨 **CAC payback > 24 bulan** dan cash runway <12 bulan
→ Emergency. Either raise atau cut burn.

🚨 **Gross margin trend turun**
→ Cost structure isu (server cost outpace growth, atau pricing terlalu rendah)

🚨 **Monthly churn > 8% SMB** atau **>3% mid-market**
→ Retention problem, ngga akan ke-cover acquisition

---

## 🛠️ SARAN EKSEKUSI UNTUK SAAS LO

**Week 1:**
1. **Build worksheet** template di atas pakai Google Sheets / Notion
2. **Pull data 6 bulan terakhir** — isi worksheet
3. **Hitung 5 metric:** CAC, LTV (Skok), LTV:CAC, Payback, Gross Margin

**Week 2:**
4. **Compare ke benchmark** segmen lo (file 29 untuk angka)
5. **Identify metric paling lemah** vs benchmark
6. **Tulis 1 hipotesis fix** untuk metric tersebut

**Bulan 1:**
7. **Implement 1 intervention** sesuai hipotesis
8. **Measure dampak** ke metric (butuh 30-60 hari kelihatan)

**Quarterly:**
9. **Re-pull data** semua metric
10. **Track trend**, bukan cuma absolute number
11. **Adjust strategy** berdasarkan finding

---

## ⚠️ TRAP UMUM

❌ **Hitung LTV pakai revenue total, bukan gross profit** — bikin metric over-estimate
❌ **Pakai blended CAC untuk decision** — channel insight hilang
❌ **Pretend founder time is free** — itu opportunity cost real
❌ **Optimize CAC tanpa optimize LTV** — race ke bawah
❌ **Ngitung 1x trus lupa** — unit economics berubah seiring waktu

---

## 📖 BACAAN LANJUT WAJIB

**Tier S (wajib baca):**
- David Skok — "SaaS Metrics 2.0" (forentrepreneurs.com) — bible unit economics
- ChartMogul — "The Ultimate Guide to SaaS Metrics"
- Tomasz Tunguz blog — unit economics essays

**Tier A:**
- Bessemer Cloud Index — public SaaS metric benchmarks
- ProfitWell/Paddle blog — LTV optimization series
- KeyBanc Annual SaaS Survey — private SaaS data

**Calculator gratis:**
- ChartMogul SaaS Metrics Calculator
- ProfitWell free metrics dashboard (kalau pake Stripe)

---

## ❓ PERTANYAAN REFLEKSI

1. Lo bisa jawab CAC, LTV, dan payback period lo sekarang (angka konkret)?
2. Lo pakai gross margin LTV atau revenue LTV? Yang mana yang lebih jujur?
3. Channel paid mana yang LTV:CAC-nya paling lemah? Kenapa belum di-cut?
4. CAC payback >12 bulan tapi runway lo <12 bulan? Itu **prioritas urgent**.

**Aturan emas:** Lo nggak bisa fix apa yang lo nggak ukur. Setup unit economics tracking = **non-negotiable foundation** before scaling apapun.
