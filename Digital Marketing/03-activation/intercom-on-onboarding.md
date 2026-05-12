# 07. INTERCOM ON ONBOARDING — DIGEST
## "Onboarding is not a metric, it's an outcome."

**📚 Sumber:** Intercom team (Des Traynor, John Collins, Ruairi Galavan)
**🔗 Free PDF:** https://assets.ctfassets.net/xny2w179f4ki/4PQNPvvOxsGlGYYum4LIbM/13c80de059d4866837da972661f8cdaa/intercom-on-onboarding.pdf
**🔗 Hub:** https://www.intercom.com/resources/books/intercom-onboarding

---

## 🎯 ONE-LINE THESIS BUKU INI

> *"Onboarding isn't a metric, it's an outcome. Onboarding means ensuring as many users as possible become successful ones."*

Sign up bukan goal. **User sukses** adalah goal. Sign up cuma awal perjalanan.

> *"Getting new users to sign up is easy. Getting them to come back again and again is the hard part. That's where onboarding comes in — it turns signups into happy, successful customers."*

---

## 🏗️ FRAMEWORK BUKU (9 BAB SAYA RINGKAS)

### 1. ONBOARDING ITU UNIVERSAL PROBLEM

Setiap produk software punya masalah onboarding. Bedanya: yang menang nge-design onboarding **deliberately**, yang kalah biarin user belajar sendiri.

**Fakta:** Onboarding adalah **satu-satunya hal yang DIPASTIKAN semua user lo akan lakuin** — dan dijamin **banyak yang stuck di situ**.

### 2. FIRST IMPRESSION = MAKE OR BREAK

Detik pertama user pake produk = makan-makan. Yang harus ada:

**3 elemen first impression yang menang:**

1. **Familiarity** — User langsung paham "ini tool kayak [X yang udah dia tau], tapi untuk [Y]"
2. **Clear next action** — Nggak ada empty state membingungkan. Selalu jelas apa yang harus diklik next.
3. **Promise reinforced** — Apa yang dijanjikan di marketing harus langsung kelihatan di produk.

**Anti-pattern:** User baru sign up langsung disambut dengan dashboard kosong dan 12 tab. Mereka cabut dalam 30 detik.

### 3. UNDERSTAND USER GOALS, BUKAN FEATURE LIST

User nggak sign up untuk "pakai feature lo." Mereka sign up untuk **achieve outcome tertentu**.

**Anti-pattern onboarding:**
*"Here's our dashboard. Here's our reports tab. Here's our settings..."*

**Better:**
*"What do you want to achieve first?"*
- [ ] Track my projects
- [ ] Set up team collaboration  
- [ ] Generate first report

→ Berdasarkan jawaban, tunjukin path onboarding berbeda.

### 4. CONTINUOUS VALUE, BUKAN ONE-TIME SETUP

Onboarding bukan "kelar setelah hari pertama". Onboarding = **continuous education** sampe user jadi power user.

**Tiap milestone, tunjukin value baru:**
- Day 1: Setup basic
- Day 3: Use core feature
- Day 7: Try advanced feature
- Day 14: Invite team
- Day 30: Setup integration

Tiap step harus punya **trigger relevan** (in-app message, email, push notif) — tapi nggak boleh spammy.

### 5. SCALE TANPA KEHILANGAN PERSONAL TOUCH

Pas user lo 10 → onboarding manual via call masih bisa.
Pas user lo 100 → mulai butuh automation.
Pas user lo 1000+ → automation full + personalization layer.

**Layered approach:**
- **Tier 1 (90% user):** Self-serve onboarding via in-app guide + email sequence
- **Tier 2 (high-value 9%):** Onboarding email yang lebih personalized + offer demo call
- **Tier 3 (enterprise 1%):** Dedicated CSM + custom onboarding plan

### 6. EVENT-TRIGGERED, BUKAN TIME-TRIGGERED

**Anti-pattern (BIASA ada):**
- Day 1: "Welcome email"
- Day 3: "Have you tried X?"
- Day 7: "Don't forget Y!"

**Masalahnya:** User yang udah set up X di Day 1 tetep dapet email "Have you tried X?" di Day 3. Annoying. Unsubscribe.

**Better — Event-triggered:**
- User signup → Welcome email (auto)
- User completed X → trigger "Now try Y" email
- User belum complete X dalam 3 hari → trigger nudge email
- User completed X+Y → trigger "You're ready for advanced features"

**Tool yang bisa support:** Customer.io, Intercom (obvious), Loops, ActiveCampaign. **Tidak** Mailchimp basic (terlalu basic untuk SaaS lifecycle).

### 7. CHOOSE THE RIGHT MEDIUM PER CONTEXT

Onboarding bisa via banyak channel. Tiap channel ada strength berbeda:

