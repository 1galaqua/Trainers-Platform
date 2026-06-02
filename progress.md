# Fitness Trainers Platform — progress

## Project vision

Build a SaaS platform for fitness coaches to manage trainees, training programs, progress tracking, and onboarding.

## MVP v1 (implemented)

- **Users:** Coach / Trainee roles via Prisma + Clerk (optional in dev)
- **Training programs:** Create programs with types (strength, hypertrophy, cutting, endurance, custom)
- **Exercises:** Sets, reps, rest, coach notes, YouTube links, instructions
- **Workout logging:** Trainees log weight, reps, notes — saved to history
- **Progress charts:** Weight and volume (weight × reps × sets) over time
- **Progress photos:** Up to 3 uploads per week (front / side / back)
- **Initial questionnaire:** One-time onboarding form
- **Agreement:** Digital signature with date and IP storage

## Post-MVP (planned)

- Weekly questionnaire (coach-configurable questions)
- Training package tracking (10 / 20 / 30 sessions with progress bar)
- Nutrition plans
- Coach content/posts
- Cloud file storage (S3 / Vercel Blob)

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS 4 + shadcn/ui
- Clerk auth (optional)
- MongoDB Atlas + Prisma
- Recharts for progress graphs

## Dev setup

1. Copy `.env.local` with `DATABASE_URL` and optional Clerk keys
2. `npm run db:push && npm run db:seed`
3. `npm run dev`
4. Set `DEMO_ROLE=TRAINEE` in `.env.local` to test trainee flows without Clerk

## Key routes

| Route | Role | Purpose |
|-------|------|---------|
| `/dashboard` | Coach | Overview |
| `/dashboard/trainees` | Coach | Trainee list |
| `/dashboard/workouts` | Coach | Program list |
| `/dashboard/workouts/new` | Coach | Create program |
| `/dashboard/my-program` | Trainee | View active program |
| `/dashboard/workouts/log` | Trainee | Log workout |
| `/dashboard/progress` | Trainee | Progress charts |
| `/dashboard/photos` | Trainee | Upload progress photos |
| `/dashboard/onboarding/*` | Trainee | Questionnaire + agreement |
