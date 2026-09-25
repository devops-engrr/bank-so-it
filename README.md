# Bank SO IT — Website & Learning Platform

## 1. Project Overview

**Bank SO IT** is the official companion website for the **Bank SO IT YouTube channel**.

Website: **https://banksoit.com/**
YouTube: **https://www.youtube.com/@BankSoIt**
GitHub repository: **https://github.com/devops-engrr/bank-so-it**

The project started as a lightweight static GitHub Pages website and is being evolved into a production-style exam-preparation platform.

The core goal is:

> **Learn. Practice. Improve.**

The platform is intended for students preparing for:

- IBPS SO IT
- SBI SO
- RRB SO
- Other Bank SO / Specialist Officer IT examinations
- Common banking exams such as IBPS PO, SBI PO, RRB PO and Clerk-level exams where relevant

The website combines:
- YouTube learning content
- Daily practice
- Quizzes
- Study resources
- Recruitment/job updates
- Announcements
- Student accounts
- A student dashboard
- Future progress tracking and personalized learning features

---

# 2. Current Product Vision

The website is not intended to become a video-hosting platform.

YouTube remains the video-hosting and publishing platform.

GitHub Pages serves the web application frontend.

Supabase provides authentication and the database/backend capabilities needed for student accounts and future personalized features.

The intended high-level architecture is:

```text
                         ┌──────────────────────┐
                         │      Students        │
                         │ Phone / Tablet / PC  │
                         │ Laptop / Large Screen │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    banksoit.com      │
                         │   Custom Domain      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │        GitHub Pages          │
                    │       Static Frontend        │
                    │                               │
                    │ HTML + CSS + JavaScript      │
                    └──────────────┬────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
      ┌──────────────┐    ┌────────────────┐   ┌────────────────┐
      │   YouTube    │    │    Supabase    │   │ Google Drive   │
      │ Video Content│    │ Auth + DB      │   │ Cheat Sheets   │
      └──────────────┘    └────────────────┘   └────────────────┘
              ▲                    ▲
              │                    │
              │                    │
      ┌───────┴────────┐     ┌─────┴──────────┐
      │ GitHub Actions │     │ Student Account │
      │ YouTube Sync   │     │ / Dashboard    │
      └────────────────┘     └────────────────┘
```

---

# 3. Technology Stack

## Frontend

The website is intentionally lightweight.

- HTML5
- CSS3
- Vanilla JavaScript
- Responsive CSS
- Browser localStorage for UI preferences such as theme
- No frontend framework currently required

There is currently no React, Next.js, Angular or Vue dependency.

This keeps deployment simple and makes GitHub Pages suitable.

---

## Hosting

### GitHub Pages

GitHub Pages hosts the static frontend.

Repository:

```text
devops-engrr/bank-so-it
```

The production website uses:

```text
https://banksoit.com/
```

GitHub Pages serves:

- HTML
- CSS
- JavaScript
- images
- JSON
- other static assets

The website does **not** upload or store YouTube videos in the GitHub repository.

---

# 4. Custom Domain

Production domain:

```text
https://banksoit.com/
```

Canonical homepage:

```text
https://banksoit.com/
```

Internal homepage navigation should use:

```text
/
```

rather than:

```text
/index.html
```

This keeps the public URL clean.

The `index.html` file must remain in the repository because it is the GitHub Pages entry point.

---

# 5. Site Sections

Current/planned navigation:

```text
Home
Videos
Daily Quiz
Job Updates
Resources
Announcements
About
Login / Sign Up
YouTube
```

## Home

Purpose:
- Introduce Bank SO IT
- Explain the platform
- Direct students to videos, quizzes and resources
- Provide account signup CTA
- Highlight exam coverage

Main CTA:

```text
Create your free account →
```

---

## Videos

Purpose:
- Display the latest Bank SO IT YouTube videos
- Allow students to watch videos directly on YouTube

The website does not host the video files.

Video metadata is synchronized into:

```text
data/videos.json
```

---

## Daily Quiz

Purpose:
- Provide topic-wise practice
- Eventually support interactive quizzes
- Track student attempts in the future

