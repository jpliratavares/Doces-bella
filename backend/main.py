from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from database import engine, get_db, Base
from models import Sweet as SweetModel, Sale as SaleModel, Expense as ExpenseModel
from schemas import Sweet, SweetCreate, Sale, SaleCreate, Expense, ExpenseCreate

# Criar tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Doces da Bella API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== SWEETS (DOCES) =====

@app.get("/api/sweets", response_model=List[Sweet])
def get_sweets(db: Session = Depends(get_db)):
    return db.query(SweetModel).all()


@app.get("/api/sweets/{sweet_id}", response_model=Sweet)
def get_sweet(sweet_id: int, db: Session = Depends(get_db)):
    sweet = db.query(SweetModel).filter(SweetModel.id == sweet_id).first()
    if not sweet:
        raise HTTPException(status_code=404, detail="Doce não encontrado")
    return sweet


@app.post("/api/sweets", response_model=Sweet)
def create_sweet(sweet: SweetCreate, db: Session = Depends(get_db)):
    db_sweet = SweetModel(**sweet.dict())
    db.add(db_sweet)
    db.commit()
    db.refresh(db_sweet)
    return db_sweet


@app.put("/api/sweets/{sweet_id}", response_model=Sweet)
def update_sweet(sweet_id: int, sweet: SweetCreate, db: Session = Depends(get_db)):
    db_sweet = db.query(SweetModel).filter(SweetModel.id == sweet_id).first()
    if not db_sweet:
        raise HTTPException(status_code=404, detail="Doce não encontrado")
    for key, value in sweet.dict().items():
        setattr(db_sweet, key, value)
    db.commit()
    db.refresh(db_sweet)
    return db_sweet


@app.delete("/api/sweets/{sweet_id}")
def delete_sweet(sweet_id: int, db: Session = Depends(get_db)):
    db_sweet = db.query(SweetModel).filter(SweetModel.id == sweet_id).first()
    if not db_sweet:
        raise HTTPException(status_code=404, detail="Doce não encontrado")
    db.delete(db_sweet)
    db.commit()
    return {"message": "Doce deletado com sucesso"}


# ===== SALES (VENDAS) =====

@app.get("/api/sales", response_model=List[Sale])
def get_sales(db: Session = Depends(get_db)):
    return db.query(SaleModel).all()


@app.get("/api/sales/{sale_id}", response_model=Sale)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(SaleModel).filter(SaleModel.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return sale


@app.post("/api/sales", response_model=Sale)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    sweet = db.query(SweetModel).filter(SweetModel.id == sale.sweet_id).first()
    if not sweet:
        raise HTTPException(status_code=404, detail="Doce nao encontrado")
    if sweet.quantity < sale.quantity:
        raise HTTPException(status_code=400, detail="Estoque insuficiente para esta venda")

    db_sale = SaleModel(**sale.dict())
    db.add(db_sale)
    sweet.quantity -= sale.quantity
    db.commit()
    db.refresh(db_sale)
    return db_sale


@app.put("/api/sales/{sale_id}", response_model=Sale)
def update_sale(sale_id: int, sale: SaleCreate, db: Session = Depends(get_db)):
    db_sale = db.query(SaleModel).filter(SaleModel.id == sale_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    current_sweet = db.query(SweetModel).filter(SweetModel.id == db_sale.sweet_id).first()
    next_sweet = db.query(SweetModel).filter(SweetModel.id == sale.sweet_id).first()
    if not next_sweet:
        raise HTTPException(status_code=404, detail="Doce nao encontrado")

    available_quantity = next_sweet.quantity
    if db_sale.sweet_id == sale.sweet_id:
        available_quantity += db_sale.quantity
    if available_quantity < sale.quantity:
        raise HTTPException(status_code=400, detail="Estoque insuficiente para esta venda")

    if current_sweet:
        current_sweet.quantity += db_sale.quantity
    for key, value in sale.dict().items():
        setattr(db_sale, key, value)
    next_sweet.quantity -= sale.quantity
    db.commit()
    db.refresh(db_sale)
    return db_sale


@app.delete("/api/sales/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    db_sale = db.query(SaleModel).filter(SaleModel.id == sale_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    sweet = db.query(SweetModel).filter(SweetModel.id == db_sale.sweet_id).first()
    if sweet:
        sweet.quantity += db_sale.quantity
    db.delete(db_sale)
    db.commit()
    return {"message": "Venda deletada com sucesso"}


# ===== EXPENSES (DESPESAS) =====

@app.get("/api/expenses", response_model=List[Expense])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(ExpenseModel).all()


@app.get("/api/expenses/{expense_id}", response_model=Expense)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    return expense


@app.post("/api/expenses", response_model=Expense)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = ExpenseModel(**expense.dict())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.put("/api/expenses/{expense_id}", response_model=Expense)
def update_expense(expense_id: int, expense: ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    for key, value in expense.dict().items():
        setattr(db_expense, key, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    db.delete(db_expense)
    db.commit()
    return {"message": "Despesa deletada com sucesso"}


# ===== DASHBOARD (RESUMO) =====

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    sweets_count = db.query(SweetModel).count()
    sales = db.query(SaleModel).all()
    expenses = db.query(ExpenseModel).all()
    
    total_sales = 0
    for sale in sales:
        sweet = db.query(SweetModel).filter(SweetModel.id == sale.sweet_id).first()
        if sweet:
            total_sales += (sweet.selling_price * sale.quantity - sale.discount + sale.surcharge)
    
    total_expenses = sum(e.amount for e in expenses)
    
    # Contar total de estoque
    total_quantity = sum(s.quantity for s in db.query(SweetModel).all())
    
    return {
        "sweets_count": sweets_count,
        "sales_count": len(sales),
        "expenses_count": len(expenses),
        "total_sales": total_sales,
        "total_expenses": total_expenses,
        "balance": total_sales - total_expenses,
        "total_quantity": total_quantity,
    }


@app.get("/")
def root():
    return {"message": "Doces da Bella API"}


# ===== RECEITAS (RECIPES) =====

@app.post("/api/recipes/brownies")
def add_brownies_recipe(db: Session = Depends(get_db)):
    """Adiciona uma receita de brownies (R$ 16,00 -> 12 brownies)"""
    # Criar despesa
    expense = ExpenseModel(
        description="Receita: Brownies",
        amount=-16,  # Negativo porque é entrada
        category="Receita",
        type="Variável",
        date=datetime.now(),
    )
    db.add(expense)
    
    # Encontrar ou criar brownie
    brownie = db.query(SweetModel).filter(SweetModel.name == "Brownie").first()
    if not brownie:
        brownie = SweetModel(
            name="Brownie",
            form_name="Quadrado",
            category="Chocolate",
            cost_price=1.33,  # 16/12
            selling_price=3.00,
            quantity=0,
        )
        db.add(brownie)
        db.flush()
    
    # Atualizar estoque
    brownie.quantity += 12
    db.commit()
    
    return {
        "message": "Receita adicionada com sucesso!",
        "expense_id": expense.id,
        "brownie_quantity": brownie.quantity,
    }
