# 11. RETENTION & COHORT ANALYSIS
## Cara Baca "Health" SaaS Lo dari Data, Bukan Tebakan

**📚 Sumber:** Sean Ellis "Hacking Growth", Andrew Chen "Power User Curve", Mixpanel retention guides, ChartMogul cohort reports

---

## 🎯 KENAPA RETENTION ADALAH METRIC #1 SAAS

Quote yang sering disebut Brian Balfour:
> *"Retention is the foundation of growth. Without retention, all growth efforts compound to zero."*

**Logika:** Lo bisa spend $1M ke ads dan dapet 10.000 user. Kalau 90% cabut bulan ke-2, lo punya 1.000 user. Spend lagi $1M, ulang. Itu treadmill, bukan growth.

**Logika berlawanan:** Lo dapet 1.000 user dengan retention 95%/bulan. Akhir tahun lo masih punya 540 user dari batch awal + new growth tiap bulan compounding. Itu **flywheel**.

---

## 📊 APA ITU COHORT ANALYSIS?

**Cohort** = grup user yang share characteristic sama (biasanya: bulan signup).

**Cohort analysis** = lihat performance grup tersebut over time.

**Kenapa bukan rata-rata aja?**

Rata-rata bisa misleading. Contoh: 50% retention bisa berarti:
- (A) 50% user cabut di bulan 1, 50% tetap selamanya
- (B) 80% user cabut bulan 1, 20% tetap, baru bulan 2 cabut 20% lagi
- (C) Steady decline 5%/bulan

Tiga skenario ini fundamentally beda **health bisnis lo** — tapi rata-rata sama.

Cohort analysis ngebongkar ini.

---

## 📈 BENTUK COHORT CURVE YANG WAJIB LO PAHAMI

### Bentuk 1: "DEATH CURVE" — Bisnis Lo Lagi Mati 💀
```
Retention
100% ▓
 80% ▓▓
 60% ▓▓▓
 40% ▓▓▓▓
 20% ▓▓▓▓▓
  0% ▓▓▓▓▓▓
     M1 M2 M3 M4 M5 M6
```
Retention turun terus ke 0. Artinya: produk lo nggak ada PMF. **Stop akuisisi.** Fix retention dulu.

### Bentuk 2: "SMILE CURVE" — User Cabut Tapi Yang Tinggal Stabil 🙂
```
Retention
100% ▓
 60% ▓▓
 40% ▓▓▓
 35% ▓▓▓▓
 33% ▓▓▓▓▓
 32% ▓▓▓▓▓▓
     M1 M2 M3 M4 M5 M6
```
Ada drop awal (orang nyoba tapi nggak fit), tapi yang lanjut tetap pakai. Ini sinyal **PMF** untuk subset user. Lo tau target ICP yang real.

### Bentuk 3: "POWER USER CURVE" — Yang Cinta Makin Cinta ❤️
```
Retention
100% ▓
 60% ▓▓
 50% ▓▓▓
 55% ▓▓▓▓
 60% ▓▓▓▓▓ ← naik!
 65% ▓▓▓▓▓▓
     M1 M2 M3 M4 M5 M6
```
Retention naik di later month. Andrew Chen famous nyebut ini. Artinya: produk lo punya **network effect / habit / lock-in**. Slack, Notion, Figma punya curve ini.

### Bentuk 4: "FLAT 100%" — Mimpi tapi Susah
Retention 100% selamanya = no churn. Hanya enterprise SaaS dengan multi-year contract yang capai.

---

## 🔬 CARA BIKIN COHORT REPORT (PRAKTIS)

### Manual (Spreadsheet) — Untuk yang Baru Mulai

```
            M1    M2    M3    M4    M5    M6
Jan signup  100   60    45    40    38    35
Feb signup  120   72    54    48    44
Mar signup  150   90    68    61
Apr signup  200   120   90
May signup  250   150
Jun signup  300
```

Row = signup month, column = month sejak signup.
Tiap cell = berapa user dari cohort itu yang masih aktif.

**Convert ke %**:
```
            M1     M2    M3    M4    M5    M6
Jan signup  100%   60%   45%   40%   38%   35%
Feb signup  100%   60%   45%   40%   37%
```

### Tool Otomatis

- **Mixpanel** — built-in cohort report (free tier OK untuk start)
- **Amplitude** — strong cohort + behavioral analysis
- **PostHog** — open source, free up to 1M events/month
- **ChartMogul** — best untuk revenue cohort (MRR retention)
- **Baremetrics** — kalau Stripe-integrated

---

## 📐 RETENTION METRICS YANG WAJIB

### 1. Logo Retention
**Definisi:** % customer (logo/perusahaan) yang masih ada di bulan ke-N.

**Cara hitung:** `Customer aktif M6 / Customer awal M0`

**Target sehat (B2B SaaS):**
- M3: 80%+
- M6: 70%+
- M12: 60%+

### 2. Revenue Retention (Gross)
**Definisi:** % MRR yang retained, **TANPA** expansion (tanpa upsell).

**Cara hitung:** `MRR retained / Original MRR cohort` (downgrade dihitung sebagai loss)

**Target:** 90%+ gross MRR retention (B2B mid-market)

