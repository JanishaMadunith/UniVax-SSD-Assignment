# Vaccination Tracker - Full-Stack Application

## SSD Assignment

This Repository is used for SE4030 – Secure Software Development Assignment in order to find and fix vulnerabilities of the original code.


## Overview

Original Repository - https://github.com/JanishaMadunith/UniVax

This project is a full-stack web application initially developed for the SE3040 - Application Frameworks module at SLIIT. It is a healthcare system designed to track vaccination schedules and updates for all age groups. Users can manage profiles, view vaccine catalogs, schedule appointments, log immunization records, and submit feedback/tickets for issues like side effects or complaints.

The backend is built with Express.js (Node.js) and MongoDB, structured into modular components (User Management, Vaccine Catalog & Scheduling, Appointment Management, Immunization Log & Records, Feedback/Ticketing System). It includes RESTful APIs with CRUD operations, third-party API integrations (e.g., CDC for vaccine info, Twilio for notifications), protected routes (JWT/role-based), validation, error handling, and clean architecture.

The frontend is built with React (using hooks/Context API for state management), consuming the backend APIs. UI/UX uses Tailwind CSS for responsive design, with session management via localStorage/JWT.


Group Members:
- IT23401662 -Samarathunga J.M
- IT23174658 -Gunaweera T.C
- IT23279698 -J.D Jayatilake 
- IT23267336 -G.W.D.D.N Kumarasinghe 


## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Git

### Step-by-Step Guide
1. **Install Dependencies**:
   - Backend: `cd backend && npm install`

2. **Run Locally**:
   - Start MongoDB (if local: `mongod`).
   - Backend: `cd backend && npm start` (runs on http://localhost:5001).


## Initial Contributors
- Group project for SE3040 - 2026.
- SE 69 Y03.S02.

## SSD Assignment Contributors
- Group project for SE4030 - 2026.
