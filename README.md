# SWEET MANAGEMENT 

A full-stack Sweet Shop management system with:
- **Backend**: Node.js + Express + MongoDB (Mongoose), JWT auth
- **Frontend**: React (Vite)
- **Testing**: Jest across Backend & Frontend (CI-friendly)

Monorepo with clear TDD setup and scripts for smooth local dev and CI.

> **Folder layout**
> 
SweetManagement/
├─ Backend/ <br>
│  ├─ app.js<br>
│  ├─ config/<br>
│  ├─ controller/<br>
│  ├─ middlewear/<br>
│  ├─ models/<br>
│  ├─ routes/<br>
│  └─ __tests__/        # Jest tests<br>
│
├─ Frontend/<br>
│  └─ src/<br>
│     └─ __tests__/       # Jest + RTL tests (if included)<br>
│
├─ TESTING.md<br>
└─ test-runner.js<br>


## Table of Contents
- [Features](#Features)
- [Tech Stack](#Tech-Stack)
- [Quick Start](#quick-start)
- [Screenshot](#screenshot)
- [My AI Usage](#my-ai-usage)

---



## 1) Features

- **Authentication & Roles**
  - `POST /api/auth/register`, `POST /api/auth/login`
  - JWT in `Authorization: Bearer <token>`
  - `admin` protected routes use `middlewear/requireAdmin.js`

- **Sweets Catalog**
  - `GET /api/sweets/getSweets`
  - `GET /api/sweets/searchSweet?q=<term>`
  - `POST /api/sweets/createSweet` *(admin)*
  - `PUT /api/sweets/updateSweet/:id` *(admin)*
  - `DELETE /api/sweets/deleteSweet/:id` *(admin)*
  - `POST /api/sweets/:id/purchase` *(auth)*
  - `POST /api/sweets/:id/restock` *(admin)*

> The frontend API client is in `Frontend/src/api/client.js`, which reads `VITE_API_URL` and automatically attaches the JWT from localStorage.

---

## 2) Tech Stack

- **Backend:** Node.js, Express 5, MongoDB (Mongoose), JSON Web Token, bcryptjs, cors, dotenv, morgan
- **Frontend:** React (Vite), Material UI, notistack, axios, React Router
- **Tooling:** ESLint, Vite dev server

---

## 3) Quick Start

**Prerequisites**
- Node.js **18+**
- MongoDB (local or Atlas)

### 3.1) Clone
```bash```<br>
git clone https://github.com/shahparth0107/SweetManagement.git<br>
cd SweetManagement

### 3.2) Backend
cd Backend<br>
cp .env.example .env   # if present; else create .env (see below)<br>
npm install<br>
npm run dev            # dev with nodemon (if configured)<br>
npm start              # production start<br>

### 3.3) Frontend
cd ../Frontend<br>
npm install<br>
npm run dev            # starts Vite dev server<br>

## 4) Screenshot

<img width="440" height="254" alt="image" src="https://github.com/user-attachments/assets/1a4c5f9f-402b-4559-8321-65138ac87d07" />

<img width="440" height="254" alt="image" src="https://github.com/user-attachments/assets/409d86be-91d5-45e9-b50c-c30b32e02746" />
<img width="440" height="254" alt="image" src="https://github.com/user-attachments/assets/725bed4f-29fd-4cb2-ba83-279c86a452a2" />
<img width="440" height="254" alt="image" src="https://github.com/user-attachments/assets/0ed4c704-a606-4872-bd09-b53aa02331b2" />








## 5) My AI Usage 
### Tools used
ChatGPT (GPT-5 Thinking)<br>
1.) Authored backend middleware (JWT verification, role guard, error handling).<br>
2.) Implemented the Item Reduce / inventory decrement API (validation, safe updates, response schema).<br>
3.) Helped scaffold and refine the Frontend (components/pages, state management patterns, API client usage, form flows).<br>
4.) Assisted with documentation polish and clarifying test commands/sections.<br>

Cursor (for Test-Driven Development)<br>
1.) Drove a TDD loop (red → green → refactor) for both Backend and Frontend.<br>
2.) Generated initial Jest test scaffolds, iterated failing tests into passing code, and surfaced refactor opportunities.<br>
3.) In-editor runs to quickly iterate on unit/integration tests.<br>

### How I used them

1.) Broke work into small prompts (per middleware/endpoint/component), reviewed AI output, then integrated selectively.<br>
2.) Kept security & correctness on me: verified JWT handling, avoided double hashing, reviewed DB operations for concurrency and validation, and ensured ENV-based secrets.<br>
3.) Followed TDD discipline with Cursor: wrote failing tests first, made them pass with minimal code, and refactored with tests as safety nets.<br>



