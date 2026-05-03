from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SweetBase(BaseModel):
    name: str
    form_name: str
    category: str
    cost_price: float
    selling_price: float
    quantity: int = 0


class SweetCreate(SweetBase):
    pass


class Sweet(SweetBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SaleBase(BaseModel):
    sweet_id: int
    quantity: int
    customer_name: str
    discount: float = 0
    surcharge: float = 0
    payment_method: str
    status: str
    notes: str = ""
    date: datetime


class SaleCreate(SaleBase):
    pass


class Sale(SaleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseBase(BaseModel):
    description: str
    amount: float
    category: str
    type: str
    date: datetime


class ExpenseCreate(ExpenseBase):
    pass


class Expense(ExpenseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
