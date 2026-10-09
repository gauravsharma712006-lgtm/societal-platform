# Media API

Images are stored in AWS S3. The API does not receive the file bytes; instead it issues **short-lived presigned URLs**, and the client uploads/downloads directly to/from S3.

- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 10 MB
- Presigned URL expiry: 300 seconds (5 minutes)

## Get an upload URL

`POST /api/media/upload-url` — reporter of the problem only

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `problemId` | string | required |
| `fileName` | string | 1–255 characters |
| `contentType` | enum | jpeg / png / webp |
| `size` | number | ≤ 10 MB |

**Response `200 OK`**

```json
{
  "status": "success",
  "data": {
    "uploadUrl": "<presigned PUT url>",
    "key": "problems/<problemId>/<uuid>.jpg",
    "fileName": "photo.jpg",
    "contentType": "image/jpeg",
    "size": 12345
  }
}
```

**Upload flow**

1. `POST /api/media/upload-url` → receive `uploadUrl` and `key`.
2. `PUT` the file bytes to `uploadUrl`.
3. `POST /api/problems/:problemId/media` with `{ key, originalName, contentType, size }` to attach it.

## Get a download URL

`POST /api/media/download-url` — reporter of the problem only

**Request body**

```json
{ "problemId": "64f...", "key": "problems/<problemId>/<uuid>.jpg" }
```

**Response `200 OK`**

```json
{
  "status": "success",
  "data": {
    "downloadUrl": "<presigned GET url>"
  }
}
```

- `404 Not Found` — problem not found, or the `key` is not attached to that problem
