# 24. POSTHOG AARRR FUNNEL — SETUP PRAKTIS
## Cara Konkret Implement Tracking AARRR di PostHog (Free Tier)

**📚 Sumber:** PostHog Product Engineers playbook (posthog.com/product-engineers/aarrr-pirate-funnel), PostHog official docs, Dave McClure AARRR framework (file 01)

---

## 🎯 KENAPA PILIH POSTHOG

Per founder review komunitas SaaS:

**Pros PostHog:**
- ✅ **Free up to 1M events/bulan** (paling generous di kategori)
- ✅ **Open source** — bisa self-host kalau privacy concern
- ✅ **Built-in: product analytics, session recording, feature flags, A/B testing, surveys** — all-in-one
- ✅ **Built for SaaS PLG** specifically (vs GA4 yang lebih general)
- ✅ **Funnel analysis** powerful out-of-the-box

**Alternative comparison:**
- **Mixpanel:** premium UX, $20+/mo paid, lebih established di enterprise
- **Amplitude:** enterprise-grade, free 50K MTU
- **GA4:** generic, struggle untuk product event tracking
- **June.so:** B2B focus, modern UX, paid only

**Recommendation:** Start dengan PostHog free tier. Switch nanti kalau butuh.

---

## 🏗️ SETUP STEP-BY-STEP (60 MENIT)

### Step 1: Account + Install (10 menit)

1. **Sign up:** posthog.com → Free Cloud account
2. **Get API key:** Project Settings → Project API Key
3. **Install snippet:** Add to website `<head>`:

```html
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init('YOUR_API_KEY', {api_host: 'https://app.posthog.com'})
</script>
```

4. **Verify installation:** PostHog dashboard → "Live events" tab → visit site, see event appear

### Step 2: Identify Users (10 menit)

PostHog by default track anonymous user (cookie-based). Identify-in setelah signup:

```javascript
// Saat user signup atau login
posthog.identify(
  user.id,  // unique user ID
  {
    email: user.email,
    name: user.name,
    plan: user.plan,           // 'free', 'pro', 'enterprise'
    signupDate: user.createdAt,
    companySize: user.companySize, // optional
  }
);
```

**Effect:** Anonymous events sebelum identify ke-link ke user ID. Lo bisa track full journey: ad click → landing → signup → activation → paid.

### Step 3: Define & Capture Events AARRR (30 menit)

5 tahap AARRR, masing-masing butuh 1-2 event minimum.

#### ACQUISITION

**Default events PostHog capture:**
- `$pageview` (auto)
- `$pageleave` (auto)
- UTM params (auto attached)

**Custom event tambahan:**
```javascript
// Saat user landing dari channel specific
posthog.capture('landing_page_view', {
  source: getURLParam('utm_source'),
  campaign: getURLParam('utm_campaign'),
  referrer: document.referrer,
});
```

#### ACTIVATION

**Crucial: define "aha moment" lo dulu (lihat file 06).**

Example untuk B2B SaaS project tool:
- Aha moment = "User create first project AND invite first teammate"

```javascript
// Saat user complete signup
posthog.capture('user_signed_up', {
  plan: 'free',
});

// Saat user complete pertama key action
posthog.capture('first_project_created', {
  projectName: project.name,
});

// Saat user invite teammate pertama
posthog.capture('first_teammate_invited', {
  inviteeEmail: invitee.email,
});

// AHA MOMENT — combined
posthog.capture('activated', {
  activationDays: daysSinceSignup,
});
```

#### RETENTION

```javascript
// Saat user login
posthog.capture('user_logged_in');

// Saat user use core feature
posthog.capture('core_feature_used', {
  featureName: 'create_task',
  count: featureUseCount,
});

// Weekly active signal
posthog.capture('weekly_active_user');
```

#### REFERRAL

```javascript
// Saat user invite teammate
posthog.capture('teammate_invited', {
  count: totalInvitesSent,
});

// Saat user share link
posthog.capture('content_shared', {
  channel: 'email', // atau 'twitter', 'whatsapp'
});

// Saat referral signup (track via UTM)
// Already covered via UTM auto-attach
```

