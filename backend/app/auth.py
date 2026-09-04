import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

JWT_ALGORITHM = "HS256"
TOKEN_LIFETIME = timedelta(days=30)
bearer_scheme = HTTPBearer(auto_error=False)


def _secret() -> str:
    return os.getenv("JWT_SECRET", "local-development-secret")


def create_token() -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": "owner", "iat": now, "exp": now + TOKEN_LIFETIME}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def verify_password(password: str) -> bool:
    configured_password = os.getenv("APP_PASSWORD")
    return bool(configured_password) and password == configured_password


def require_owner(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in required")
    try:
        payload = jwt.decode(credentials.credentials, _secret(), algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired") from error
    if payload.get("sub") != "owner":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return "owner"