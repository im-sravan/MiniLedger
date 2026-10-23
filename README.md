# MiniLedger — Personal Loan Tracker

MiniLedger is a full-stack application that helps users track money lent to others, manage repayments, and monitor outstanding and overdue loans through a simple dashboard.

## Features

- **OTP Authentication:** Phone-number-based login using OTP verification.
- **Loan Management:** Add loans with a person's name, amount, and due date.
- **Repayment Tracking:** Mark loans as repaid and update balances.
- **Financial Dashboard:** View total lent, total repaid, outstanding amount, and overdue loans.
- **Persistent Storage:** Store loan records in PostgreSQL.
- **User-Specific Data:** Restrict loan access to the authenticated user.

## Tech Stack

- **Frontend:** React Native, Expo, TypeScript
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL (Neon)
- **Authentication:** JWT and OTP verification
- **Validation:** Zod
- **Version Control:** Git and GitHub

## Project Structure

```text
MiniLedger/
├── backend/    # Express API, authentication and database
├── mobile/     # Expo client application
├── .gitignore
└── README.md
```

## Setup and Run

**1. Clone the repository**

```bash
git clone https://github.com/im-sravan/MiniLedger.git
cd MiniLedger
```

**2. Configure and start the backend**

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and configure `DATABASE_URL`, `JWT_SECRET`, and the other required environment variables.

Initialize the database and start the server:

```bash
npm run db:init
npm run dev
```

**3. Configure and start the client**

Open a second terminal:

```bash
cd mobile
npm install
npx expo install react-dom react-native-web
```

Configure `mobile/.env` with the backend URL:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

Start the web application:

```bash
npx expo start --web
```

## OTP Note

The current development version prints OTP codes in the backend terminal. Real SMS delivery requires integration with an SMS provider before production use.

## Future Enhancements

- Real SMS OTP integration
- Repayment reminders and notifications
- Loan history and financial reports
- Production deployment and automated testing

## Author

**Sravan Kumar**

GitHub: [im-sravan](https://github.com/im-sravan)

Repository: [MiniLedger](https://github.com/im-sravan/MiniLedger)
