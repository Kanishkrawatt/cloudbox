# CloudBox API Documentation

It is possible to use the API to create and manage the resources used by the application. The API is available at the following address: `/api`.
It is RESTful and uses the following HTTP methods:
`GET` `POST` `PUT` `DELETE`.

## Base URL

`https://cloudbox.kanishkrawatt.tech/api`

## Authentication

Authentication is required for accessing CloudBox API endpoints. You need to include an API key in the header of each request.

API requests must be authenticated using a token that can be obtained from [Here](/profile). The token must be sent in the `Authorization` header of the request.

```js
Authorization: Bearer <your_api_key>
```

## Endpoints
### 1. **Get Images**

Retrieves a list of images stored in CloudBox.

- **Endpoint**: `/getImages`
- **Method**: `GET`
- **Response**:
  - Status: 200 OK
  - Content: JSON array of image objects, each containing metadata about the image

### 2. **Get Files**

Retrieves a list of files stored in CloudBox.

- **Endpoint**: `/getFiles`
- **Method**: `GET`
- **Response**:
  - Status: 200 OK
  - Content: JSON array of file objects, each containing metadata about the file

### 3. **Delete Items**

Deletes a specific item from the storage.

- **Endpoint**: `/deleteItem`
- **Method**: `DELETE`
- **Parameters**:
  - `data: [itemurl]`: Url of the item to be deleted
- **Response**:
  - Status: 200 OK
  - Content: JSON object with a success message

