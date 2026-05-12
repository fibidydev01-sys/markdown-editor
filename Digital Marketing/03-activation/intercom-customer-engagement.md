# 10. INTERCOM ON CUSTOMER ENGAGEMENT — DIGEST
## "Right message, right people, right time, right medium."

**📚 Sumber:** Des Traynor, John Collins (Intercom)
**🔗 Free PDF:** https://assets.ctfassets.net/xny2w179f4ki/23cH2wrrLfrRhpojfEkdpG/7c2221b0d0f38e0f77eb0e86c82c9211/intercom-on-customer-engagement__3_.pdf
**🔗 Hub:** https://www.intercom.com/resources/books/intercom-customer-engagement

---

## 🎯 ONE-LINE THESIS BUKU INI

> *"Messages that don't consider their recipient will fail. The more precise you are in the targeting of your message, the more successful it will be."*

Customer engagement bukan soal **sering kirim message** — soal **kirim message yang tepat ke orang yang tepat di waktu yang tepat lewat medium yang tepat**.

Customer rata-rata terima **122 email per hari**. Plus in-app message + push notification. Lo lagi compete untuk **attention**, bukan inbox space.

---

## 🏗️ FRAMEWORK BUKU INI

### Bagian 1: DEFINING "ENGAGED CUSTOMER"

Definisi "engaged customer" beda per produk. Buat lo definisikan dulu **apa engaged customer untuk produk lo**.

**Contoh definisi per kategori:**
- **Slack:** User yang kirim 10+ pesan per minggu di workspace
- **Notion:** User yang edit minimal 1 page per minggu
- **Mixpanel:** User yang login + lihat dashboard 3x per minggu
- **Stripe:** User yang process 1+ payment per bulan

**Pertanyaan diagnostik:**
- Apa action yang membedakan customer aktif vs churned di data lo?
- Berapa frekuensi minimum untuk dianggap "engaged"?

**Sekali lo tau definisi engaged**, lo bisa:
- Track % engaged user dari total
- Identify yang slipping (dari engaged → not engaged) sebelum mereka churn
- Trigger re-engagement campaign tepat waktu

---

### Bagian 2: SEGMENTASI USER

Buku ngerekomen segmentasi minimum berdasarkan:

**Lifecycle stage:**
1. **New users** — Baru signup, belum activated
2. **Active users** — Activated, regular usage
3. **Power users** — Heavy usage, advocate potensial
4. **At-risk users** — Engagement turun, signal churn
5. **Churned users** — Cabut, tapi mungkin bisa di-win-back

**Behavioral segments:**
- User per goal (didapat dari onboarding question)
- User per feature usage pattern
- User per company size / industry / use case

**Setiap segment butuh message berbeda.** Segment minimal yang harus lo punya:
- New (D0-D14)
- Activated (D14+)
- Power user (top 20% engagement)
- At-risk (declining engagement)

---

### Bagian 3: WAKTU PENGIRIMAN MATTERS

Quote yang impactful: *"Your carefully worded product announcement might work fantastically well as an in-app message at 2pm mid-week, but will likely fall flat if it's emailed at 3am on a Sunday morning."*

**Best practice timing:**
- **Email B2B:** Selasa-Kamis, jam 9-11 pagi atau 1-3 siang user timezone
- **In-app message:** Saat user lagi aktif (literally pas dia online)
- **Push notification:** Hanya untuk yang urgent + relevant. Hindari weekend pagi & malam.

**Anti-pattern:**
- Drip email yang fixed schedule (Day 1, 3, 7, 14) ngga peduli kapan user aktif
- Push notif yang fire pas user lagi sleep (timezone)

---

### Bagian 4: PILIH MEDIUM YANG TEPAT

Tiap medium ada strength berbeda:

#### EMAIL
**Strength:**
- Reach user yang nggak aktif di produk
- Bisa long-form content
- Async — user buka kapan mereka mau
- Tracking yang mature

**Pakai untuk:**
- Onboarding sequence
- Renewal reminder
- Best practice content
- Win-back campaign

**Aturan:** Email lo HARUS bermanfaat sendiri. Jangan cuma "log in to see what's new" — udah males user.

#### IN-APP MESSAGE
**Strength:**
- Real-time, contextual
- High CTR (user lagi engaged)
- Nggak bisa di-ignore kayak email

**Pakai untuk:**
- Onboarding guide step-by-step
- New feature announcement
- Upgrade prompt saat hit limit
- Survey singkat

**Aturan:** **Jangan blokir core workflow**. User datang ke produk untuk kerja, bukan untuk baca message lo.

#### PUSH NOTIFICATION
**Strength:**
- Instant attention
- Re-engage user yang udah cabut dari produk

**Pakai untuk:**
- Critical event (payment fail, comment di doc, due date approaching)
- Important social trigger (teammate added you)

