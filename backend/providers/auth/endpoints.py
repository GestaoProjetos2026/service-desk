"""
Endpoint constants for the Core Engine Auth API.
Base URL: configured via CORE_ENGINE_URL env var (settings.core_engine_url)
"""

from app.config.config import settings

BASE_URL = settings.core_engine_url.rstrip("/") + "/v1"

# ----- Auth -----
AUTH_LOGIN    = f"{BASE_URL}/auth/login"     # POST  — login with e-mail and password
AUTH_REGISTER = f"{BASE_URL}/auth/register"  # POST  — register a new user
AUTH_REFRESH  = f"{BASE_URL}/auth/refresh"   # POST  — refresh access token
AUTH_ME       = f"{BASE_URL}/auth/me"        # GET   — get current user profile

# ----- Users -----
USERS_LIST    = f"{BASE_URL}/users"          # GET   — list users (paginated)
USERS_CREATE  = f"{BASE_URL}/users"          # POST  — create a new user (admin)
USERS_GET     = f"{BASE_URL}/users/{{id}}"   # GET   — get user by id
USERS_UPDATE  = f"{BASE_URL}/users/{{id}}"   # PATCH — update a user
USERS_STATUS  = f"{BASE_URL}/users/{{id}}/status"  # PATCH — activate / deactivate

# ----- Roles -----
ROLES_LIST    = f"{BASE_URL}/roles"
ROLES_CREATE  = f"{BASE_URL}/roles"
ROLES_DELETE  = f"{BASE_URL}/roles/{{id}}"

# ----- Permissions -----
PERMS_LIST    = f"{BASE_URL}/permissions"
PERMS_CREATE  = f"{BASE_URL}/permissions"
PERMS_DELETE  = f"{BASE_URL}/permissions/{{id}}"

# ----- Integration (M2M) -----
INTEGRATION_TOKEN = f"{BASE_URL}/integration/token"   # POST
OAUTH_TOKEN       = f"{BASE_URL}/oauth/token"         # POST

# ----- Health -----
HEALTH = f"{BASE_URL}/health"               # GET