#### REVENUE

```javascript
// Saat user upgrade ke paid
posthog.capture('subscription_started', {
  plan: 'pro',
  billingCycle: 'annual',
  mrr: 99,
});

// Saat user upgrade tier
posthog.capture('plan_upgraded', {
  fromPlan: 'pro',
  toPlan: 'business',
  mrrChange: 200,
});

// Saat user churn
posthog.capture('subscription_cancelled', {
  reason: 'too_expensive', // dari exit survey
  daysSinceSignup: 145,
});
```

### Step 4: Build Funnel Visualization (10 menit)

1. **PostHog Dashboard → Insights → New Insight → Funnels**
2. **Configure funnel:**
   - Step 1: `landing_page_view`
   - Step 2: `user_signed_up`
   - Step 3: `first_project_created`
   - Step 4: `activated`
   - Step 5: `subscription_started`
3. **Time window:** 30 days
4. **Save & pin to dashboard**

**Output:** Visual funnel showing drop-off di tiap step.

---

## 📊 DASHBOARD TEMPLATE — AARRR ALL-IN-ONE

Bikin dashboard PostHog dengan widget berikut:

### Widget 1: ACQUISITION
- **Total landing page view** (weekly)
- **Signup count by source** (organic, paid, referral)
- **Signup conversion rate** (signup/landing view)

### Widget 2: ACTIVATION
- **Activation rate** (activated/signup, last 30 days)
- **Time-to-Activation median** (days from signup to activated)
- **Funnel:** signup → first_project_created → activated

### Widget 3: RETENTION
- **Weekly cohort retention** (users yang signup tiap minggu — retention curve)
- **DAU / WAU / MAU**
- **DAU:MAU ratio** (stickiness)

### Widget 4: REFERRAL
- **Invites sent per user (avg)**
- **Signups via referral / total signups**
- **Viral coefficient** (calculated: invites × invite_acceptance_rate)

### Widget 5: REVENUE
- **MRR over time**
- **Conversion free → paid (last 30 days)**
- **Churn rate** (logo + revenue)

**Lo cek dashboard ini 1x/minggu minimum.** Trend matter, bukan snapshot single day.

---

## 🔬 COHORT ANALYSIS PRAKTIS

Cohort = user yang join di periode sama.

### Cara Build Cohort di PostHog:

1. **Insights → New → Retention**
2. **Select event yang define cohort:** typically `user_signed_up`
3. **Returning event:** `user_logged_in` atau `core_feature_used`
4. **Time period:** weekly or monthly
5. **Output: retention grid**

```
            W1    W2    W3    W4    W5    W6
Jan signup  100%  60%   45%   40%   38%   35%
Feb signup  100%  62%   47%   42%   40%
Mar signup  100%  65%   50%   45%
```

**Cara baca:**
- Kalau angka turun terus tajam ke 0 = **death curve** (no PMF)
- Kalau angka stabilize after drop = **smile curve** (PMF for subset)
- Kalau angka naik di later weeks = **power user curve** (excellent product)

Lihat file 11 untuk detail interpretasi cohort.

---

## 🚨 AT-RISK USER ALERT

Setup automation untuk catch user yang slipping:

### Definisi At-Risk User:
- User yang aktif 7 hari pertama TAPI ngga login >5 hari
- User yang core feature usage drop >50% week-over-week

### Setup di PostHog (Cohorts):

1. **People → Cohorts → New Cohort**
2. **Conditions:**
   - Performed event `user_logged_in` in last 30 days
   - NOT performed event `user_logged_in` in last 7 days
3. **Save as "at_risk_users"**

### Trigger Action

- **Manual:** review weekly, founder reach out personal
- **Automated** (via PostHog → external tool):
  - Webhook trigger → CRM update
  - Slack notification to CSM team
  - Auto-email via Customer.io / Loops

