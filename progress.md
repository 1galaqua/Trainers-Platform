# Fitness Trainers Platform — progress

## Project vision

Build a SaaS platform for fitness coaches to manage trainees, training programs, progress tracking, and onboarding.

## MVP v1 (implemented)

- **Users:** Coach / Trainee / Admin roles via Prisma + local auth (Clerk optional in dev)
- **Training programs:** Create, edit, view; types (strength, hypertrophy, cutting, endurance, custom)
- **Exercises:** Sets, reps, rest, coach notes, YouTube links, instructions
- **Workout logging:** Trainee logs weight, reps, notes; coach can log for trainee (`/dashboard/trainees/[id]/log`)
- **Progress charts:** Weight and volume over time (green area chart)
- **Coaching period & quota:** Start/end dates, workout quota, completed count
- **Onboarding:** Dynamic questionnaire template, digital agreement + signature, version history, redo requests
- **Onboarding export:** HTML download, print, PDF; separate pages for questionnaire + agreement
- **PWA:** Home-screen icon + manifest
- **UI navigation:** Clickable cards on overview, trainees, programs

## Post-MVP (planned)

- Weekly questionnaire (coach-configurable questions)
- Nutrition plans
- Coach content/posts
- Cloud file storage (S3 / Vercel Blob)
- Progress photos (route exists, verify completeness)

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS 4 + shadcn/ui
- Local auth + optional Clerk
- MongoDB Atlas + Prisma
- Recharts, html2canvas, jsPDF

## Dev setup

1. Copy `.env.local` with `DATABASE_URL` and optional Clerk keys
2. `npm run db:push && npm run db:seed`
3. `npm run dev`
4. Set `DEMO_ROLE=TRAINEE` in `.env.local` to test trainee flows without Clerk

## Key routes

| Route | Role | Purpose |
|-------|------|---------|
| `/dashboard` | Coach | Overview (clickable stat cards) |
| `/dashboard/trainees` | Coach | Trainee list (clickable cards) |
| `/dashboard/trainees/[id]` | Coach | Trainee progress + coaching period |
| `/dashboard/trainees/[id]/log` | Coach | Log workout for trainee |
| `/dashboard/workouts` | Coach | Program list (clickable cards) |
| `/dashboard/workouts/new` | Coach | Create program |
| `/dashboard/workouts/[id]` | Coach | View program |
| `/dashboard/my-program` | Trainee | View active programs |
| `/dashboard/workouts/log` | Trainee | Log workout |
| `/dashboard/progress` | Trainee | Progress charts |
| `/dashboard/onboarding/*` | Trainee | Questionnaire + agreement |
| `/dashboard/onboarding-template` | Coach | Edit questionnaire/agreement template |

---

## מצב בדיקות (Testing status)

| נושא | מצב |
|------|-----|
| קבצי `*.test.ts` / `*.spec.ts` | **אין** |
| Vitest / Jest / Playwright | **לא מותקן** |
| סקריפט `test` ב-`package.json` | **אין** |
| CI pipeline | **אין** |

**מסקנה:** כל הלוגיקה נבדקת ידנית בלבד. להלן תוכנית בדיקות מומלצת.

---

## תשתית מומלצת

| שכבה | כלי | סיבה |
|------|-----|------|
| Unit | **Vitest** | מהיר, TypeScript native, מתאים ל-Next 15 |
| Component | **Vitest + @testing-library/react + jsdom** | טפסים, כפתורים, מצבי שגיאה |
| Integration (actions + DB) | **Vitest + Prisma** על MongoDB test (Memory Server או DB ייעודי) | בדיקת server actions אמיתיות |
| API routes | **Vitest** עם mock ל-`getCurrentUser` | קל יותר מ-E2E מלא |
| E2E | **Playwright** | middleware, redirects, RTL, auth |
| CI | GitHub Actions | `vitest run` + Playwright ב-PR |

### סקריפטים מוצעים (לא מיושמים עדיין)

```json
"test": "vitest",
"test:unit": "vitest run src/lib",
"test:integration": "vitest run src/server",
"test:e2e": "playwright test"
```

### מבנה תיקיות מוצע

```
src/
  lib/
    __tests__/
      trainee-status.test.ts
      onboarding-export-html.test.ts
      ...
  server/
    actions/
      __tests__/
        workouts.test.ts
        trainees.test.ts
        ...
e2e/
  onboarding.spec.ts
  workout-logging.spec.ts
  ...
```

---

## P0 — בדיקות קריטיות (לוגיקה עסקית)

### Unit — פונקציות טהורות (`src/lib/`)

