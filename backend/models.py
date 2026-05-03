from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class Sweet(Base):
    __tablename__ = "sweets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    form_name = Column(String)
    category = Column(String)
    cost_price = Column(Float)
    selling_price = Column(Float)
    quantity = Column(Integer, default=0)  # Estoque
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    sweet_id = Column(Integer, index=True)
    quantity = Column(Integer)
    customer_name = Column(String)
    discount = Column(Float, default=0)
    surcharge = Column(Float, default=0)
    payment_method = Column(String)
    status = Column(String)
    notes = Column(String, default="")
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    category = Column(String)
    type = Column(String)  # Fixo ou Variável
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
