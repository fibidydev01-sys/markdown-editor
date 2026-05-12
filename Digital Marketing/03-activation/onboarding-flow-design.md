# 09. ONBOARDING FLOW DESIGN
## Praktis: Cara Design Alur Onboarding yang Konvert

**📚 Sumber:** Wes Bush PLG book Ch. 13-14, Intercom on Onboarding, Userpilot Best Practices, Lenny's Activation Series, Casey Winters essays

---

## 🎯 PRINSIP DESIGN ONBOARDING

3 aturan dasar dari Wes Bush + Casey Winters:

1. **Minimize friction, maximize relevance.** Tiap step harus rich-with-value.
2. **Show, don't tell.** Interactive > video > text.
3. **Personalize based on goal.** User yang punya goal beda butuh path beda.

---

## 🏗️ ANATOMI ONBOARDING YANG MENANG

### Tahap 1: SIGNUP (Detik 0-60)

**Goal:** Lowest possible friction untuk masuk produk.

**Yang OPTIMAL:**
- 1 field: email (kalau bisa, social login: Google/Apple/GitHub)
- NO email verification mandatory sebelum bisa pake produk
- NO credit card untuk trial (kecuali pricing strategy lo spesifik butuh)
- 1 button: "Get Started"

**Yang BUNUH conversion:**
- 5+ field di signup form
- "Please verify your email before continuing" yang mandatory
- "Choose your plan" sebelum user tau produknya apa
- Credit card upfront tanpa demonstrate value

**Conversion impact:** Tiap field tambahan = ~10% drop-off (HubSpot data).

### Tahap 2: WELCOME & PERSONALIZATION (Detik 60-180)

**Goal:** Tanya 1-3 question yang relevan untuk personalize experience.

**Pertanyaan yang work:**
- *"What's your main goal with [Product]?"* (multiple choice 3-5 option)
- *"What's your role?"* (Founder / Marketing / Sales / Dev)
- *"How many people in your team?"* (Solo / 2-10 / 11-50 / 50+)

**Pertanyaan yang SALAH (skip!):**
- *"Tell us about your business"* (open-ended, bikin males)
- Profile picture mandatory
- Company info detail sebelum value-realized

**Tujuan:** Data ini langsung dipake untuk **personalize next screen**. Bukan untuk database marketing. Kalau user nggak lihat efek pertanyaan, mereka bakal skip future questions.

### Tahap 3: GUIDED FIRST ACTION (Detik 180-360)

**Goal:** User selesain 1 konkret action yang ngarah ke aha moment.

**Pattern yang work:**

Untuk **content creation tool** (Notion, Canva, Figma):
- Auto-load template berdasarkan goal yang dia pilih
- Tunjukin 1 click action: edit text / change color / add image
- Visible result instan

Untuk **collaboration tool** (Slack, Linear, Trello):
- Pre-populate workspace dengan sample data
- Push "invite teammate" sebagai natural next step
- Tunjukin di hover apa yang bakal mereka liat post-invite

Untuk **analytics/data tool** (Mixpanel, Amplitude):
- Connect data source (Stripe / GA / dll) — instant insight unlock
- Pre-built dashboard yang langsung kelihatan
- Tour 3 insight teratas dari data mereka

### Tahap 4: ACTIVATION MOMENT (Menit 5-30)

User reach aha moment. **Celebrate!**

- Animation/confetti yang celebrate
- Show progress: "🎉 You've just [accomplished outcome]. Most users see 3x productivity within first week."
- Suggest natural next step

### Tahap 5: HABIT FORMATION (Hari 1-14)

**Goal:** Bawa user dari "tried it" jadi "use it daily/weekly".

**Trigger yang work:**
- Day 1 email: "Here's how to [unlock next outcome]"
- Day 3 email: "Most successful users do [action]"
- Day 7: trigger "your team is missing out" kalau belum invite teammate
- Day 14: "Last chance to set up [integration X] — saves 5 hours/week"

**Aturan:** Trigger HARUS event-based + relevant. Bukan time-based blasting.

---

## 🎨 PROGRESS BAR / CHECKLIST (HIGH-IMPACT WIN)

Pattern yang dipake Slack, Notion, Canva, Figma:

```
Setup checklist (3/5 complete) ─────────────── 60%

✅ Verify email
✅ Create your workspace  
✅ Customize your profile
☐ Send your first message
☐ Invite a teammate
```

**Why it works:**
- **Loss aversion:** orang ngga suka liat checklist incomplete
- **Tangible progress:** semua step ada, jelas berapa lama lagi
- **Optional gamification:** unlock badges, complete sequence

**Implementation tip:** Sembunyiin setelah completed. Jangan jadi noise permanen.

---

## 🔀 SEGMENTED ONBOARDING (LEVEL UP)

Onboarding yang **branching** berdasarkan jawaban user:

