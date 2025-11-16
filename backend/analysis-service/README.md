# Analysis & Reporting Service - Personal Message to Beletu 🚀

Hey Beletu! Your Analysis & Reporting System is now complete! 😊

This service focuses on developing reporting and data analysis features for the WubLand Portfolio platform.

## ✅ What's Implemented

### **Features Completed:**
- ✅ **Sales Reports** - Comprehensive sales data including revenue, transactions, and trends
- ✅ **Rental Reports** - Rental statistics and property analysis
- ✅ **User Activity Reports** - User behavior and activity patterns analysis
- ✅ **Dashboard Analytics** - Comprehensive insights with:
  - Top locations analysis
  - Market trends (price trends, demand analysis)
  - Broker performance metrics
  - Property type distribution
- ✅ **PDF Export** - Generate PDF reports for all report types
- ✅ **Report Storage** - Save and retrieve generated reports from database

## 📁 Project Structure

```
analysis-service/
├── models/
│   └── Report.js              # Report model for database operations
├── controllers/
│   └── reportController.js    # All report generation logic
├── routes/
│   └── analysisRoutes.js      # API endpoints
├── middleware/
│   └── auth.js                # Authentication & authorization
├── utils/
│   └── pdfGenerator.js        # PDF generation utility
├── server.js                  # Express server setup
├── package.json
└── README.md
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd backend/analysis-service
npm install
```

### 2. Configure Environment
Create a `.env` file (copy from `.env.example`):
```env
PORT=3004
NODE_ENV=development
JWT_SECRET=your-secret-key-here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=wubland_portfolio_db
```

**Important:** Make sure `JWT_SECRET` matches the secret used in other services (especially user-service).

### 3. Database Setup
The service uses the shared database connection from `../shared/db.js`. Ensure:
- MySQL database `wubland_portfolio_db` is set up
- Tables `users`, `properties`, `transactions`, and `reports` exist
- Run `setup_database.sql` if needed

### 4. Start the Service
```bash
npm start
```

The service will run on `http://localhost:3004`

## 📊 API Endpoints

### **Authentication Required**
All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### **1. Dashboard Analytics**
Get comprehensive dashboard with insights, trends, and statistics.

**Endpoint:** `GET /api/analysis/dashboard`

**Access:** Admin or Broker

**Query Parameters:**
- `startDate` (optional) - Filter start date (YYYY-MM-DD)
- `endDate` (optional) - Filter end date (YYYY-MM-DD)

**Example Request:**
```bash
curl -X GET "http://localhost:3004/api/analysis/dashboard?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "reportId": 1,
  "data": {
    "title": "Dashboard Analytics",
    "overview": {
      "totalUsers": 150,
      "totalProperties": 300,
      "totalTransactions": 450,
      "totalRevenue": 5000000
    },
    "topLocations": [...],
    "marketTrends": {
      "priceTrend": "increasing",
      "demandTrend": "stable",
      "priceHistory": [...],
      "demandHistory": [...]
    },
    "brokerPerformance": [...]
  }
}
```

### **2. Sales Report**
Generate sales report with revenue, transactions, and trends.

**Endpoint:** `GET /api/analysis/reports/sales`

**Access:** Admin or Broker

**Query Parameters:**
- `startDate` (optional) - Filter start date
- `endDate` (optional) - Filter end date
- `format` (optional) - `json` (default) or `pdf`

**Example Request:**
```bash
curl -X GET "http://localhost:3004/api/analysis/reports/sales?format=pdf" \
  -H "Authorization: Bearer <token>"
```

### **3. Rental Report**
Generate rental statistics and analysis.

**Endpoint:** `GET /api/analysis/reports/rental`

**Access:** Admin or Broker

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)
- `format` (optional) - `json` or `pdf`

### **4. User Activity Report**
Analyze user behavior and activity patterns.

**Endpoint:** `GET /api/analysis/reports/user-activity`

**Access:** Admin only

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)
- `format` (optional) - `json` or `pdf`

### **5. Get All Reports**
Retrieve all saved reports.

**Endpoint:** `GET /api/analysis/reports`

**Access:** Admin or Broker

