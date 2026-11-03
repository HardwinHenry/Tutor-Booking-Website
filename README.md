Dự án được tổ chức theo mô hình tách biệt Frontend và Backend:
Tutor-Booking-Website
├── client/                         # React + Vite
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── features/
│       ├── services/
│       ├── hooks/
│       ├── contexts/
│       ├── routes/
│       ├── utils/
│       ├── App.jsx
│       └── main.jsx
│
├── server/                         # Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── integrations/
│   │   │   └── google-calendar/
│   │   ├── constants/
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
│
├── docs/                           # Tài liệu dự án
│   ├── ROADMAP_FRONTEND_NEN_TANG_GIA_SU.md
│   ├── ROADMAP_BACKEND_NEN_TANG_GIA_SU.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DOCUMENTATION.md
│   └── BUSINESS_RULES.md
│
├── .gitignore
└── README.md