---

## 🎯 EVENT NAMING CONVENTION

Penting buat ngga messy. Aturan:

**Format:** `[noun]_[verb]_[optional modifier]`

✅ Good:
- `user_signed_up`
- `project_created`
- `subscription_started`
- `feature_used`
- `invite_sent`

❌ Bad:
- `signUp` (camelCase inconsistent)
- `User Signed Up` (spaces, hard to query)
- `SIGNUP_EVENT` (uppercase shouting)
- `track_signup` (vague verb)

**Properties** in `snake_case`:
- `plan_name`
- `mrr_amount`
- `days_since_signup`

---

## 🛠️ ADVANCED: A/B TESTING DI POSTHOG

Free tier include A/B testing capability:

1. **Feature Flags → New flag**
2. **Variants:** Control (50%) vs Variant A (50%)
3. **Add code:**

```javascript
const variant = posthog.getFeatureFlag('new_onboarding');
if (variant === 'variant-a') {
  showNewOnboarding();
} else {
  showOriginalOnboarding();
}
```

4. **Track conversion** dengan event yang relevant
5. **PostHog → Experiments** auto-calculate significance

---

## ⚠️ COMMON MISTAKES

### 1. Over-Track Event di Awal
Track 100 event setiap interaction = noise. **Start dengan 10-15 core events**, expand later.

### 2. Inconsistent Event Naming
Project1 pake `signup`, project2 pake `user_signed_up` — query nightmare. **Set convention from day 1.**

### 3. Track Tapi Tidak Pernah Liat Dashboard
Setup, lupa cek. **Block 30 menit/minggu** untuk dashboard review.

### 4. Track Tanpa Identify
Anonymous events doang = ngga bisa link journey. **Identify after signup wajib.**

### 5. Cuma Track, Tanpa Act
Liat funnel bocor di step X, tapi ngga fix → useless. **Tracking is mean to action.**

---

## 🛠️ SARAN EKSEKUSI MINGGU INI

**Hari 1-2 (2 jam):**
1. **Sign up PostHog** free account
2. **Install snippet** di website + app
3. **Verify event flowing** (live events tab)

**Hari 3-5 (3 jam):**
4. **Define 5 events AARRR** untuk produk lo (sesuai contoh atas)
5. **Implement event capture** di code
6. **Identify users** post-signup

**Week 2 (2 jam):**
7. **Build dashboard** 5 widget AARRR
8. **Build first funnel** (acquisition → activation → revenue)
9. **Setup at-risk cohort**

**Ongoing:**
10. **Block 30 menit/minggu** review dashboard
11. **Tiap bulan**: cohort analysis review
12. **Iterate:** identify bottleneck, run experiment, measure

---

## 📊 ANGKA YANG HARUS LO TAU TIAP MINGGU

5 angka minimum untuk founder weekly review:

1. **Total signup last 7 days**
2. **Activation rate last 30 days**
3. **MRR current**
4. **Monthly churn rate**
5. **Weekly active users**

Kalau lo nggak bisa jawab 5 angka ini dengan akurat → setup tracking dulu, sebelum hal lain.

---

## 📖 BACAAN LANJUT

- **PostHog docs** (posthog.com/docs) — komprehensif
- **PostHog Product Engineers blog** — practical PLG insight
- **Mixpanel learning center** (analytics fundamentals applicable)
- **Lenny's Newsletter** — "Activation deep dive" series
- **Wes Bush PLG book** chapter 4 (metrics)

---

## ❓ PERTANYAAN REFLEKSI

1. Lo udah punya analytics tool yang track event (bukan just GA4)?
2. Lo bisa cek activation rate dalam 1 menit (atau butuh hour digging data)?
3. Cohort retention chart lo akses kapan terakhir?
4. Berapa event lo track sekarang? (10-20 = sweet spot pre-scale)

**Aturan emas:** Lo nggak bisa improve apa yang lo nggak ukur. Setup tracking = **non-negotiable foundation**.