Future possibilities:
- Topic selection
- Difficulty
- Timed quizzes
- PYQs
- Scores
- Explanations
- Progress tracking

---

## Job Updates

This section has been added to the navigation.

Current state:

```text
Job Updates
    ↓
Coming Soon / Placeholder
```

It is intentionally not populated with fabricated recruitment information.

Future purpose:

- Bank SO recruitment
- IT Officer vacancies
- Specialist Officer notifications
- RRB SO updates
- SBI SO updates
- Application dates
- Eligibility
- Selection process
- Official notification links
- Official application links
- Open / Upcoming / Closed status

Important future rule:

**Recruitment information should preferably link to official notification/application sources.**

---

## Resources

Contains preparation resources such as:
- Cheat sheets
- Notes
- Revision material
- Study resources

Current Cheat Sheet Drive:

```text
https://drive.google.com/drive/folders/1mglPEsevsobkY-y0oCxEwVBqJweAtWQ6
```

---

## Announcements

Used for Bank SO IT platform/channel updates.

Examples:
- New video
- New quiz
- New study resource
- Mock test announcement
- Website feature
- Preparation update

This is intentionally different from **Job Updates**.

```text
Job Updates  = recruitment information

Announcements = Bank SO IT platform/channel information
```

---

## About

Explains:
- What Bank SO IT is
- Subjects covered
- Exam coverage
- Independent educational-platform disclaimer

The platform is independently operated and is not affiliated with IBPS, SBI, RRB or a government organization.

---

# 6. YouTube Integration

## Goal

Automatically synchronize new YouTube uploads to the website.

Architecture:

```text
YouTube @BankSoIt
       │
       ▼
YouTube Data API v3
       │
       ▼
GitHub Actions
       │
       ▼
data/videos.json
       │
       ▼
videos.html
       │
       ▼
Student
```

---

## YouTube Data API

Google Cloud project:

```text
Bank SO IT Website
```

API:

```text
YouTube Data API v3
```

The API key is stored as a GitHub Actions repository secret:

```text
YOUTUBE_API_KEY
```

It should never be hard-coded into frontend JavaScript.

---

# 7. YouTube Sync Workflow

Workflow:

```text
.github/workflows/youtube-sync.yaml
```

The workflow:

1. Starts on a schedule.
2. Can also be manually triggered.
3. Finds the Bank SO IT YouTube channel using the channel handle.
4. Finds the channel's uploads playlist.
5. Reads recent uploads.
6. Creates/updates `data/videos.json`.
7. Commits the file if content changed.
8. GitHub Pages then serves the updated data.

Current intended schedule:

```text
Hourly
```

The workflow uses GitHub Actions cron.

---

# 8. videos.json

The synchronized data is stored here:

```text
data/videos.json
```

The frontend reads this JSON dynamically.

Typical data includes:

```text
video ID
title
description
thumbnail
published date
YouTube URL
```

The frontend:
- Escapes HTML output
- Handles invalid data
- Handles missing videos
- Shows loading state
- Shows error state
- Uses cache-busting
- Provides YouTube links

---

# 9. Authentication Architecture

The platform uses:

**Supabase Authentication + PostgreSQL**

Current authentication method:

```text
Email + Password
```

Phone/SMS authentication is not currently enabled.

This avoids requiring an SMS provider such as Twilio.

---

## Authentication Flow

```text
Student
   │
   ▼
auth.html
   │
   ├── Login
   │
   └── Create Account
          │
          ▼
       Supabase Auth
          │
          ▼
     Email Verification
          │
          ▼
       Student Login
          │
          ▼
     dashboard.html
```

---

# 10. Signup Fields

Current signup experience includes:

Required:

- Full Name
- Email
- Password
- Confirm Password
- Terms acceptance

Optional:

- Exam preference

Validation includes:
- Required-field validation
- Name validation
- Email validation
- Password length
- Uppercase requirement
- Lowercase requirement
- Digit requirement
- Symbol requirement
- Confirm-password matching
- Terms acceptance

---

# 11. Email Verification

Email confirmation is enabled in Supabase.

After signup, the student is told:

