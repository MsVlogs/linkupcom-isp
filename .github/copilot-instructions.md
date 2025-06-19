# Copilot Instructions for Linkup Communications Billing System

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a billing management system for Linkup Communications, an ISP in Bangladesh. The system is designed for staff to collect monthly payments during house visits and update payment information via a web application.

## Technology Stack
- **Framework**: Next.js 14 with App Router and TypeScript
- **Database**: MongoDB Atlas with Mongoose
- **Authentication**: NextAuth.js with role-based access (Admin/Staff)
- **Styling**: Tailwind CSS with minimalist design
- **Validation**: Zod for form validation
- **Data Fetching**: React Query (@tanstack/react-query)
- **Charts**: Chart.js with react-chartjs-2
- **Notifications**: react-hot-toast

## Design Guidelines
- Use minimalist UI with neutral colors: #FFFFFF, #1F2A44, #E5E7EB, #2DD4BF (teal accent)
- Inter font for typography
- Flat design without shadows
- Mobile-first responsive design
- Clean data tables and forms with loading states

## Key Features
1. Staff Dashboard with metrics and quick payment form
2. Customer Database with CRUD operations
3. Payment Status Tracking (Paid, Pending, Overdue)
4. Admin Panel for staff management
5. Staff Activity Logging
6. Payment History with sortable tables
7. Basic Analytics and CSV export
8. Profile/Settings management

## Code Standards
- Use TypeScript for type safety
- Implement proper error handling
- Follow Next.js App Router conventions
- Use server actions for mutations
- Implement proper authentication middleware
- Log all staff actions for audit trails

## Database Schema
- Users (staff/admin with roles)
- Customers (ISP customer details)
- Payments (billing records with status)
- Logs (staff activity tracking)
