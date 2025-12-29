from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.shared.models import BaseModel


class User(BaseModel):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)

    # Relationships
    receipts: Mapped[list["Receipt"]] = relationship(back_populates="user")  # noqa: F821
    expenses: Mapped[list["Expense"]] = relationship(back_populates="user")  # noqa: F821
    categories: Mapped[list["Category"]] = relationship(back_populates="user")  # noqa: F821
