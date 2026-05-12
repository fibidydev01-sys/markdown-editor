# 01. AARRR PIRATE METRICS
## Framework Pengukuran Wajib untuk SaaS

**📚 Sumber:** Dave McClure (Founder 500 Startups), "Startup Metrics for Pirates" presentation, 2007
**🔗 Original PDF:** https://mcgaw.io/wp-content/uploads/2016/04/PirateMetrics_Final.pdf

---

## 🎯 INTI DARI FRAMEWORK INI

AARRR (dibaca: "Aarrr!" kayak suara bajak laut) adalah cara nge-decompose journey customer lo jadi 5 tahap. Bukan teori — ini cara berpikir paling praktis untuk tau:
- Di tahap mana funnel lo bocor
- Metric mana yang harus difokuskan duluan
- Apa yang harus dieksekusi minggu ini

**Aturan emas dari Dave McClure:** Jangan track 50 metric. Pilih 1-2 per tahap. Itu cukup.

---

## 🧭 LIMA TAHAP AARRR

### 1. ACQUISITION (Akuisisi)
**Definisi:** Bagaimana orang nyampe ke produk lo.
**Metric utama:**
- Cost per Acquisition (CPA) per channel
- Customer Acquisition Cost (CAC) total
- Click-through rate, bounce rate

**Insight kunci:** Tracking signup by ICP-quality penting biar lo nggak over-optimize ke user yang salah. 1000 signup ICP nggak cocok < 100 signup ICP cocok.

### 2. ACTIVATION (Aktivasi)
**Definisi:** Persentase user yang ngerasain value pertama kali ("aha moment").
**Metric utama:**
- Activation rate
- Time to Value (TTV)
- % user yang complete onboarding milestone

**Benchmark dari OpenView:**
- Single-user products: ~40%
- Multi-user/team products: ~20%
- Browser extensions: ~50%

### 3. RETENTION (Retensi)
**Definisi:** User balik lagi pake produk.
**Metric utama untuk SaaS:**
- **Churn rate** (paling penting!)
- Monthly Active Users (MAU)
- Feature retention (apakah mereka pake feature inti?)

**Quote McClure:** *"Unless you're selling a high-ticket item, you cannot build a sustainable business by only acquiring new customers."*

### 4. REFERRAL (Referensi)
**Definisi:** User mereferensikan produk lo ke orang lain.
**Metric utama:**
- Viral coefficient (K-factor) — berapa user baru dihasilkan 1 user
- NPS (Net Promoter Score)
- Customer Satisfaction Score (CSAT)

### 5. REVENUE (Pendapatan)
**Definisi:** Lo dapet duit.
**Metric utama:**
- Monthly Recurring Revenue (MRR)
- Average Revenue Per User (ARPU)
- Lifetime Value (LTV)
- LTV : CAC ratio (minimal 3:1!)

---

## 💡 INSIGHT KONTRA-INTUITIF (PENTING!)

Mayoritas founder pemula loncat ke ACQUISITION duluan karena dia di paling atas. Itu kesalahan.

**Insight PostHog:** Untuk B2B SaaS, **prioritaskan RETENTION dulu**. Kenapa?
- Produk dengan banyak signup tapi retention jelek = mesin churn (bukan bisnis)
- Retention adalah indikator product-market fit yang paling jujur
- Lo nggak bisa scale produk yang user-nya kabur

**Cara aplikasinya:** Sebelum spend duit ke iklan/SEO, pastiin retention chart lo "flatten" — artinya ada cohort user yang konsisten balik bulan ke-3, ke-6.

---

## 🔄 ADAPTASI UNTUK PLG SaaS (Updated Framework)

Beberapa praktisi modern (Userpilot, Reforge) ngerekomendasiin urutan ini untuk product-led SaaS:

**Awareness → Acquisition → Activation → Engagement → Retention → Expansion → Referral**

Tambahan "Expansion" (upsell, cross-sell ke existing customer) jadi tahap eksplisit karena di SaaS modern, **expansion revenue bisa nyumbang 40%+ dari total ARR** untuk perusahaan dengan ARPA >$1K.

---

## 📊 CARA NGE-PLOT FUNNEL LO (TEMPLATE)

Bikin tabel kayak gini di Notion/spreadsheet:

| Tahap | Definisi Spesifik | Metric Lo | Angka Sekarang | Target |
|-------|-------------------|-----------|----------------|--------|
| Acquisition | Visit landing page | Visitor/bulan | ? | ? |
| Activation | Complete onboarding step X | % dari signup | ? | 40% |
| Retention | Login minggu ke-4 | % dari activated | ? | 70% |
| Referral | Invite teammate | % dari retained | ? | 20% |
| Revenue | Upgrade ke paid | % dari activated | ? | 10% |

**Lalu cari bocoran terbesar.** Yang persentasenya paling rendah = fokus eksekusi minggu ini.

---

## 🛠️ SARAN EKSEKUSI UNTUK SAAS LO

**Minggu ini (eksekusi <2 jam):**
1. Tulis definisi konkret 5 tahap AARRR untuk produk lo
2. Cek dashboard analytics (atau bikin pake PostHog/Mixpanel/Amplitude free tier)
3. Identifikasi 1 metric per tahap yang paling penting

**Bulan ini:**
4. Setup tracking proper untuk 5 metric tsb
5. Identifikasi tahap mana yang persentasenya paling rendah (= bocoran terbesar)
6. Fokus 80% effort lo ke perbaiki bocoran itu, BUKAN ke tahap lain

**Aturan praktis:**
- Kalau **activation rate <20%** → fix onboarding dulu, jangan iklan
- Kalau **churn >10%/bulan** → fix retention dulu, jangan scale acquisition
- Kalau **acquisition mahal banget** → fix channel-product fit, bukan budget iklan

---

## ❓ PERTANYAAN REFLEKSI

Sebelum lanjut ke file berikutnya, jawab ini:
1. Apa aha moment produk lo (1 kalimat)?
2. Berapa % user yang sampai ke aha moment itu?
3. Berapa % yang masih aktif minggu ke-4?
4. Kalau lo cuma boleh fix 1 tahap dalam 30 hari, tahap mana?

Kalau lo nggak bisa jawab #1 atau #2 — itu prioritas pertama lo. Sebelum apapun.
