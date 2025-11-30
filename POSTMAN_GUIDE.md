# Postman API Testing Guide

This guide shows you how to test all the Firestore API endpoints using Postman.

## Base URL
```
http://localhost:3030
```

## Endpoints

### 1. Get All Products

**GET** `/api/products`

**Request:**
- Method: `GET`
- URL: `http://localhost:3030/api/products`
- Headers: None required

**Optional Query Parameters:**
- `categoryId` - Filter by category ID
- `stockStatus` - Filter by stock status (Байгаа, Захиалгаар, Дууссан)
- `cat` - Filter by category
- `subcat` - Filter by subcategory

**Examples:**
```
http://localhost:3030/api/products
http://localhost:3030/api/products?categoryId=1-1-1
http://localhost:3030/api/products?stockStatus=Байгаа
http://localhost:3030/api/products?cat=shil&subcat=hamgaalaltin
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "4Q5YusCtZhlsM0WeHgMq",
      "name": "Hamgaalaltin malgai",
      "cat": "shil",
      "subcat": "hamgaalaltin",
      ...
    }
  ],
  "count": 1
}
```

---

### 2. Get Single Product by ID

**GET** `/api/products/[id]`

**Request:**
- Method: `GET`
- URL: `http://localhost:3030/api/products/4Q5YusCtZhlsM0WeHgMq`
- Headers: None required

**Example:**
```
http://localhost:3030/api/products/4Q5YusCtZhlsM0WeHgMq
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "4Q5YusCtZhlsM0WeHgMq",
    "name": "Hamgaalaltin malgai",
    "cat": "shil",
    "subcat": "hamgaalaltin"
  }
}
```

---

### 3. Create New Product

**POST** `/api/products`

**Request:**
- Method: `POST`
- URL: `http://localhost:3030/api/products`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
```json
{
  "name": "Test Product",
  "description": "This is a test product",
  "price": "1000",
  "stock": "50",
  "categoryId": "1-1-1",
  "category": "Хувь хүнийг хамгаалах хувцас хэрэгсэл / Толгойн хамгаалалт / Малгай, каск",
  "brand": "Test Brand",
  "color": "Улаан",
  "size": "M",
  "style": "Classic",
  "stockStatus": "Байгаа"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-document-id",
    "name": "Test Product",
    "description": "This is a test product",
    "price": 1000,
    "stock": 50,
    "categoryId": "1-1-1",
    "category": "Хувь хүнийг хамгаалах хувцас хэрэгсэл / Толгойн хамгаалалт / Малгай, каск",
    "brand": "Test Brand",
    "color": "Улаан",
    "size": "M",
    "style": "Classic",
    "stockStatus": "Байгаа",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. Update Product

**PUT** `/api/products/[id]`

**Request:**
- Method: `PUT`
- URL: `http://localhost:3030/api/products/4Q5YusCtZhlsM0WeHgMq`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": "1500",
  "stock": "30",
  "categoryId": "1-1-1",
  "category": "Хувь хүнийг хамгаалах хувцас хэрэгсэл / Толгойн хамгаалалт / Малгай, каск",
  "brand": "Updated Brand",
  "color": "Цэнхэр",
  "size": "L",
  "style": "Modern",
  "stockStatus": "Захиалгаар"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "4Q5YusCtZhlsM0WeHgMq",
    "name": "Updated Product Name",
    "description": "Updated description",
    "price": 1500,
    "stock": 30,
    "categoryId": "1-1-1",
    "category": "Хувь хүнийг хамгаалах хувцас хэрэгсэл / Толгойн хамгаалалт / Малгай, каск",
    "brand": "Updated Brand",
    "color": "Цэнхэр",
    "size": "L",
    "style": "Modern",
    "stockStatus": "Захиалгаар",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. Delete Product

**DELETE** `/api/products/[id]`

**Request:**
- Method: `DELETE`
- URL: `http://localhost:3030/api/products/4Q5YusCtZhlsM0WeHgMq`
- Headers: None required

**Expected Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### 6. Test Firebase Connection

**GET** `/api/test-firebase`

**Request:**
- Method: `GET`
- URL: `http://localhost:3030/api/test-firebase`
- Headers: None required

**Expected Response:**
```json
{
  "success": true,
  "message": "Firebase Admin is connected successfully",
  "productsCount": 1,
  "firestoreConnected": true
}
```

---

## Postman Setup Instructions

### Step 1: Create a New Collection
1. Open Postman
2. Click "New" → "Collection"
3. Name it "Bayanundur Admin API"