- A verification email has been sent
- The email is from Supabase
- The student should check the inbox
- Spam/junk should be checked if necessary
- The verification link must be clicked before login

Future improvement:

```text
Resend verification email
```

with a cooldown to avoid repeated requests.

---

# 12. Supabase Project

Supabase project:

```text
Bank SO IT
```

Region:

```text
Asia-Pacific / Northeast Asia (Tokyo)
```

Project URL:

```text
https://pgxdebucjxlnhnbrxfxc.supabase.co
```

Only the **publishable client key** belongs in frontend configuration.

Never expose:

```text
Supabase secret key
service_role key
database password
```

---

# 13. Supabase Frontend Configuration

File:

```text
js/supabase.js
```

It creates the Supabase client using:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

The configuration enables:

```text
autoRefreshToken
persistSession
detectSessionInUrl
```

The publishable key is intended for browser use.

The secret key must never be placed in:
- HTML
- JavaScript
- CSS
- GitHub repository
- GitHub Pages
- public configuration

---

# 14. Database Architecture

Current application profile table:

```text
public.profiles
```

Relationship:

```text
auth.users
     │
     │ id
     ▼
public.profiles
```

The authentication email remains authoritative in:

```text
auth.users
```

The profile table contains application-specific profile information.

Current profile fields:

```text
id
full_name
exam_preference
avatar_url
created_at
updated_at
```

---

# 15. Profile Creation

A database trigger automatically creates a profile after a new Supabase Auth user is created.

Flow:

```text
Signup
  ↓
auth.users INSERT
  ↓
Database Trigger
  ↓
public.profiles INSERT
```

The user's metadata can provide:

```text
full_name
exam_preference
```

---

# 16. Row Level Security

RLS is enabled on:

```text
public.profiles
```

The intended access model is:

```text
Authenticated student
        │
        ▼
Can read own profile

Authenticated student
        │
        ▼
Can update own profile

Student A
        X
Cannot read Student B's profile
```

The policy uses the authenticated user's ID:

```text
auth.uid() = id
```

This is an important security boundary.

---

# 17. Student Dashboard

File:

```text
dashboard.html
```

Purpose:

The dashboard is the authenticated student's private area.

Current/initial dashboard concepts include:

- Student name
- Student email
- Exam preference
- Quiz attempts placeholder
- Topics placeholder
- Streak placeholder
- Exam target placeholder
- Logout

Future dashboard architecture:

```text
Student
   │
   ▼
Dashboard
   │
   ├── Profile
   ├── Quiz Progress
   ├── Scores
   ├── Streak
   ├── Bookmarks
   ├── Saved Resources
   ├── Job Alerts
   └── Exam Preparation Progress
```

---

# 18. Authentication Navigation

The public header is session-aware.

When logged out:

```text
Login / Sign Up
```

When logged in:

```text
Dashboard
```

The authentication navigation is handled client-side using the Supabase session.

The homepage signup CTA uses:

```text
auth.html?mode=signup
```

so it can open directly on the Create Account tab.

---

# 19. Theme Architecture

The website supports:

```text
Light Mode
Dark Mode
```

Theme behavior:

1. First visit can respect the user's system preference.
2. User can manually select a theme.
3. Preference is saved in browser `localStorage`.
4. The preference is reused across pages.
5. The theme applies to the shared website components.
6. Authentication and dashboard styling are also theme-aware.

The main design uses CSS variables such as:

```text
--bg
--surface
--ink
--muted
--line
--primary
--primary-dark
--dark
--soft
```

This makes theme changes centralized instead of requiring individual colors to be rewritten throughout every page.

---

# 20. Responsive Design

The website is designed as a responsive web platform.

Target devices:

```text
Mobile phones
Tablets
Laptops
Desktop PCs
Large monitors
TV browser / large-screen environments
```

The frontend uses responsive CSS breakpoints.

The main content is constrained rather than stretched indefinitely.

Example concept:

```text
Small screen
    ↓
1-column layout

Tablet
    ↓
2-column layout

Desktop
    ↓
multi-column layout
```