### 3. Net Revenue Retention (NRR)
**Definisi:** % MRR retained **DENGAN** expansion (upsell, cross-sell, additional seats).

**Cara hitung:** `(Original MRR + Expansion - Churn - Downgrade) / Original MRR`

**Target:**
- 100%+ healthy
- 110%+ strong
- 125%+ elite

**Top quartile B2B SaaS NRR: 113%.** Detail lebih di file 13.

### 4. User Retention (DAU/WAU/MAU)
**Definisi:** % user yang masih aktif (login or perform key action).

**Common metric:**
- DAU/MAU ratio (stickiness — 30%+ untuk daily-use product = sehat)
- WAU% — % user aktif minggu ke-N

---

## 🎯 CARA NEMUIN ROOT CAUSE CHURN

### Step 1: Segment Churned Users
Split user yang churn berdasarkan:
- Onboarding completed atau enggak
- Use core feature atau enggak
- Berapa lama dia engaged sebelum cabut
- Plan apa yang dia pake (paid tier)
- Source acquisition channel apa

### Step 2: Cari Pattern

**Pattern umum yang bocor:**
- User dari channel X punya churn 2x lebih tinggi → channel itu attract wrong ICP
- User yang skip step Y di onboarding punya 3x churn → step itu jadi kritis
- User yang pakai feature Z punya churn rendah → push feature Z di onboarding
- User di plan paling murah punya churn 5x → pricing strategy salah

### Step 3: Exit Survey

User yang cabut → otomatis email:

**Single question:** *"What's the main reason you're leaving?"*
- [ ] Too expensive
- [ ] Missing feature: ___
- [ ] Found alternative: ___
- [ ] Didn't have time to use
- [ ] Solved differently
- [ ] Other: ___

**Aturan:** 1 pertanyaan max. 30 detik effort. Higher response rate.

Kompilasi 50+ exit survey → pattern terlihat → roadmap product/marketing.

---

## 🛠️ STRATEGI NAEKIN RETENTION (TACTIC)

### 1. Habit Loop (Hooked Framework)
Trigger → Action → Reward → Investment.

Contoh untuk SaaS:
- **Trigger:** Email "your weekly report is ready"
- **Action:** User click, lihat report
- **Reward:** Insight bermanfaat
- **Investment:** User customize dashboard → personalized → harder to leave

### 2. Power User Identification + Reward
Identifikasi top 5% power user. Treat mereka spesial:
- Direct line to founder/CSM
- Early access feature
- Invite to private community
- Free swag/credits

Mereka jadi word-of-mouth machine.

### 3. Feature Adoption Push
User yang pake **3+ feature inti** = retention 5-10x lebih tinggi.

Strategi:
- Track feature adoption per user
- In-app prompt untuk feature yang relevant tapi belum dipake
- Email weekly digest: "Did you know [Feature] can save you X hours?"

### 4. Multi-Player Lock-In
User solo gampang cabut. User yang invite teammate = ada switching cost.

Bikin **invite flow super smooth**. Insentif kalau perlu (free Pro untuk inviter kalau invitee aktif).

### 5. Data Lock-In (Ethical)
Lebih banyak data user di sistem lo → lebih susah pindah.

**Ethical lock-in:**
- Easy export (always provide CSV/JSON export)
- Tapi mereka udah customize, integrasi, history — switching cost natural

**Unethical lock-in (HINDARI):** Lock data, sulitkan export, vendor lock-in jahat. Reputasi rusak.

---

## 🛠️ SARAN EKSEKUSI UNTUK SAAS LO

**Week 1 — Setup:**

1. **Pilih 1 retention metric utama** (logo retention M3 atau NRR).
2. **Setup cohort report** di Mixpanel/PostHog/Amplitude (free tier).
3. **Pull 6 bulan data** ke belakang.

**Week 2 — Analyze:**

4. **Plot cohort curve.** Mana bentuknya: Death / Smile / Power User?
5. **Identify drop-off point** terbesar — bulan ke berapa user paling banyak cabut?
6. **Segment churned users** by acquisition channel, plan, feature usage.

**Week 3-4 — Action:**

7. **Implement exit survey** (1 pertanyaan, gampang dijawab).
8. **Build at-risk detection** — user yang engagement turun 30%+ → trigger alert.
9. **Re-engagement campaign** untuk at-risk users.

**Month 2-3 — Compound:**

10. **Setup health score** dashboard per customer.
11. **Run quarterly cohort review** — pelajari trend.
12. **A/B test retention initiative** — pilih 1 hipotesis, run test, measure.

---

## 📖 BACAAN LANJUT

- Andrew Chen — "The Power User Curve" essay (andrewchen.com)
- Mixpanel Retention Guide (free)
- Sean Ellis — Hacking Growth chapter Retention
- Lenny's Newsletter — "Retention deep dive" series

---

## ❓ PERTANYAAN REFLEKSI

1. Cohort curve lo bentuknya seperti apa?
2. Drop-off terbesar di bulan ke berapa?
3. Apa 3 pattern dari churned users lo?
4. Berapa power user (top 5%) lo? Apakah lo treat mereka spesial?

Kalau lo nggak bisa jawab #1 — itu prioritas minggu ini. Tanpa cohort analysis, lo terbang buta.
