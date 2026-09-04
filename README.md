# Expense Tracker

A vibrant, futuristic expense tracker built for everyday spending in India. Add, review, edit, and delete expenses while keeping an eye on your total spend, average expense, and biggest category.

## Live App

[Open the live Expense Tracker app](https://areeb-1357.github.io/Expense-Tracker/)

## Features

- Add expenses with date, category, amount, and an optional note
- Edit existing expenses without leaving the dashboard
- Delete expenses with instant list and summary updates
- INR formatting with the Indian numbering system
- Dashboard showing total spent, top category, average expense, and tracking status
- Automatic category icons for food, travel, rent, shopping, health, entertainment, and more
- Responsive layout for desktop and mobile screens
- Futuristic dark interface with colorful gradients and glass-style panels
- Protected account storage so your expenses can be available across browsers

## Project Structure

```text
index.html  Application entry point
app.js      Frontend behavior and browser-storage fallback
styles.css  Frontend visual design
backend/    Application services
tests/      Automated tests
```

## Deploying the API

GitHub Pages hosts the static frontend only. The `render.yaml` file deploys the FastAPI backend and PostgreSQL database on Render.

1. In Render, choose **New > Blueprint** and connect this repository.
2. Set the `APP_PASSWORD` secret when Render asks for it.
3. Copy the created web service URL and replace the API URL fallback in `app.js` with `<your-render-url>/api`.
4. Commit and push the frontend change to GitHub Pages.

Expenses saved before sign-in remain in the original browser's local storage and can be entered into the new account after deployment.