**Query Parameters:**
- `type` (optional) - Filter by report type
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

### **6. Get Report by ID**
Retrieve a specific saved report.

**Endpoint:** `GET /api/analysis/reports/:id`

**Access:** Admin or Broker

**Query Parameters:**
- `format` (optional) - `json` or `pdf`

### **7. Delete Report**
Delete a saved report (Admin only).

**Endpoint:** `DELETE /api/analysis/reports/:id`

**Access:** Admin only

### **8. Health Check**
Check service status.

**Endpoint:** `GET /health`

**No authentication required**

## 🎯 Features Breakdown

### **Sales Reports Include:**
- Total sales properties count
- Completed transactions
- Total revenue
- Average sale price
- Monthly breakdown
- Top locations by sales
- Sales status breakdown

### **Rental Reports Include:**
- Total rental properties
- Completed rentals
- Total rental revenue
- Average rent
- Monthly rental trends
- Top rental locations
- Property status breakdown

### **User Activity Reports Include:**
- Total users statistics
- User registration trends
- Active users count
- Users by role breakdown
- Top active users
- Recent activity timeline
- Transaction activity per user

### **Dashboard Analytics Include:**
- **Overview Statistics:** Users, properties, transactions, revenue
- **Top Locations:** Most popular property locations with counts
- **Market Trends:**
  - Price trends (increasing/decreasing/stable)
  - Demand trends
  - Price history over time
  - Demand history
  - Top property types
- **Broker Performance:** Top brokers with success rates

## 🔐 Access Control

- **Dashboard & Basic Reports:** Admin or Broker
- **User Activity Reports:** Admin only
- **Delete Reports:** Admin only

## 📄 PDF Export

All reports can be exported as PDF by adding `?format=pdf` to the endpoint URL.

Example:
```bash
GET /api/analysis/reports/sales?format=pdf
```

The PDF will include:
- Report title and generation date
- Summary statistics
- Charts and breakdowns
- Top locations and trends

## 🧪 Testing

Test the service using tools like:
- **Postman** - API testing
- **cURL** - Command line testing
- **Frontend Integration** - Connect with React frontend

**Example Test:**
```bash
# 1. Get JWT token from user-service (login)
# 2. Use token to access analysis endpoints
curl -X GET "http://localhost:3004/api/analysis/dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📚 Why MVC and Microservices?

**MVC Pattern:**
- **Models** (`Report.js`) - Database queries and data operations
- **Views** (PDF Generator) - Report formatting and presentation
- **Controllers** (`reportController.js`) - Business logic and analysis

**Microservices Architecture:**
- Independent scaling for reporting workloads
- Isolated from other services
- Can be deployed separately
- Easy to update without affecting other services

## 📅 Project Timeline

| Phase | Deadline | Focus Area |
|-------|----------|------------|
| Phase 1 | September 19, 2025 | Models & Controllers ✅ |
| Phase 2 | October 3, 2025 | Routes & Integration ✅ |
| Phase 3 | October 17, 2025 | Advanced Features ✅ |
| Final Presentation | November 21, 2025 | Evaluation Day |

## 🐛 Troubleshooting

### Database Connection Issues
- Check `.env` file has correct DB credentials
- Ensure MySQL is running
- Verify database `wubland_portfolio_db` exists

### Authentication Errors
- Verify JWT token is valid
- Check `JWT_SECRET` matches other services
- Ensure token hasn't expired

### Missing Data in Reports
- Ensure other services have data (users, properties, transactions)
- Check date filters aren't excluding all data

## 📖 Learning Resources

| Topic | Resource | Type | Duration |
|-------|----------|------|----------|
| MVC Pattern | [freeCodeCamp Article](https://www.freecodecamp.org/news/model-view-controller-mvc-explained/) | 📖 Article | 10 min read |
| MVC Visual Guide | [YouTube Explanation](https://www.youtube.com/watch?v=DUgqjRIRlFU) | 📹 Video | 10 min |
| Microservices | [Microservices.io](https://microservices.io/) | 📖 Article | 15 min read |
| Microservices Intro | [YouTube Overview](https://www.youtube.com/watch?v=CnailTcJV_U) | 📹 Video | 8 min |
