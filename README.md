# edu.Diary

A web application designed for university students to manage their daily academic life. The application features a unique hand-drawn design aesthetic and focuses on attendance tracking and schedule management.

## Tech Stack

- Frontend Framework: React (via Vite)
- Routing: React Router
- State and Persistence: LocalStorage
- Styling: Custom CSS with Hand-Drawn design system

## Features

- Student Login: Secure login page that remembers returning users.
- Onboarding: Multi-step process to set up name, branch, courses, and timetable.
- Dashboard: Overview of student information, today's schedule, and attendance statistics.
- Attendance Tracking: Record attendance for each course and view detailed logs.
- Attendance Prediction: Calculation of classes that can be skipped or are required to maintain a 75 percent attendance threshold.
- Class Schedule: Weekly timetable view for organized tracking of lectures.
- Daily Reminders: Automatic pop-up on login to record attendance for the day's classes.

## Design Philosophy

The application utilizes a Hand-Drawn design system characterized by wobbly borders, paper textures, handwritten typography (Kalam and Patrick Hand), and hard offset shadows. This creates an approachable and personalized aesthetic.

## Local Development

1. Install dependencies:
   npm install

2. Start the development server:
   npm run dev

3. Build for production:
   npm run build

## Deployment

The project includes a vercel.json configuration for deployment on Vercel, handling Single Page Application (SPA) routing to prevent 404 errors on page refresh.