```
Q: What's your main goal?
├── [A] "Just exploring" 
│       → Light tour, no urgency, demo workspace
├── [B] "Specific use case (specify)"
│       → Goal-specific template + tutorial
└── [C] "Migrate from competitor"
       → Import wizard + comparison guide
```

**Tools yang support:** Userpilot, Appcues, Chameleon, Pendo. Bisa juga code sendiri (basic React + feature flag).

**Effort vs Impact:** Segmented onboarding bisa naikin activation 20-40% kalau dieksekusi baik. Tapi butuh proper analytics + iteration. Jangan rush.

---

## 📧 ONBOARDING EMAIL SEQUENCE (TEMPLATE)

Sequence dasar untuk SaaS 14-day trial:

### Day 0: Welcome (immediate after signup)
**Subject:** Welcome to [Product]! Here's how to [achieve outcome] in 5 minutes
**Body:**
- Personal welcome dari founder (kalau scale memungkinkan)
- 1 jelas CTA: link langsung ke first action
- Mention support: "Reply to this email anytime"

### Day 1: First Outcome (event-triggered jika user belum start)
**Subject:** Quick question — what's stopping you from [outcome]?
**Body:** Simple barriers question, offer to help

### Day 3: Best Practice (event-triggered after first action)
**Subject:** 3 ways top users get [outcome] fastest
**Body:** Specific tips, link to power-user feature

### Day 7: Social Proof + Next Level
**Subject:** What [Customer Name] achieved with [Product] in week 1
**Body:** Case study, push to advanced feature

### Day 10: Team Push (kalau belum invite teammate)
**Subject:** Your teammates are missing out
**Body:** Show value of multi-user, easy invite CTA

### Day 12: Trial Ending Soon
**Subject:** 2 days left — here's what you'll lose
**Body:** Specific data they've created, clear upgrade CTA

### Day 14: Trial End
**Subject:** Your trial ended (but here's a special offer)
**Body:** Time-limited discount kalau upgrade dalam 7 hari

**Critical:** Setiap email **event-triggered**, bukan hard-coded date. Kalau user upgrade di Day 5, semua email selanjutnya stop.

---

## 🚫 ANTI-PATTERN ONBOARDING (HINDARI!)

### ❌ "Tour 12 Feature di Hari 1"
User nggak butuh tour 12 feature. Mereka butuh tau **1 feature yang nyelesain problem mereka sekarang**.

### ❌ "Mandatory Tutorial Video 8 Menit"
60% user nggak nonton sampe abis. Bikin interactive walkthrough max 60 detik.

### ❌ "Free Trial 30 Hari untuk Produk dengan TTV 5 Menit"
Buang-buang urgency. Trial period ideal = 1.5x dari TTV typical. Kalau TTV lo 1 hari, trial 7 hari cukup.

### ❌ "Email Blast Sama untuk Semua User"
User yang skip 5 step beda butuh email beda dari user yang complete 5 step. Event-trigger.

### ❌ "Onboarding 1x, Trus Lupa"
Onboarding bukan event. Continuous. New feature rollout = re-onboarding mini.

---

## 📊 METRIC TO TRACK PER STEP

Setup di analytics:

```
Funnel events:
1. landed_on_signup_page
2. completed_signup
3. completed_welcome_question
4. started_first_action
5. completed_first_action       ← Aha moment
6. invited_first_teammate
7. used_core_feature_3x
8. day_7_active
9. converted_to_paid

Per-step metric:
- Drop-off rate per step (target <30%)
- Time spent per step
- Bounce-back rate (kembali ke step sebelumnya)
```

---

## 🛠️ SARAN EKSEKUSI UNTUK SAAS LO

**Week 1 — Audit:**

1. **Daftarin semua step onboarding lo** dari signup ke aha moment.
2. **Hitung drop-off rate** tiap step (dari analytics).
3. **Identifikasi 3 step terburuk** (drop-off tertinggi).
4. **User test 5 orang baru** lewatin onboarding sambil ngomong ("think aloud protocol").

**Week 2-4 — Quick Wins:**

5. **Remove field-field yang nggak critical** di signup form.
6. **Add progress bar / checklist** kalau belum ada.
7. **Set up 1 event-triggered email** (Day 1 nudge untuk yang belum start).
8. **Bikin invite teammate prominent** dalam 5 menit pertama.

**Month 2-3 — Deeper:**

9. **A/B test variant onboarding** (e.g., guided vs. self-explore).
10. **Implement segmented path** berdasarkan goal user.
11. **Setup health score dashboard** — track sinyal early-churn.

**Target realistis 90 hari:**
- Activation rate +10-15 percentage points
- TTV cut 30-50%
- Day-7 retention naik 20%+

---

## 📖 BACAAN LANJUT

- Wes Bush PLG book — chapter 13-14 (onboarding mechanics)
- Casey Winters — caseyaccidental.com/onboarding-saas (essays)
- Lenny's Newsletter — Activation deep dive 4-part series
- Samuel Hulick — UserOnboard.com — teardown onboarding produk top
