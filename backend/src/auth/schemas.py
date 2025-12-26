from pydantic import BaseModel, ConfigDict, EmailStr, Field


def to_camel(string: str) -> str:
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class CamelCaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class UserCreate(CamelCaseModel):
    email: EmailStr
    password: str
    full_name: str = Field(alias="fullName")


class UserResponse(CamelCaseModel):
    id: int
    email: str
    full_name: str = Field(serialization_alias="fullName")
    is_active: bool = Field(serialization_alias="isActive")

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class UserLogin(CamelCaseModel):
    email: EmailStr
    password: str


class Token(CamelCaseModel):
    access_token: str = Field(serialization_alias="accessToken")
    token_type: str = Field(default="bearer", serialization_alias="tokenType")


class TokenPayload(BaseModel):
    sub: int
    exp: int
