# Expense Tracker App

Full-stack expense tracker: FastAPI + SQLite backend and a static HTML/CSS/JS frontend.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/expenses` | List expenses |
| GET | `/api/expenses/{id}` | Get one expense |
| POST | `/api/expenses` | Create an expense |
| PUT | `/api/expenses/{id}` | Update an expense |
| DELETE | `/api/expenses/{id}` | Delete an expense |

Body fields: `date` (YYYY-MM-DD), `category`, `amount` (number > 0), `description` (optional).

## Setup

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000 — the app serves the frontend from the same server.

Interactive docs: http://127.0.0.1:8000/docs