**Aturan:** SPARING. Tiap push yang nggak relevan = increase chance user disable notif.

---

### Bagian 5: CONTEXT IS EVERYTHING

Quote kunci: *"Context is especially important for customer engagement."*

Message yang sama bisa **win or fail** tergantung konteks.

**Contoh:**
- "Upgrade to Pro" prompt pas user **hit feature limit** → high conversion
- "Upgrade to Pro" prompt pas user **first login** → annoying, low conversion
- Same message, beda konteks.

**Aturan praktis:** Buat aturan trigger berdasarkan:
1. **What** user lakuin (event)
2. **When** mereka lakuin (timing)
3. **Where** mereka di dalam app (page/feature)
4. **Who** mereka (segment)

---

### Bagian 6: HINDARI "CONFIGURATION OF FALLING DOMINOES"

Anti-pattern yang Intercom sebut: predetermined sequence yang ngga adapt ke real behavior.

**Skenario bahaya:**
```
User sign up → Welcome email (auto)
User sign up Day 2 → "Have you tried X?" email (terjadwal)
User sign up Day 3 → "Pro tip Y" email (terjadwal)
User sign up Day 7 → "Don't forget Z" email (terjadwal)
```

Masalah:
- User yang udah complete X di Day 1 masih dapet email "have you tried X" — annoying
- User yang skip onboarding masih disambut "pro tip" — bingung
- User yang udah upgrade masih dapet trial reminder — embarrassing

**Solusi: event-triggered, bukan time-triggered.**

```
User completed X → trigger "Now try Y" email
User belum complete X dalam 3 hari → trigger nudge email  
User hit feature limit → trigger upgrade email
User logged in 7 hari ngga login → trigger re-engagement
```

---

### Bagian 7: FEEDBACK COLLECTION YANG WORK

Quote kunci: *"Writing emails or in-app messages to gather feedback isn't easy. You're asking a favor of the recipient."*

**Yang fail:**
- ❌ Generic survey 10 pertanyaan, open-ended
- ❌ "How do you find our product?"
- ❌ NPS tanpa context (user ngga tau kenapa ditanya)

**Yang work:**
- ✅ 1-2 pertanyaan specific
- ✅ Pas konteks tepat (after they completed action: "Was this easy to set up? 1-5")
- ✅ Berikan return value (post-survey: "Based on your answer, here's a guide for [topic]")

**Sean Ellis PMF Survey (klasik):**
*"How would you feel if you could no longer use [Product]?"*
- Very disappointed (40%+ = PMF signal)
- Somewhat disappointed
- Not disappointed

Plus follow-up: *"What type of person do you think would benefit most from [Product]?"*

Jawaban "very disappointed" cohort = ICP refinement gold.

---

## 💎 INSIGHT KUNCI

### Insight 1: Engagement ≠ Vanity Metrics
Login count itu vanity. Yang penting: apakah user achieve outcome via produk lo.

### Insight 2: Less Is More
Lebih baik 3 email yang super-relevant per bulan daripada 12 email random.

### Insight 3: Personalization Lebih dari "Hi {{First Name}}"
True personalization = message konten + timing + medium yang match dengan stage user.

---

## 🛠️ SARAN EKSEKUSI UNTUK SAAS LO

**Week 1 — Audit:**

1. **Define "engaged user"** untuk produk lo. 1 kalimat spesifik.
2. **List semua message yang user lo terima** sekarang (email, in-app, push).
3. **Cek per message:** apakah event-triggered atau time-triggered?
4. **Identify message yang time-triggered** dan migrate ke event-triggered.

**Week 2-4 — Implement:**

5. **Setup 3 segmentasi minimal:**
   - New users (0-14 hari)
   - Active users
   - At-risk users (engagement declining)

6. **Setup 1 event-triggered onboarding sequence** kalau belum ada.

7. **Audit timing semua email lo** — apakah weekend? Outside business hours? Adjust.

**Month 2-3 — Optimize:**

8. **A/B test message variant** untuk top-3 message lo (welcome, activation nudge, renewal).

9. **Implement at-risk detection** — user yang engagement turun → otomatis trigger re-engagement.

10. **Add health score dashboard** untuk monitor cohort engagement.

---

## 📖 BACAAN LANJUT

- Intercom blog (intercom.com/blog) — banyak deep-dive update
- Lifecycle marketing playbook by Customer.io
- "Hooked" by Nir Eyal (buku, soal habit formation)
- Wes Bush PLG book chapter 14 (re-engagement)

---

## ❓ PERTANYAAN REFLEKSI

1. Apa definisi "engaged user" untuk produk lo (1 kalimat spesifik)?
2. Berapa segment marketing campaign lo? Kalau cuma 1 segment ("all users"), itu masalah.
3. Berapa % message lo yang event-triggered vs time-triggered?
4. Kapan terakhir lo audit timing email lo?
