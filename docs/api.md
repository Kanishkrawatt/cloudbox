# Cloud Box API

Every endpoint lives under `/api` on the host you are using, for example
`https://cloudbox.kanishkrawat.in/api`. Requests and responses are JSON.
Everything is `POST` unless stated otherwise.

## Authentication

There are two kinds of routes.

**Owner routes** act on your own account. They take a Firebase ID token in the
request body as `idToken`. Get one from the signed-in browser:

```js
const idToken = await firebase.auth().currentUser.getIdToken();
```

The token proves who you are; the route then only touches that account's data.

**Recipient routes** are for people holding a Smart Share link. They take the
share `id` from the link (`/smartshow?id=<id>`) and need no token.

The value shown as *API token* on your profile is your user id (`uid`). A few
older read routes take it directly in the body; they are listed below.

## Library

### List images

`POST /api/getImages`

```json
{ "uid": "<your uid>", "folderName": "Goa trip" }
```

`folderName` is optional; without it you get the top-level Images collection.
Each item: `name, size, type, url, date, location, publicId, resourceType`, plus
`phash`, `text` and `tags` on images uploaded since analysis was added.

### Folders

`POST /api/getFolders` with `{ "uid" }` returns `{ data: [{ id, name, date, size }] }`.

`POST /api/addFolder` with `{ "uid", "folderName" }` creates one.

### Delete items

`POST /api/deleteItem`

```json
{
  "idToken": "<token>",
  "items": [{ "url": "...", "publicId": "...", "resourceType": "image" }]
}
```

Removes the bytes from storage and the Firestore rows, and refunds quota. A
legacy shape `{ "idToken", "data": ["<url>", ...] }` is still accepted.

### Storage quota

`POST /api/storageInfo` with `{ "uid" }` returns `{ used, free, total }` in MB.

## Smart Share

### Read a share (recipient)

`GET /api/smartshare/<id>` returns

```json
{
  "name": "Goa trip",
  "expiresOn": "Sat Sep 27 2026",
  "expiresInDays": 5,
  "faceStatus": "done",
  "people": [{ "photos": ["..."], "faceCount": 3, "face": { "url": "...", "box": {} } }],
  "allowUploads": true,
  "burnAfterDownload": false,
  "extendRequested": false,
  "files": [{ "name": "a.jpg", "size": 1234, "type": "image/jpeg", "url": "...", "guest": true }]
}
```

Every read counts as an open unless you add `?peek=1`. Expired or used-up
links answer `410`.

### Recipient events

`POST /api/smartshare/track`

```json
{ "id": "<share id>", "event": "download", "file": "a.jpg" }
{ "id": "<share id>", "event": "extend" }
```

`download` increments the counter and, on a one-shot share, burns the link
(response carries `burned: true`). `extend` flags the share so the owner sees
the request.

### Guest uploads

Only when the owner enabled *Let recipients add files*. Two steps:

```json
POST /api/smartshare/guest  { "id", "step": "sign", "fileName": "beach" }
→ { signature, timestamp, apiKey, cloudName, folder, publicId }
```

Upload to `https://api.cloudinary.com/v1_1/<cloudName>/auto/upload` with those
fields, then record it:

```json
POST /api/smartshare/guest
{ "id", "step": "record", "name", "size", "type", "url", "publicId", "resourceType" }
```

Guest files are capped at 25 MB each and 50 per share; the URL must sit in the
share's own guest folder.

### Owner edits

`POST /api/smartshare/update`

```json
{ "idToken": "<token>", "shareId": "<short id>", "extendDays": 2 }
{ "idToken": "<token>", "shareId": "<short id>", "allowUploads": true }
{ "idToken": "<token>", "shareId": "<short id>", "burnAfterDownload": true }
```

`shareId` here is the short id before the dash in a link id.

`POST /api/getSmartShareLinks` with `{ "uid" }` lists your shares with
`stats.opens`, `stats.downloads`, `allowUploads`, `burnAfterDownload`,
`burnedAt` and `extendRequested`.

`POST /api/deleteSmartShare` with `{ "idToken", "shareId" }` removes one.

### Sort by face

`POST /api/faceGroup` with `{ "idToken", "shareId", "threshold"? }` groups a
share's photos by person. Over four images the call answers `202 { jobId }`;
poll by repeating the request with `jobId` until `state` is `"done"`.

## People

`POST /api/people`

| action   | body                        | result                                              |
| -------- | --------------------------- | --------------------------------------------------- |
| `status` | `{ idToken }`               | `{ people, available }`                             |
| `run`    | `{ idToken, threshold? }`   | `{ state: "done", people }` or `202 { jobId }`      |
| `poll`   | `{ idToken, jobId }`        | same as `run` once finished                         |
| `rename` | `{ idToken, index, name }`  | `{ names }`                                         |

`people` is `{ people: [{ photos, faceCount, face? }], names: [], sortedAt }`.

## Webhooks

Set a URL (and optional secret) on your profile. Cloud Box POSTs

```json
{ "event": "share.opened", "at": "2026-09-23T10:00:00.000Z", "data": { "shareId": "k7qx2m", "name": "Goa trip" } }
```

Events: `share.opened`, `share.downloaded`, `share.extend_requested`,
`share.guest_upload`, `share.expired`, `webhook.test`.

Headers: `X-Cloudbox-Event: <event>` and, when a secret is set,
`X-Cloudbox-Signature: sha256=<HMAC-SHA256 of the raw body>`. Verify with

```js
const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
```

Delivery is best-effort with a five second timeout and no retries.

## Maintenance

`POST /api/deleteExpiredData` purges expired shares. It is meant for a cron and
is gated on `Authorization: Bearer <CRON_SECRET>`.
