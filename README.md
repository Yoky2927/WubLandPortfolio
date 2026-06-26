> ⚠️ **Note:** The underlying codebase components are currently undergoing active development and security auditing.
# 🏠 WubLand – Online House Renting & Selling System

WubLand is a collaborative, full-stack microservices-based web application designed to streamline property listings, renting workflows, and transaction management. Built with modern web technologies, the platform splits core functionalities into specialized backend subsystems to ensure scalability, security, and clean code separation.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React.js, Tailwind CSS, Figma (UI/UX Design)
- **Backend:** Node.js, Express.js
- **Database:** MySQL (Structured database relationships & data validation)
- **Version Control:** Git & GitHub (Strict feature-branching workflow)
- **System Architecture:** Microservices / Decoupled Subsystems

---

## 🏗️ System Components & Subsystems

The backend architecture is divided into specialized services to handle distinct business logic independently:

- **Property Management Service (`backend/property-management/`)**  
  Handles property creation, real estate filtering, metadata entry, and structural listing details.
- **Transaction Management Service (`backend/transaction-management/`)**  
  Manages secure renting and selling workflows, tenant-owner user management, and core data validation.
- **Analysis & Reporting Service (`backend/analysis-service/`)**  
  Processes platform data metrics to track property trends, user interactions, and system activity logs.

---

## 💻 My Role & Contributions

As a core developer on this collaborative project, my responsibilities spanned both infrastructure setup and feature implementation:
- **Full-Stack Implementation:** Contributed to building decoupled components using **React.js** for a responsive user interface and **Node.js/Express.js** to handle backend workflows.
- **Database Architecture:** Structured **MySQL** schemas, defined complex database relationships, and wrote secure SQL queries ensuring strict server-side data validation.
- **Git Workflow & Integration:** Collaborated closely within a 5-peer development team using Git Bash. Spearheaded the repository organization, established branching/merging rules, and implemented structured documentation policies to prevent code conflicts.
- **UI Design:** Leveraged **Figma** to wireframe layouts and design user-focused navigation flows before translating them into **Tailwind CSS** components.

---

## 🚀 Development & Workflow Rules

To maintain high code quality and smooth system performance, the project enforces strict operational procedures:
1. **Branch Protection:** Direct pushes to the `main` branch are restricted. All features are developed in isolated branches and integrated via formal Pull Requests.
2. **Modular Integrity:** Developers work exclusively within their isolated subsystems to maintain microservice independence and reduce coupling.
3. **Comprehensive Documentation:** Every microservice contains isolated operational procedures detailing specific API expectations and configuration guidelines.
