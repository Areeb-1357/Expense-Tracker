# Expense Tracker

A vibrant, futuristic expense tracker built for everyday spending in India. Add, review, edit, and delete expenses while keeping an eye on your total spend, average expense, and biggest category.

## Live App

GitHub Pages link: **Coming soon**

Replace the placeholder above with the GitHub Pages URL after deployment.

## Features

- Add expenses with date, category, amount, and an optional note
- Edit existing expenses without leaving the dashboard
- Delete expenses with instant list and summary updates
- INR formatting with the Indian numbering system
- Dashboard showing total spent, top category, average expense, and tracking status
- Automatic category icons for food, travel, rent, shopping, health, entertainment, and more
- Responsive layout for desktop and mobile screens
- Futuristic dark interface with colorful gradients and glass-style panels
- Local browser storage fallback so the GitHub Pages version remains usable without a backend
- FastAPI and SQLite backend for persistent local development

## GitHub Pages

The root `index.html` file and its CSS/JavaScript assets form the static app published with GitHub Pages.

1. Push the project to GitHub.
2. Open the repository's **Settings** tab.
3. Select **Pages** under **Code and automation**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then select **Save**.
6. Open the generated Pages URL and replace the placeholder in this README.

GitHub Pages cannot run the FastAPI server. On Pages, expenses are saved in the browser using `localStorage`, so data is specific to that browser and device. Use the local backend setup below when you need SQLite persistence and API access.

## Run Locally With FastAPI

From the project root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open <http://127.0.0.1:8000> to use the app. The FastAPI server serves the frontend and API together.

Interactive API documentation is available at <http://127.0.0.1:8000/docs>.

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/expenses` | List all expenses |
| GET | `/api/expenses/{id}` | Get one expense |
| POST | `/api/expenses` | Create an expense |
| PUT | `/api/expenses/{id}` | Update an expense |
| DELETE | `/api/expenses/{id}` | Delete an expense |

Expense fields are `date` (`YYYY-MM-DD`), `category`, `amount` (number greater than zero), and an optional `description`.

## Project Structure

```text
index.html  Static GitHub Pages entry point
app.js      Frontend behavior and browser-storage fallback
styles.css  Frontend visual design
backend/    FastAPI application and SQLite persistence
tests/      Backend API tests
```