### Step 2: Add Environment Variables (Optional)
1. Click "Environments" → "Create Environment"
2. Add variable:
   - Variable: `base_url`
   - Initial Value: `http://localhost:3030`
3. Save the environment

### Step 3: Create Requests

For each endpoint above:
1. Click "New" → "HTTP Request"
2. Select the method (GET, POST, PUT, DELETE)
3. Enter the URL (or use `{{base_url}}/api/products` if using environment)
4. For POST/PUT: 
   - Go to "Body" tab
   - Select "raw"
   - Select "JSON" from dropdown
   - Paste the JSON body
5. Click "Send"

### Step 4: Save to Collection
- Click "Save" and select your collection

---

## Quick Test Checklist

✅ **Test 1:** GET all products
- URL: `http://localhost:3030/api/products`
- Should return list of products

✅ **Test 2:** GET single product
- URL: `http://localhost:3030/api/products/4Q5YusCtZhlsM0WeHgMq`
- Replace with actual product ID from Test 1

✅ **Test 3:** POST create product
- Method: POST
- Body: Use the example JSON above
- Should return new product with ID

✅ **Test 4:** PUT update product
- Method: PUT
- URL: Use ID from Test 3
- Body: Modified JSON
- Should return updated product

✅ **Test 5:** DELETE product
- Method: DELETE
- URL: Use ID from Test 3
- Should return success message

✅ **Test 6:** Test Firebase connection
- URL: `http://localhost:3030/api/test-firebase`
- Should confirm Firebase is connected

---

## Common Issues

### Issue: Connection Refused
**Solution:** Make sure your Next.js dev server is running:
```bash
npm run dev
```

### Issue: 404 Not Found
**Solution:** Check the URL is correct and includes `/api/`

### Issue: 500 Internal Server Error
**Solution:** 
- Check server console for error details
- Verify Firebase Admin is initialized
- Check `permissions.json` file exists

### Issue: CORS Error
**Solution:** This shouldn't happen with Next.js API routes, but if it does, check your Next.js configuration

---

## Example Postman Collection JSON

You can import this into Postman:

```json
{
  "info": {
    "name": "Bayanundur Admin API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Products",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3030/api/products",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3030",
          "path": ["api", "products"]
        }
      }
    },
    {
      "name": "Get Product by ID",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3030/api/products/:id",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3030",
          "path": ["api", "products", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "4Q5YusCtZhlsM0WeHgMq"
            }
          ]
        }
      }
    },
    {
      "name": "Create Product",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test Product\",\n  \"description\": \"This is a test product\",\n  \"price\": \"1000\",\n  \"stock\": \"50\",\n  \"categoryId\": \"1-1-1\",\n  \"category\": \"Хувь хүнийг хамгаалах хувцас хэрэгсэл / Толгойн хамгаалалт / Малгай, каск\",\n  \"brand\": \"Test Brand\",\n  \"color\": \"Улаан\",\n  \"size\": \"M\",\n  \"style\": \"Classic\",\n  \"stockStatus\": \"Байгаа\"\n}"
        },
        "url": {
          "raw": "http://localhost:3030/api/products",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3030",
          "path": ["api", "products"]
        }
      }
    },
    {
      "name": "Update Product",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Updated Product Name\",\n  \"description\": \"Updated description\",\n  \"price\": \"1500\",\n  \"stock\": \"30\",\n  \"categoryId\": \"1-1-1\",\n  \"category\": \"Хувь хүнийг хамгаалах хувцас хэрэгсэл / Толгойн хамгаалалт / Малгай, каск\",\n  \"brand\": \"Updated Brand\",\n  \"color\": \"Цэнхэр\",\n  \"size\": \"L\",\n  \"style\": \"Modern\",\n  \"stockStatus\": \"Захиалгаар\"\n}"
        },
        "url": {
          "raw": "http://localhost:3030/api/products/:id",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3030",
          "path": ["api", "products", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "4Q5YusCtZhlsM0WeHgMq"
            }
          ]
        }
      }
    },
    {
      "name": "Delete Product",
      "request": {
        "method": "DELETE",
        "header": [],
        "url": {
          "raw": "http://localhost:3030/api/products/:id",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3030",
          "path": ["api", "products", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "4Q5YusCtZhlsM0WeHgMq"
            }
          ]
        }
      }
    },
    {
      "name": "Test Firebase Connection",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3030/api/test-firebase",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3030",
          "path": ["api", "test-firebase"]
        }
      }
    }
  ]
}
```

Save this as a `.json` file and import it into Postman using "Import" → "Upload Files".

