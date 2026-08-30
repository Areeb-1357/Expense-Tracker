from datetime import date as Date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ExpenseBase(BaseModel):
    date: Date
    category: str = Field(min_length=1)
    amount: float = Field(gt=0)
    description: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    date: Optional[Date] = None
    category: Optional[str] = Field(default=None, min_length=1)
    amount: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
