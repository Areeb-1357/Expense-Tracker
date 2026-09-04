import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import require_owner
from app.database import get_db
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate

router = APIRouter()


def _normalize_category(value: str) -> str:
    text = (value or "").strip()
    if not text:
        return "Other"
    text = re.sub(r"\s+", " ", text)
    return text.title()


def _to_row(payload: ExpenseCreate) -> dict:
    return {
        "date": payload.date.isoformat(),
        "category": _normalize_category(payload.category),
        "amount": payload.amount,
        "description": (payload.description or "").strip() or None,
    }


@router.get("/expenses", response_model=List[ExpenseResponse])
def list_expenses(_: str = Depends(require_owner), db: Session = Depends(get_db)):
    return db.query(Expense).order_by(Expense.id.desc()).all()


@router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, _: str = Depends(require_owner), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("/expenses", response_model=ExpenseResponse, status_code=201)
def add_expense(expense: ExpenseCreate, _: str = Depends(require_owner), db: Session = Depends(get_db)):
    row = Expense(**_to_row(expense))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    _: str = Depends(require_owner),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    data = payload.model_dump(exclude_unset=True)
    if "date" in data and data["date"] is not None:
        data["date"] = data["date"].isoformat()
    if "category" in data and data["category"] is not None:
        data["category"] = _normalize_category(data["category"])
    if "description" in data and data["description"] is not None:
        data["description"] = data["description"].strip() or None

    for key, value in data.items():
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/expenses/{expense_id}", response_model=ExpenseResponse)
def delete_expense(expense_id: int, _: str = Depends(require_owner), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return expense
