# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### Register User (Consumer)
**POST** `/auth/register`

Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "consumer"
    },
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/auth/login`

Request Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "consumer"
    },
    "token": "jwt_token_here"
  }
}
```

### Get Current User
**GET** `/auth/me`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "consumer"
    }
  }
}
```

### Seed Creator
**POST** `/auth/seed-creator`

Creates default creator account (creator@mini.com / creator123)

---

## Posts

### Get All Posts
**GET** `/posts`

Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "post_id",
      "imageUrl": "https://example.com/image.jpg",
      "caption": "Beautiful sunset",
      "creator": {
        "_id": "user_id",
        "name": "Creator",
        "email": "creator@mini.com"
      },
      "likes": ["user_id_1", "user_id_2"],
      "comments": [...],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Single Post
**GET** `/posts/:id`

### Create Post (Creator Only)
**POST** `/posts`

Headers:
```
Authorization: Bearer <token>
```

Request Body:
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "caption": "My new post!"
}
```

### Update Post (Creator Only, Own Posts)
**PUT** `/posts/:id`

Headers:
```
Authorization: Bearer <token>
```

Request Body:
```json
{
  "imageUrl": "https://example.com/new-image.jpg",
  "caption": "Updated caption"
}
```

### Delete Post (Creator Only, Own Posts)
**DELETE** `/posts/:id`

Headers:
```
Authorization: Bearer <token>
```

---

## Comments

### Get Comments for Post
**GET** `/comments/post/:postId`

Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "comment_id",
      "text": "Great post!",
      "user": {
        "_id": "user_id",
        "name": "John Doe"
      },
      "post": "post_id",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Add Comment
**POST** `/comments`

Headers:
```
Authorization: Bearer <token>
```

Request Body:
```json
{
  "text": "Great post!",
  "postId": "post_id"
}
```

### Delete Comment
**DELETE** `/comments/:id`

Headers:
```
Authorization: Bearer <token>
```

---

## Likes

### Get Likes for Post
**GET** `/likes/:postId`

Response:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

### Like/Unlike Post
**POST** `/likes/:postId`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "post": {...},
    "liked": true,
    "likeCount": 5
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error