#### `trainee-status.ts`
- [ ] `isCoachingPeriodActive` — בתוך תקופה / לפני / אחרי / תאריכים null
- [ ] `isCoachingPeriodExpired` — גבולות יום (startOfDay / endOfDay)
- [ ] `getEffectiveWorkoutsCompleted` — עדיפות ל-`workoutsCompleted` על פני ספירת sessions
- [ ] `getWorkoutsRemaining` — quota null/0 → 0 נותרו
- [ ] `getTraineeStatus` — active רק כשיש נותרו + בתקופה
- [ ] `matchesTraineeFilter` — כל ערך: `active`, `inactive`, `no_questionnaire`, `questionnaire_done`, `has_workouts_remaining`, `no_workouts_remaining`, `in_coaching_period`, `coaching_expired`

#### `onboarding-redo-status.ts` + `questionnaire-status.ts`
- [ ] אין submission → לא satisfied
- [ ] submission לפני `redoRequestedAt` → redo pending
- [ ] submission אחרי redo → satisfied, redo cleared
- [ ] אותה לוגיקה לשאלון ולהסכם

#### `password.ts` + `user-identity.ts`
- [ ] סיסמה: 8–16 תווים, אות גדולה/קטנה/ספרה
- [ ] טלפון: נורמליזציה `972`, 9 ספרות, התאמה
- [ ] גיל: 1–120, `parseAge`, `agesMatch`

#### `onboarding-template.ts`
- [ ] `parseQuestionFields` — JSON לא תקין → ברירת מחדל
- [ ] `formatAnswerValue` — מספר, textarea, ריק → `—`
- [ ] `legacyFieldsFromAnswers` / `answersFromLegacyResponse` — round-trip

#### `onboarding-export-html.ts`
- [ ] escape HTML (XSS) בשדות וטקסט הסכם
- [ ] שאלון בלבד / הסכם בלבד / שניהם
- [ ] כששניהם: שני `<section class="export-page">` + `export-page--break`
- [ ] legacy answers fallback

### Integration — Server Actions

#### `workouts.ts` — `persistWorkoutSession` / `logWorkoutAction` / `logCoachTraineeWorkoutAction`
- [ ] שמירה מוצלחת + יצירת `WorkoutSession` + `ExerciseLog`
- [ ] עדכון `workoutsCompleted` כשמוגדר
- [ ] חסימה: תקופת ליווי לא פעילה
- [ ] חסימה: מכסה נגמרה
- [ ] חסימה: תוכנית לא שייכת למתאמן
- [ ] מאמן: `logCoachTraineeWorkoutAction` — רק מתאמן שלו
- [ ] JSON logs לא תקין → שגיאה

#### `trainees.ts` — `updateCoachingPeriodAction`
- [ ] שדות חובה חסרים
- [ ] תאריך סיום לפני התחלה
- [ ] quota < 1
- [ ] completed > quota
- [ ] מאמן לא שייך למתאמן

#### `onboarding.ts`
- [ ] `submitQuestionnaireAction` — שדות required, ארכיון גרסה קודמת, ניקוי redo
- [ ] `submitAgreementAction` — checkbox + חתימה data URL, ארכיון

#### `auth.ts`
- [ ] `registerAction` — trainee עם coach, duplicate email, validation
- [ ] `loginAction` — credentials שגויים

### E2E (Playwright)

- [ ] הרשמה → שאלון → הסכם → גישה ל-my-program
- [ ] הגדרת תקופת ליווי + מכסה → דיווח אימון → ירידה במכסה
- [ ] חסימת דיווח כשהמכסה נגמרה

---

## P1 — בדיקות חשובות

### Unit

#### `onboarding-versions.ts`
- [ ] תווית גרסה נוכחית vs היסטורית
- [ ] `mapAgreementToVersion` — fallback לטקסט תבנית

#### `program-labels.ts`
- [ ] `calcVolume` = weight × reps × sets

#### `reset-password.ts`
- [ ] `resetPasswordInputFromFormData` — validation
- [ ] `resetPasswordByIdentity` — התאמת email + phone + age (mock DB)

#### `db-errors.ts`
- [ ] זיהוי שגיאות חיבור DB

### Integration — Server Actions

#### `programs.ts`
- [ ] `createTrainingProgramAction` — תרגילים, בעלות על מתאמן
- [ ] `updateTrainingProgramAction` — **אין מחיקת תרגיל עם logs**
- [ ] `getProgramByIdAction` — הרשאות מאמן

#### `trainees.ts`
- [ ] `requestQuestionnaireRedoAction` / `requestAgreementRedoAction`
- [ ] `getTraineeOnboardingVersionsAction` — מיון לפי תאריך

#### `coach-onboarding.ts`
- [ ] `updateCoachOnboardingTemplateAction` — שדות דינמיים
- [ ] `getTraineeOnboardingTemplateAction` — ברירת מחדל בלי מאמן

#### `fetch-onboarding-export.ts`
- [ ] גרסת שאלון נוכחית vs ארכיון
- [ ] `includeQuestionnaire=0` / `includeAgreement=0`
- [ ] אין הרשאה → null

### API Routes

