# API Documentation

Base URL: `http://localhost:3000`

## Authentication

Protected routes require a Bearer Token (JWT) in the `Authorization` header.
`Authorization: Bearer <token>`

## Endpoints

### General

#### Get Service Info

`GET /`

Returns service banner.

**Response 200**

```json
{
  "message": "string"
}
```

#### Health Check

`GET /health`

Returns service health status.

**Response 200**

```json
{
  "status": "string",
  "uptime": 0,
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Authentication

#### Request Magic-Link

`POST /users/auth/request`

Request a magic-link for sign-in.

**Request Body**

```json
{
  "email": "user@example.com"
}
```

**Response 200**

```json
{
  "devOnlyUrl": "string"
}
```

#### Exchange Token

`POST /users/auth`

Exchange magic-link token for JWT.

**Request Body**

```json
{
  "token": "64-char-hex-token"
}
```

**Response 200**

```json
{
  "token": "jwt-token-string"
}
```

### Users

#### Get Current User

`GET /users`
_Requires Authentication_

Get details of the currently authenticated user.

**Response 200**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "string"
}
```

#### Update Username

`PATCH /users`
_Requires Authentication_

Update the username of the current user.

**Request Body**

```json
{
  "username": "new_username"
}
```

_Username must be 3-32 characters, alphanumeric, dots, underscores, or hyphens._

**Response 200**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "new_username"
}
```

**Response 409**
Username not available.

### API Keys

#### List API Keys

`GET /api-keys`
_Requires Authentication_

List all API keys for the current user.

**Response 200**

```json
[
  {
    "id": "uuid",
    "name": "string",
    "revoked": false,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "lastUsedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Create API Key

`POST /api-keys`
_Requires Authentication_

Create a new API key. The full key value is returned only once.

**Request Body**

```json
{
  "name": "My API Key"
}
```

**Response 201**

```json
{
  "id": "uuid",
  "key": "full-api-key-string"
}
```

#### Revoke API Key

`DELETE /api-keys/{id}`
_Requires Authentication_

Revoke an API key by ID.

**Parameters**

- `id` (path): UUID of the API key

**Response 204**
No Content