| Channel | Strength | Weakness | Pakai Untuk |
|---------|----------|----------|-------------|
| **In-app message** | Real-time, contextual | Cuma reach user yang aktif | Guidance saat user di produk |
| **Email** | Bisa reach user yang nggak aktif | Bisa diabaikan | Nudge balik, deep-link |
| **Push notification** | Urgent, top-of-mind | Annoying kalau berlebihan | Critical event saja |
| **In-product tour** | Step-by-step learning | Mengganggu kalau user udah expert | First-time users |
| **Documentation/Help center** | On-demand | Passive | Power users yang nyari deep info |

**Aturan:** Match medium ke context. **Welcome message** di-app oke; **renewal reminder** wajib email; **payment failed** harus email + in-app.

### 8. JANGAN UNDERESTIMATE EMAIL

Email itu workhorse onboarding yang sering diabaikan.

Quote dari buku: *"Email is the gentle, dependable workhorse that you can rely on. It's the most common messaging interface. No custom UI, no learning curve."*

Email yang work untuk SaaS:
- Personal (dari "Sarah, founder" bukan "no-reply")
- Short — 50-150 kata, bukan novel
- 1 CTA jelas (bukan 5 link berbeda)
- Mobile-readable
- Subject line specific, bukan clickbait

### 9. METRIC YANG MATTERING

Per buku, ada 3 metric onboarding utama:

1. **Activation Rate** — % signup yang reach aha moment
2. **Time to Value (TTV)** — durasi sampe activation
3. **Onboarding Completion Rate** — % yang complete full onboarding journey

**Plus 1 leading indicator:** Day-1 retention. Kalau D1 retention <50%, onboarding lo bermasalah.

---

## 💎 INSIGHT KUNCI DARI BUKU

### Insight 1: "Configuration of Falling Dominoes"

Quote yang impactful: *"You sign up for that cool productivity app on Product Hunt, invite your first teammate, create your first to-do list, upload your first file all in the space of 30 minutes. Like a configuration of falling dominoes, a series of messages hits your inbox in a predetermined order until they run out, and you unsubscribe."*

Translasi: Onboarding lo nggak boleh **predetermined sequence**. Harus **adaptive ke behavior actual** user.

### Insight 2: Different User, Different Path

*"Event-triggered drip campaigns get this wrong all the time. They struggle to adapt to how different customers use your product in different ways and fail to take into account that people don't behave in straight lines, from point A to B to C."*

User journey bukan garis lurus. Onboarding lo harus support branching paths.

### Insight 3: Be Specific About What You Ask

Quote: *"Writing emails or in-app messages to gather feedback isn't easy. You're asking a favor of the recipient, in exchange for making the product better for them."*

Kalau lo minta feedback — be **spesifik**.
- ❌ "How are you finding our product?" (terlalu broad, ngga ada yang reply)
- ✅ "On a scale 1-5, how easy was setting up your first project?" (spesifik, gampang dijawab)

---

## 🛠️ SARAN EKSEKUSI UNTUK SAAS LO

**Audit onboarding flow lo (week 1):**

1. **Sign up baru pake email baru** dan jalanin onboarding lo end-to-end.
2. **Catat:**
   - Berapa step total?
   - Step mana yang bikin lo bingung?
   - Berapa lama dari signup ke "I get it"?
3. **Tanya 5 user terakhir lo:**
   - *"Saat pertama pake, apa yang paling membingungkan?"*
   - *"Apa 1 hal yang harus kita ubah?"*

**Implement quick wins (week 2-4):**

4. **Reduce field di signup form** ke minimum absolut (email + password, that's it idealnya).
5. **Set up checklist onboarding** dengan progress bar.
6. **Bikin "invite teammate" prominent** dalam 5 menit pertama (kalau multi-user).
7. **Setup minimal 1 event-triggered email** — bukan time-based.

**Long-term (month 2-3):**

8. **Build segmented onboarding paths** berdasarkan goal user yang ditanya di signup.
9. **A/B test guided tour vs no-tour** — kadang less is more.
10. **Setup customer health score** — track sinyal early churn.

---

## 📖 BACAAN LANJUT SETELAH INI

- Intercom on Customer Engagement (file 10)
- Lenny's Newsletter — Activation series
- Casey Winters — "Onboarding is the most crucial part of growth strategy"
- Wes Bush PLG book chapter 13-14 (onboarding mechanics)

---

## ❓ PERTANYAAN REFLEKSI

1. Berapa step di signup → first value lo?
2. Bisa lo pangkas separuh tanpa kehilangan critical info?
3. Email onboarding lo time-based atau event-based?
4. Day-1 retention rate lo berapa? (Itu indikator kesehatan onboarding paling cepat)