#### `GET /api/trainees/[id]/onboarding-export`
- [ ] 401 ללא מאמן
- [ ] 404 מתאמן לא שייך / גרסה לא קיימת
- [ ] `Content-Disposition` + שם קובץ מסונן
- [ ] HTML עם שני דפים כששניהם מסומנים

#### `POST /api/auth/forgot-password`
- [ ] 400 validation / 503 DB חסר

### Component Tests

| קומפוננטה | מה לבדוק |
|-----------|----------|
| `CoachingPeriodForm` | submit, שגיאות, רוחב responsive |
| `LogWorkoutForm` | סריאליזציית logs, `submitAction` מוזרק |
| `TraineesList` | סינון + מצב ריק |
| `TraineeCard` | לחיצה על כרטיס vs כפתורי פעולה (pointer-events) |
| `CoachProgramsList` | לחיצה על כרטיס → צפייה, כפתור עריכה נפרד |
| `DynamicQuestionnaireForm` | שדות required דינמיים |
| `AgreementForm` | disabled עד חתימה + checkbox |
| `SignaturePad` | clear, data URL |
| `OnboardingDocumentDownload` | fallback ל-preview בכשל |
| `ProgressChart` | מצב ריק, מצב עם נתונים |

### E2E

- [ ] מאמן יוצר תוכנית → מתאמן רואה ב-my-program
- [ ] מאמן מדווח אימון עבור מתאמן (`/trainees/[id]/log`)
- [ ] בקשת מילוי שאלון מחדש → מתאמן ממלא → badge נעלם
- [ ] הורדת HTML / הדפסה / PDF מדף export
- [ ] איפוס סיסמה (email + phone + age)
- [ ] ניווט: סקירה → מתאמנים / תוכניות (כרטיסיות לחיצות)

---

## P2 — בדיקות משניות

### Unit
- [ ] `admin-stats.ts` — אגרגציית מאמנים
- [ ] `utils.ts` — `cn()` (ערך נמוך)
- [ ] `onboarding-export-client.ts` — mock iframe + html2canvas (דפדפן בלבד)

### Integration
- [ ] `getCoachTraineeListAction` — חישוב status + redo flags
- [ ] `getExerciseProgressAction` — חישוב volume לגרף
- [ ] `getAdminCoachStats` — דשבורד אדמין

### E2E
- [ ] סינון מתאמנים לפי כל האפשרויות
- [ ] עריכת תוכנית קיימת
- [ ] גרף התקדמות אחרי מספר אימונים
- [ ] מצב Clerk (אם production משתמש ב-Clerk)

---

## מפת כיסוי לפי מודול

| מודול | Unit | Integration | Component | E2E |
|-------|------|-------------|-----------|-----|
| Auth | ✅ P0 | ✅ P0 | ✅ P1 | ✅ P0 |
| Onboarding (שאלון+הסכם) | ✅ P0 | ✅ P0 | ✅ P1 | ✅ P0 |
| Onboarding export | ✅ P1 | ✅ P1 | ✅ P1 | ✅ P1 |
| Trainee status & filters | ✅ P0 | — | ✅ P1 | ✅ P1 |
| Coaching period & quota | ✅ P0 | ✅ P0 | ✅ P1 | ✅ P0 |
| Workout logging | — | ✅ P0 | ✅ P1 | ✅ P0 |
| Programs CRUD | ✅ P2 | ✅ P1 | ✅ P1 | ✅ P1 |
| Progress charts | ✅ P2 | ✅ P2 | ✅ P1 | ✅ P2 |
| Admin | — | ✅ P2 | — | ✅ P2 |
| PWA / manifest | — | — | — | ✅ P2 |

---

## סדר יישום מומלץ

1. **הקמת Vitest** + alias `@/*` + סקריפט `test`
2. **P0 unit** — `trainee-status`, `onboarding-redo-status`, `password`, `user-identity`
3. **P0 integration** — `logWorkoutAction`, `updateCoachingPeriodAction` (עם DB test)
4. **P0 E2E** — onboarding מלא + דיווח אימון
5. **P1** — export HTML, programs, redo flow, component tests
6. **CI** — GitHub Actions על כל PR
7. **P2** — שאר הכיסוי

---

## הערות טכניות ליישום

- **Auth בבדיקות:** mock ל-`requireCoach` / `requireTrainee` ב-action tests; E2E עם local auth + `prisma/seed.ts`
- **MongoDB:** `mongodb-memory-server` או Atlas DB ייעודי ל-CI (Prisma push לפני suite)
- **Server actions:** בדיקה ישירה עם FormData מדומה
- **Redirects:** `requireTraineeOnboarded` זורק redirect — לבדוק ב-E2E או mock
- **RTL:** Playwright עם `locale: 'he-IL'` לזרימות עברית
- **כיסוי יעד ראשוני:** ~70% ב-`src/lib/`, ~50% ב-server actions, 5–8 תרחישי E2E קריטיים

---

*עודכן: יוני 2026 — סקירת קוד + תוכנית בדיקות (ללא יישום)*
