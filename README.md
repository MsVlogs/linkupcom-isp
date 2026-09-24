# Linkup Communications Billing System

A comprehensive billing management system for Linkup Communications, an ISP in Bangladesh. The system is designed for staff to collect monthly payments during house visits and update payment information via a web application.

## 🚀 Features

### Core Features
- **Staff Dashboard** with metrics and quick actions
- **Customer Database** with full CRUD operations
- **Payment Collection** with customer search and billing month tracking
- **Payment History** with filtering and search capabilities
- **Staff Management** (Admin only) for user account management
- **Reports & Analytics** with various report types
- **CSV Export** for customers, payments, and revenue data
- **Profile/Settings** management with password change
- **Activity Logging** for audit trails

### Technical Features
- **Authentication** with NextAuth.js and role-based access (Admin/Staff)
- **Database** using MongoDB Atlas with Mongoose ODM
- **Real-time Updates** with React Query for data fetching
- **Form Validation** using Zod schemas
- **Responsive Design** with mobile-first approach
- **Toast Notifications** for user feedback
- **Loading States** and error handling

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **Database**: MongoDB Atlas with Mongoose
- **Authentication**: NextAuth.js with MongoDB adapter
- **Styling**: Tailwind CSS with custom color palette
- **Validation**: Zod for form validation
- **Data Fetching**: React Query (@tanstack/react-query)
- **Notifications**: react-hot-toast
- **Charts**: Chart.js with react-chartjs-2 (ready for implementation)
- **Icons**: Heroicons and Lucide React

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js configuration
│   │   ├── customers/     # Customer CRUD operations
│   │   ├── payments/      # Payment operations
│   │   ├── staff/         # Staff management (Admin only)
│   │   ├── reports/       # Analytics and reporting
│   │   ├── logs/          # Activity logs
│   │   └── export/        # CSV export endpoints
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Protected dashboard pages
│       ├── customers/     # Customer management UI
│       ├── payments/      # Payment collection and history
│       ├── staff/         # Staff management UI
│       ├── reports/       # Reports and analytics UI
│       └── settings/      # User profile and settings
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
├── models/                # Mongoose database models
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware for authentication
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd linkupcom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Update `.env.local` with your actual values:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/linkup-billing?retryWrites=true&w=majority
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   JWT_SECRET=your-jwt-secret-here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Usage

### For Staff Members
1. **Login** with your credentials
2. **Dashboard** shows key metrics and quick actions
3. **Collect Payments** by searching for customers and recording payments
4. **View Payment History** with filtering options
5. **Manage Customers** (if permissions allow)
6. **View Reports** for insights

### For Administrators
- All staff features plus:
- **Staff Management** - Add, edit, and remove staff accounts
- **Advanced Reports** - Staff performance analytics
- **System Settings** - Configure system preferences

## 🔧 Key API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Customers
- `GET /api/customers` - List customers with pagination
- `POST /api/customers` - Create new customer
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Payments
- `GET /api/payments` - List payments with filtering
- `POST /api/payments` - Create new payment record

### Staff (Admin only)
- `GET /api/staff` - List staff members
- `POST /api/staff` - Create new staff account
- `PUT /api/staff/[id]` - Update staff account
- `DELETE /api/staff/[id]` - Delete staff account

### Reports & Export
- `GET /api/reports` - Generate various reports
- `GET /api/export/[type]` - Export data as CSV

## 🎯 Key Features

### Payment Collection
- **Customer Search**: Real-time search by name, ID, or phone
- **Auto-fill**: Automatically fills monthly fee based on customer package
- **Billing Month**: Tracks which month the payment is for
- **Notes**: Optional notes for each payment

### Customer Management
- **Full CRUD**: Create, read, update, delete customers
- **Package Management**: Different internet packages with varying fees
- **Status Tracking**: Active/inactive customer status
- **Geographic Organization**: Customers organized by area

### Reports & Analytics
- **Overview Reports**: Key business metrics
- **Revenue Analysis**: Monthly and package-wise revenue
- **Customer Status**: Distribution of active/inactive customers
- **Staff Performance**: Payment collection by staff member (Admin only)

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **Session Security**: Secure session management
- **Role-based Access**: Different permissions for admin/staff
- **Input Validation**: Zod schema validation on all forms
- **Authentication Middleware**: Protects all dashboard routes

## 📱 Mobile Responsiveness

- **Mobile-first Design**: Optimized for mobile devices
- **Responsive Tables**: Horizontal scrolling for data tables
- **Touch-friendly**: Large tap targets and proper spacing
- **Grid Layouts**: Responsive grid systems for different screen sizes

## 🚀 Deployment

### Vercel Deployment
1. **Connect to Vercel** and import your repository  
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - automatic deployment on push to main branch

### Environment Variables for Production
```bash
MONGODB_URI=your-production-mongodb-uri
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
JWT_SECRET=your-production-jwt-secret
```

## 🔮 Future Enhancements

- **Advanced Analytics**: Charts and graphs with Chart.js
- **Notification System**: Email/SMS notifications for overdue payments
- **Mobile App**: React Native app for field staff
- **Payment Gateway**: Integration with Bangladesh payment gateways
- **Multi-language**: Bengali language support
- **Offline Support**: PWA capabilities for offline access

## 🔎 BengalStack AI Engineer — Read-only Live Telemetry

The customer AI Engineer can query live network telemetry without making configuration changes.

### MikroTik RouterOS REST

Configure a read-only RouterOS API account and set:

```env
MIKROTIK_REST_URL=https://ROUTER-IP
MIKROTIK_REST_USERNAME=readonly-user
MIKROTIK_REST_PASSWORD=change-me
MIKROTIK_TLS_VERIFY=true
```

The adapter reads the RouterOS `/rest/ppp/active` endpoint and matches the customer's **PPPoE Username**. It never calls RouterOS write endpoints.

### OLT / ONU telemetry gateway

Because Huawei, ZTE, BDCOM, VSOL, HSGQ, C-DATA and other OLT vendors expose different APIs/OIDs, the app uses a read-only gateway contract rather than guessing vendor-specific commands:

```env
OLT_TELEMETRY_URL=https://your-readonly-olt-gateway
OLT_TELEMETRY_TOKEN=change-me
```

The app requests `GET /onu/status?onuId=<ONU_ID>` and expects JSON such as:

```json
{
  "online": true,
  "onuRegistered": true,
  "opticalRx": "-18.4",
  "opticalTx": "2.1",
  "lastSeen": "2026-09-25T00:00:00Z",
  "detail": "ONU registered"
}
```

The gateway must itself use read-only SNMP/SSH/API access. No provisioning, reboot, disable, delete, or configuration operation is performed by the billing app.

### Customer mapping

Each customer can now store:
- **PPPoE Username** — used for live MikroTik session lookup.
- **ONU ID / Serial** — used for live OLT/ONU lookup.

If these identifiers or telemetry credentials are missing, AI Engineer reports that live telemetry is unavailable instead of inventing a status.

## 📄 License

This project is licensed under the MIT License.

---

**Built for Linkup Communications, Bangladesh** - Designed specifically for ISP billing management with mobile-first approach for on-the-go access.
