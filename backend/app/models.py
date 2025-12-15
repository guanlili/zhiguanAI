import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


# =============== Job Application (网申表格) Models ===============


# Shared properties for JobApplication
class JobApplicationBase(SQLModel):
    company_name: str = Field(max_length=255, description="公司名称")
    announcement_url: str | None = Field(default=None, max_length=1024, description="公告链接")
    apply_url: str | None = Field(default=None, max_length=1024, description="投递链接")
    industry: str | None = Field(default=None, max_length=100, description="行业")
    tags: str | None = Field(default=None, max_length=500, description="标签")
    batch: str | None = Field(default=None, max_length=100, description="批次")
    position: str | None = Field(default=None, max_length=255, description="职位")
    location: str | None = Field(default=None, max_length=255, description="地点")
    deadline: datetime | None = Field(default=None, description="投递截止时间")


# Properties to receive on job application creation
class JobApplicationCreate(JobApplicationBase):
    pass


# Properties to receive on job application update
class JobApplicationUpdate(SQLModel):
    company_name: str | None = Field(default=None, max_length=255)
    announcement_url: str | None = Field(default=None, max_length=1024)
    apply_url: str | None = Field(default=None, max_length=1024)
    industry: str | None = Field(default=None, max_length=100)
    tags: str | None = Field(default=None, max_length=500)
    batch: str | None = Field(default=None, max_length=100)
    position: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    deadline: datetime | None = None


# Database model for JobApplication
class JobApplication(JobApplicationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")


# Properties to return via API
class JobApplicationPublic(JobApplicationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class JobApplicationsPublic(SQLModel):
    data: list[JobApplicationPublic]
    count: int
