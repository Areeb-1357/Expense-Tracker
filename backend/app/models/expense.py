from sqlalchemy import Column, Float, Integer, String

from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
