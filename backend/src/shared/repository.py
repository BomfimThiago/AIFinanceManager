"""
Shared repository base classes and common database operations.

This module contains base repository classes that provide common
database operations for all modules.
"""

from typing import Any, TypeVar

from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

from .exceptions import DatabaseError, DuplicateError

# Type variables for generic repository
ModelType = TypeVar("ModelType", bound=DeclarativeBase)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class BaseRepository[ModelType: DeclarativeBase, CreateSchemaType, UpdateSchemaType]:
    """Base repository class with common CRUD operations."""

    def __init__(self, model: type[ModelType], db: AsyncSession):
        """Initialize repository with model class and database session."""
        self.model = model
        self.db = db

    async def get_by_id(self, id: Any) -> ModelType | None:
        """Get a single record by ID."""
        try:
            result = await self.db.execute(
                select(self.model).where(self.model.id == id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            raise DatabaseError(
                operation="get_by_id",
                table=self.model.__tablename__,
                details={"id": id, "error": str(e)},
            ) from e

    async def get_by_ids(self, ids: list[Any]) -> list[ModelType]:
        """Get multiple records by IDs."""
        try:
            result = await self.db.execute(
                select(self.model).where(self.model.id.in_(ids))
            )
            return list(result.scalars().all())
        except Exception as e:
            raise DatabaseError(
                operation="get_by_ids",
                table=self.model.__tablename__,
                details={"ids": ids, "error": str(e)},
            ) from e

    async def get_by_field(self, field_name: str, field_value: Any) -> ModelType | None:
        """Get a single record by any field."""
        try:
            field = getattr(self.model, field_name)
            result = await self.db.execute(
                select(self.model).where(field == field_value)
            )
            return result.scalar_one_or_none()
        except AttributeError as e:
            raise DatabaseError(
                operation="get_by_field",
                table=self.model.__tablename__,
                details={"field": field_name, "error": f"Field {field_name} not found"},
            ) from e
        except Exception as e:
            raise DatabaseError(
                operation="get_by_field",
                table=self.model.__tablename__,
                details={"field": field_name, "value": field_value, "error": str(e)},
            ) from e

    async def get_all(self) -> list[ModelType]:
        """Get all records without pagination."""
        try:
            result = await self.db.execute(select(self.model))
            return list(result.scalars().all())
        except Exception as e:
            raise DatabaseError(
                operation="get_all",
                table=self.model.__tablename__,
                details={"error": str(e)},
            ) from e

    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: dict[str, Any] | None = None,
        order_by: str | None = None,
        order_desc: bool = False,
    ) -> tuple[list[ModelType], int]:
        """Get multiple records with pagination and filtering."""
        try:
            # Build base query
            query = select(self.model)

            # Apply filters
            if filters:
                conditions = []
                for field_name, field_value in filters.items():
                    if hasattr(self.model, field_name) and field_value is not None:
                        field = getattr(self.model, field_name)
                        if isinstance(field_value, list):
                            conditions.append(field.in_(field_value))
                        else:
                            conditions.append(field == field_value)

                if conditions:
                    query = query.where(and_(*conditions))

            # Apply ordering
            if order_by and hasattr(self.model, order_by):
                order_field = getattr(self.model, order_by)
                if order_desc:
                    query = query.order_by(order_field.desc())
                else:
                    query = query.order_by(order_field)

            # Get total count
            count_query = select(func.count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total = total_result.scalar()

            # Apply pagination
            query = query.offset(skip).limit(limit)

            # Execute query
            result = await self.db.execute(query)
            items = list(result.scalars().all())

            return items, total

        except Exception as e:
            raise DatabaseError(
                operation="get_multi",
                table=self.model.__tablename__,
                details={"skip": skip, "limit": limit, "error": str(e)},
            ) from e

    async def create(self, obj_in: CreateSchemaType | dict[str, Any]) -> ModelType:
        """Create a new record."""
        try:
            if isinstance(obj_in, dict):
                create_data = obj_in
            else:
                create_data = (
                    obj_in.model_dump()
                    if hasattr(obj_in, "model_dump")
                    else obj_in.dict()
                )

            db_obj = self.model(**create_data)
            self.db.add(db_obj)
            await self.db.commit()
            await self.db.refresh(db_obj)
            return db_obj

        except IntegrityError as e:
            await self.db.rollback()
            raise DuplicateError(
                resource=self.model.__name__, details={"error": str(e)}
            ) from e
        except Exception as e:
            await self.db.rollback()
            raise DatabaseError(
                operation="create",
                table=self.model.__tablename__,
                details={"error": str(e)},
            ) from e

    async def create_multi(
        self, objects_in: list[CreateSchemaType | dict[str, Any]]
    ) -> list[ModelType]:
        """Create multiple records."""
        try:
            db_objects = []
            for obj_in in objects_in:
                if isinstance(obj_in, dict):
                    create_data = obj_in
                else:
                    create_data = (
                        obj_in.model_dump()
                        if hasattr(obj_in, "model_dump")
                        else obj_in.dict()
                    )

                db_obj = self.model(**create_data)
                db_objects.append(db_obj)

            self.db.add_all(db_objects)
            await self.db.commit()

            # Refresh all objects
            for db_obj in db_objects:
                await self.db.refresh(db_obj)

            return db_objects

        except IntegrityError as e:
            await self.db.rollback()
            raise DuplicateError(
                resource=self.model.__name__, details={"error": str(e)}
            ) from e
        except Exception as e:
            await self.db.rollback()
            raise DatabaseError(
                operation="create_multi",
                table=self.model.__tablename__,
                details={"count": len(objects_in), "error": str(e)},
            ) from e

    async def update(
        self, id: Any, obj_in: UpdateSchemaType | dict[str, Any]
    ) -> ModelType | None:
        """Update a record by ID."""
        try:
            # Get existing object
            db_obj = await self.get_by_id(id)
            if not db_obj:
                return None

            # Prepare update data
            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                update_data = (
                    obj_in.model_dump(exclude_unset=True)
                    if hasattr(obj_in, "model_dump")
                    else obj_in.dict(exclude_unset=True)
                )

            # Apply updates
            for field, value in update_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)

            await self.db.commit()
            await self.db.refresh(db_obj)
            return db_obj

        except Exception as e:
            await self.db.rollback()
            raise DatabaseError(
                operation="update",
                table=self.model.__tablename__,
                details={"id": id, "error": str(e)},
            ) from e

    async def update_multi(
        self, filters: dict[str, Any], update_data: dict[str, Any]
    ) -> int:
        """Update multiple records matching filters."""
        try:
            # Build where conditions
            conditions = []
            for field_name, field_value in filters.items():
                if hasattr(self.model, field_name):
                    field = getattr(self.model, field_name)
                    if isinstance(field_value, list):
                        conditions.append(field.in_(field_value))
                    else:
                        conditions.append(field == field_value)

            if not conditions:
                raise DatabaseError(
                    operation="update_multi",
                    table=self.model.__tablename__,
                    details={"error": "No valid filter conditions"},
                )

            # Execute update
            stmt = update(self.model).where(and_(*conditions)).values(**update_data)
            result = await self.db.execute(stmt)
            await self.db.commit()

            return result.rowcount

        except Exception as e:
            await self.db.rollback()
            raise DatabaseError(
                operation="update_multi",
                table=self.model.__tablename__,
                details={"filters": filters, "error": str(e)},
            ) from e

    async def delete(self, id: Any) -> bool:
        """Delete a record by ID."""
        try:
            result = await self.db.execute(
                delete(self.model).where(self.model.id == id)
            )
            await self.db.commit()
            return result.rowcount > 0

        except Exception as e:
            await self.db.rollback()
            raise DatabaseError(
                operation="delete",
                table=self.model.__tablename__,
                details={"id": id, "error": str(e)},
            ) from e

    async def delete_multi(self, ids: list[Any]) -> int:
        """Delete multiple records by IDs."""
        try:
            result = await self.db.execute(
                delete(self.model).where(self.model.id.in_(ids))
            )
            await self.db.commit()
            return result.rowcount

        except Exception as e:
            await self.db.rollback()
            raise DatabaseError(
                operation="delete_multi",
                table=self.model.__tablename__,
                details={"ids": ids, "error": str(e)},
            ) from e

    async def exists(self, id: Any) -> bool:
        """Check if a record exists by ID."""
        try:
            result = await self.db.execute(
                select(func.count(self.model.id)).where(self.model.id == id)
            )
            count = result.scalar()
            return count > 0

        except Exception as e:
            raise DatabaseError(
                operation="exists",
                table=self.model.__tablename__,
                details={"id": id, "error": str(e)},
            ) from e

    async def count(self, filters: dict[str, Any] | None = None) -> int:
        """Count records with optional filters."""
        try:
            query = select(func.count(self.model.id))

            # Apply filters
            if filters:
                conditions = []
                for field_name, field_value in filters.items():
                    if hasattr(self.model, field_name) and field_value is not None:
                        field = getattr(self.model, field_name)
                        if isinstance(field_value, list):
                            conditions.append(field.in_(field_value))
                        else:
                            conditions.append(field == field_value)

                if conditions:
                    query = query.where(and_(*conditions))

            result = await self.db.execute(query)
            return result.scalar()

        except Exception as e:
            raise DatabaseError(
                operation="count",
                table=self.model.__tablename__,
                details={"filters": filters, "error": str(e)},
            ) from e