Responsive behavior includes:
- Mobile navigation
- Responsive cards
- Responsive video grid
- Responsive hero
- Responsive footer
- Responsive forms
- Responsive dashboard

The website should still receive device-specific QA before any release is considered final.

---

# 21. Website Design System

Brand direction:

```text
Primary:
Indigo / Blue

Dark:
Navy

Style:
Clean
Professional
Education-focused
Modern
Minimal
```

Existing visual system includes:
- Rounded cards
- Soft shadows
- Indigo accent color
- Dark hero sections
- Responsive grids
- Pill labels
- CTA buttons
- Consistent spacing
- Bank SO IT logo

Logo:

```text
assets/logo/bank-so-it-logo.jpg
```

---

# 22. Main Project Structure

Current high-level repository structure:

```text
bank-so-it/
│
├── assets/
│   └── logo/
│       └── bank-so-it-logo.jpg
│
├── css/
│   ├── style.css
│   └── auth.css
│
├── js/
│   ├── main.js
│   ├── supabase.js
│   ├── auth.js
│   └── dashboard.js
│
├── data/
│   └── videos.json
│
├── .github/
│   └── workflows/
│       └── youtube-sync.yaml
│
├── index.html
├── videos.html
├── quizzes.html
├── job-updates.html
├── resources.html
├── announcements.html
├── about.html
├── auth.html
├── dashboard.html
├── 404.html
└── README.md
```

---

# 23. JavaScript Responsibilities

## main.js

Shared site behavior.

Responsibilities include:
- Mobile navigation
- Theme behavior
- Authentication-aware navigation
- Canonical homepage navigation handling
- Dynamic YouTube video rendering
- Loading/error handling for video data

---

## supabase.js

Supabase client initialization.

Responsibilities:
- Supabase URL
- Publishable key
- Supabase browser client

This file must never contain secret credentials.

---

## auth.js

Authentication page logic.

Responsibilities:
- Login
- Signup
- Validation
- Password validation
- Password visibility
- Email verification messaging
- Password reset
- Signup mode
- Loading/error states
- Session redirect

---

## dashboard.js

Student dashboard logic.

Responsibilities:
- Check authenticated session
- Redirect unauthenticated users
- Read profile
- Display user information
- Logout

---

# 24. GitHub Actions

Current automation:

```text
.github/workflows/youtube-sync.yaml
```

Purpose:

```text
Automate YouTube → website synchronization
```

GitHub Actions is currently the automation layer.

Future automation possibilities:
- Job update synchronization
- Content publishing
- Data validation
- Website tests
- Link checking
- Scheduled maintenance
- Build/QA checks

---

# 25. Secrets & Security

## Safe to expose

The following are expected to be public/client-side where required:

```text
Supabase project URL
Supabase publishable key
```

## Never expose

```text
Supabase secret key
Supabase service_role key
Database password
YouTube API secret credentials
GitHub personal access token
OAuth client secrets
Twilio auth token
Other server-side credentials
```

---

# 26. GitHub Repository Security

The repository is currently public.

Therefore:

**Anything committed to the repository should be treated as public.**

A custom domain does not make a public GitHub repository private.

Visitors to `banksoit.com` do not automatically receive GitHub write access, but people can independently discover a public repository.

Therefore:

> Never commit secrets.

---

# 27. YouTube API Secret Handling

The YouTube API key is stored in GitHub Actions:

```text
Repository
→ Settings
→ Secrets and variables
→ Actions
→ YOUTUBE_API_KEY
```

The key is used by the GitHub Actions workflow rather than frontend code.

API restrictions should remain configured for:

```text
YouTube Data API v3
```

---

# 28. Content Architecture

The platform separates content types.

```text
YouTube
    ↓
Video learning content

Daily Quiz
    ↓
Interactive practice

Resources
    ↓
Study material

Job Updates
    ↓
Recruitment information

Announcements
    ↓
Bank SO IT platform updates

Dashboard
    ↓
Personal student information
```

This separation should be maintained as the project grows.

---

# 29. Future Learning Architecture

A future version can evolve toward:

```text
                    Student Account
                          │
                          ▼
                     Dashboard
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
     Quizzes           Resources         Job Alerts
        │
        ▼
      Attempts
        │
        ▼
       Scores
        │
        ▼
      Progress
        │
        ▼
    Recommendations
```

Potential future database tables:

```text
profiles
quiz_attempts
quiz_answers
quiz_questions
bookmarks
resources
job_updates
notifications
student_progress
study_streaks
```

These are future concepts, not necessarily implemented yet.

---

# 30. Future Job Updates Architecture

Potential future model:

```text
Official recruitment sources
          │
          ▼
     Job Update Data
          │
          ▼
      Database
          │
          ▼
     job-updates.html
          │
          ▼
       Students
```

Each job could eventually contain:

```text
organization
post
category
application_start
application_end
eligibility
selection_process
official_notification_url
official_application_url
status
published_at
```

---

# 31. Future Notification Architecture

Future student notification model:

```text
New Job
   │
   ▼
Database
   │
   ▼
Student preferences
   │
   ▼
Relevant notification
   │
   ▼
Dashboard
```

Possible preferences:

```text
IBPS SO IT
SBI SO
RRB SO
Bank SO
IT Officer
Other Specialist Officer
```

---

# 32. Future Quiz Architecture

Potential quiz flow:

```text
Student
  ↓
Select subject
  ↓
Select topic
  ↓
Start quiz
  ↓
Questions
  ↓
Submit
  ↓
Score
  ↓
Explanation
  ↓
Store attempt
  ↓
Dashboard progress
```

Possible subjects:

```text
IT Professional Knowledge
DBMS
Networking
Operating Systems
Data Structures
OOP
Cybersecurity
Cloud
Software Engineering
English
Quant
Reasoning
Banking Awareness
```

---

# 33. Future Analytics

The platform may eventually provide students with:

```text
Total quizzes
Average score
Strong topics
Weak topics
Recent activity
Study streak
Topic completion
Revision status
```

Analytics should be based on actual student activity rather than assumptions.

---

# 34. Future Admin Architecture

A future admin system could provide:

```text
Admin
  │
  ▼
Admin Dashboard
  │
  ├── Students
  ├── Quiz Questions
  ├── Quiz Results
  ├── Job Updates
  ├── Announcements
  ├── Resources
  └── Notifications
```

Admin functionality should be protected separately from normal student accounts.

Do not implement admin authorization solely by hiding frontend buttons.

Admin permissions should eventually be enforced server-side/database-side.

---

# 35. Development Workflow

Recommended workflow:

```text
Local change
    ↓
Test locally
    ↓
GitHub Desktop
    ↓
Commit
    ↓
Push to main
    ↓
GitHub Pages deployment
    ↓
Production verification
```

For automated content:

```text
GitHub Actions
    ↓
Update data
    ↓
Commit
    ↓
GitHub Pages
```

---

# 36. Production Change Guidelines

When modifying the site:

1. Preserve existing functionality.
2. Do not overwrite authentication configuration accidentally.
3. Never replace `js/supabase.js` with a placeholder if the production key is already configured.
4. Never commit secrets.
5. Test mobile layout.
6. Test desktop layout.
7. Test login.
8. Test signup.
9. Test email verification.
10. Test logout.
11. Test YouTube video loading.
12. Test navigation.
13. Test light/dark mode.
14. Test the custom domain.
15. Check browser console for JavaScript errors.

---

# 37. Important File Ownership

### Safe to modify frequently

```text
index.html
videos.html
quizzes.html
job-updates.html
resources.html
announcements.html
about.html
404.html
css/style.css
css/auth.css
js/main.js
js/auth.js
js/dashboard.js
```

### Modify carefully

```text
js/supabase.js
```

It contains the frontend Supabase configuration.

### Automated/generated

```text
data/videos.json
```

This is updated by GitHub Actions.

Do not manually edit it unless there is a specific reason.

---

# 38. Current External Services

## GitHub

Used for:
- Source code
- Version control
- GitHub Pages
- GitHub Actions
- YouTube API secret storage

---

## YouTube

Used for:
- Video hosting
- Channel publishing
- Video metadata

Channel:

```text
@BankSoIt
```

---

## Supabase

Used for:
- Authentication
- Email verification
- PostgreSQL
- Student profiles
- Future student data

---

## Google Drive

Used for:
- Cheat sheets
- Study resources

---

# 39. Current Platform Status

### Implemented

```text
✓ Static responsive website
✓ GitHub Pages deployment
✓ Custom domain
✓ Bank SO IT branding
✓ Home page
✓ Videos page
✓ Dynamic YouTube synchronization
✓ YouTube Data API
✓ GitHub Actions automation
✓ Daily Quiz section
✓ Resources section
✓ Announcements section
✓ About section
✓ Job Updates section structure
✓ 404 page
✓ Supabase project
✓ Email/password authentication
✓ Email verification
✓ Password reset
✓ Student profile table
✓ RLS
✓ Student dashboard
✓ Login / Sign Up navigation
✓ Session-aware Dashboard navigation
✓ Signup CTA
✓ Light/Dark theme system
✓ Responsive navigation
```

### Partially implemented / placeholders

```text
~ Interactive quiz engine
~ Quiz score storage
~ Student progress
~ Streak tracking
~ Bookmarks
~ Job update database
~ Job alerts
~ Admin dashboard
~ Personalized recommendations
~ Student notifications
```

---

# 40. What NOT to Build Yet

Avoid prematurely adding:

- Complex frontend frameworks
- Video hosting infrastructure
- SMS authentication
- Unnecessary paid infrastructure
- Large backend services
- Complex notification systems
- Duplicate data between systems
- Features without a clear student use case

The current architecture is intentionally simple.

---

# 41. Recommended Evolution

A sensible evolution path is:

## Phase 1 — Foundation

```text
Website
YouTube
Resources
Responsive UI
Authentication
Theme
```

## Phase 2 — Student Learning

```text
Quiz engine
Question bank
Scores
Progress
Bookmarks
Streak
```

## Phase 3 — Recruitment

```text
Job database
Job updates
Official links
Filters
Student alerts
```

## Phase 4 — Personalization

```text
Dashboard analytics
Weak-topic detection
Study recommendations
Personalized revision
```

## Phase 5 — Admin Platform

```text
Admin dashboard
Content management
Question management
Job management
Announcements
Analytics
```

---

# 42. Design Principle

The most important project principle is:

> **Keep the frontend simple, keep sensitive logic protected, automate repetitive content synchronization, and gradually move student-specific functionality into Supabase.**

The project should remain understandable to a developer who joins later.

Every new feature should answer:

1. What student problem does this solve?
2. Where does the data live?
3. Is the data public or private?
4. Does it require authentication?
5. Does RLS need to change?
6. Does it require automation?
7. Does it affect mobile?
8. Does it affect light/dark mode?
9. Does it introduce a secret?
10. Can it be tested independently?

---

# 43. Quick Reference

```text
Production website
https://banksoit.com/

YouTube
https://www.youtube.com/@BankSoIt

GitHub
https://github.com/devops-engrr/bank-so-it

Cheat Sheets
https://drive.google.com/drive/folders/1mglPEsevsobkY-y0oCxEwVBqJweAtWQ6

Supabase
Bank SO IT project

Frontend
HTML + CSS + Vanilla JS

Hosting
GitHub Pages

Automation
GitHub Actions

Video API
YouTube Data API v3

Authentication
Supabase Auth

Database
Supabase PostgreSQL

Theme
Light + Dark

Video data
data/videos.json

Main workflow
.github/workflows/youtube-sync.yaml
```

---

# 44. Developer Handoff Summary

If another developer opens this repository for the first time, they should understand the project as:

```text
BANK SO IT
│
├── Public education website
│
├── YouTube-powered video platform
│
├── Supabase-powered student accounts
│
├── GitHub Actions automation
│
├── Google Drive resources
│
├── Job Updates foundation
│
└── Future personalized learning platform
```

The project should continue to favor:
- simplicity
- security
- responsive design
- reusable components
- automation
- clear separation of public/private data
- incremental development

This README is intended to be the long-term technical reference for future Bank SO IT development conversations.
