# Translator App - Detailed Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Application Flow](#application-flow)
- [API Endpoints](#api-endpoints)
- [Workflow to API Mapping](#workflow-to-api-mapping)
- [Security Implementation](#security-implementation)
- [File Management](#file-management)
- [Error Handling](#error-handling)
- [Deployment Considerations](#deployment-considerations)

## Project Overview
A concise description of the application’s purpose and functionality.

The Translator App is a comprehensive translation service application that facilitates document translations between different languages. The application follows a user-admin workflow where users can submit translation requests and administrators manage these requests through a review and delivery process.

## System Architecture
An overview of the system layers and their interactions.

The application follows a clean N-layered architecture pattern:

1. **Controller Layer** - Handles HTTP requests/responses and user interaction
2. **Service Layer** - Contains business logic and orchestrates operations
3. **Data Layer** - Manages data persistence using Entity Framework Core

### Technology Stack
- .NET 9.0
- C# Programming Language
- ASP.NET Core Web API
- Entity Framework Core for data access
- SQL Server database
- JWT Authentication
- ASP.NET Core Identity for user management
- XUnit for unit testing

## Database Schema
Details of the database entities and relationships.

### Entity Relationship Diagram

```
+-------------------+       +----------------------+
| ApplicationUser   |       | TranslationRequest   |
+-------------------+       +----------------------+
| Id (PK)           |<----->| Id (PK)              |
| UserName          |       | Title                |
| Email             |       | Description          |
| FirstName         |       | SourceLanguage       |
| LastName          |       | TargetLanguage       |
| CreatedAt         |       | OriginalFileName     |
| UpdatedAt         |       | StoredFileName       |
| ...               |       | TranslatedFileName   |
| (Identity fields) |       | Status               |
+-------------------+       | AdminComment         |
                            | UserComment          |
                            | CreatedAt            |
                            | UpdatedAt            |
                            | CompletedAt          |
                            | UserId (FK)          |
                            +----------------------+
```

### Key Entities

#### ApplicationUser
Extends the IdentityUser class to add custom user properties:
- FirstName: User's first name
- LastName: User's last name
- CreatedAt: When the user account was created
- UpdatedAt: When the user profile was last updated

#### TranslationRequest
Represents a translation request with the following properties:
- Id: Unique identifier (GUID)
- Title: Short name for the translation request
- Description: Detailed description of the translation
- SourceLanguage: The language of the original document
- TargetLanguage: The language to translate to
- OriginalFileName: The name of the uploaded file
- StoredFileName: The file name used for server storage
- TranslatedFileName: The file name of the translated document
- Status: Current status of the request (Pending, Approved, Completed, Rejected, Resubmitted)
- AdminComment: Comments from the administrator
- UserComment: Comments from the user
- CreatedAt: When the request was created
- UpdatedAt: When the request was last updated
- CompletedAt: When the translation was completed
- UserId: Foreign key to ApplicationUser

#### TranslationStatus (Enum)
Represents the possible states of a translation request:
- Pending (0): Initial state, awaiting admin review
- Approved (1): Request approved, translation in progress
- Completed (2): Translation finished and available
- Rejected (3): Request declined by admin
- Resubmitted (4): Request updated and resubmitted after rejection

## Application Flow

### User Workflow

1. **Registration & Authentication**
   - User registers with email, password, and personal details
   - User logs in to receive JWT token for authentication
   - User can update their profile information

2. **Translation Request Management**
   - User submits a new translation request:
     - Provides title, description, source and target languages
     - Uploads document for translation (allowed formats: txt, doc, docx, pdf)
     - Maximum file size: 10MB
   - User views list of their translation requests
   - User checks status of individual requests
   - User can edit pending or rejected requests
   - User can delete pending or rejected requests
   - User can download their original documents
   - User can download completed translations

3. **Handling Rejected Requests**
   - User receives notification with admin comments about rejection
   - User updates rejected request with requested changes
   - User provides comment explaining the changes made
   - User can optionally upload a new file
   - User resubmits the request for review

### Admin Workflow

1. **Request Management**
   - Admin views list of all translation requests in the system
   - Admin reviews request details and downloads original documents
   - Admin approves requests to mark them in progress
   - Admin rejects requests with mandatory comments explaining the reason
   - Admin uploads translated documents for completed requests
   - Admin can provide additional comments with completed translations

2. **User Management**
   - Admin views list of all users
   - Admin can view user details
   - Admin can update user information

## API Endpoints
Comprehensive reference of all API operations with request and response details.

### Common Headers and Responses

#### Common Request Headers
- **Authorization**: Bearer {JWT token} - Required for authenticated endpoints
- **Content-Type**: application/json - For endpoints accepting JSON payloads
- **Content-Type**: multipart/form-data - For endpoints handling file uploads

#### Common Error Responses
- **400 Bad Request**: Validation failed or request data is incorrect
  ```json
  {
    "type": "http://tools.ietf.org/html/rfc7231#section-6.5.1",
    "title": "Bad Request",
    "status": 400,
    "errors": {
      "PropertyName": ["Error description"]
    }
  }
  ```
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "type": "http://tools.ietf.org/html/rfc7235#section-3.1",
    "title": "Unauthorized",
    "status": 401,
    "detail": "Invalid authentication token"
  }
  ```
- **403 Forbidden**: Valid authentication but insufficient permissions
  ```json
  {
    "type": "http://tools.ietf.org/html/rfc7231#section-6.5.3",
    "title": "Forbidden",
    "status": 403,
    "detail": "Insufficient permissions to access this resource"
  }
  ```
- **404 Not Found**: Resource does not exist
  ```json
  {
    "type": "http://tools.ietf.org/html/rfc7231#section-6.5.4",
    "title": "Not Found",
    "status": 404,
    "detail": "The requested resource was not found"
  }
  ```
- **500 Internal Server Error**: Unexpected server error
  ```json
  {
    "type": "http://tools.ietf.org/html/rfc7231#section-6.6.1",
    "title": "Internal Server Error",
    "status": 500,
    "detail": "An error occurred while processing your request"
  }
  ```

### Authentication Endpoints

#### Register User
- **Description**: Creates a new user account with the provided information

Sample Request:
```bash
curl -X POST "http://api.yourdomain.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePassword123!","firstName":"John","lastName":"Doe"}'
```

- **Response** (200 OK): User details excluding sensitive information
  ```json
  {
    "id": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "userName": "user@example.com",
    "createdAt": "2025-04-27T10:30:00Z"
  }
  ```
- **Possible Errors**:
  - 400 Bad Request: Email already in use, password too weak, required fields missing
- **Effects**: Creates a new user in the database with User role

#### Login
- **Description**: Authenticates a user and provides a JWT token for subsequent requests

Sample Request:
```bash
curl -X POST "http://api.yourdomain.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePassword123!"}'
```

- **Response** (200 OK): JWT token with expiration time
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiration": "2025-04-27T12:00:00Z"
  }
  ```
- **Possible Errors**:
  - 400 Bad Request: Required fields missing
  - 401 Unauthorized: Invalid credentials
- **Effects**: Authenticates user and generates a JWT token valid for a limited time

#### Get User Profile
- **Description**: Retrieves the current authenticated user's profile details
- **URL**: `/api/auth/profile`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {token}
- **Response** (200 OK): User profile information
  ```json
  {
    "id": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "userName": "user@example.com",
    "createdAt": "2025-04-27T10:30:00Z",
    "updatedAt": "2025-04-27T11:45:00Z"
  }
  ```
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
- **Effects**: Read-only operation, no database changes

#### Update User Profile
- **Description**: Updates the current authenticated user's profile information
- **URL**: `/api/auth/profile`
- **Method**: `PUT`
- **Headers**: 
  - Authorization: Bearer {token}
  - Content-Type: application/json
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "currentPassword": "CurrentPassword123!" // Required for email changes
  }
  ```
- **Response** (200 OK): Updated user profile
  ```json
  {
    "id": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
    "email": "john.smith@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "userName": "john.smith@example.com",
    "createdAt": "2025-04-27T10:30:00Z",
    "updatedAt": "2025-04-27T15:20:00Z"
  }
  ```
- **Possible Errors**:
  - 400 Bad Request: Email already in use, required fields missing, current password invalid
  - 401 Unauthorized: Invalid token
- **Effects**: Updates user's profile information in the database

### User Translation Request Endpoints

#### Create Translation Request
- **Description**: Creates a new translation request with an uploaded file

Sample Request (HTTPie):
```bash
http --form POST "http://api.yourdomain.com/api/translationrequest" \
  Authorization:"Bearer $TOKEN" \
  title="Business Contract Translation" \
  description="Legal business contract that needs translation" \
  sourceLanguage="English" \
  targetLanguage="Spanish" \
  file@contract.pdf \
  userComment="Please preserve the legal terminology"
```

- **Response** (201 Created): Created translation request details
  ```json
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Business Contract Translation",
    "description": "Legal business contract that needs translation",
    "sourceLanguage": "English",
    "targetLanguage": "Spanish",
    "originalFileName": "contract.pdf",
    "status": "Pending",
    "userComment": "Please preserve the legal terminology",
    "createdAt": "2025-04-27T16:00:00Z",
    "userId": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d"
  }
  ```
- **Possible Errors**:
  - 400 Bad Request: Required fields missing, file size too large, unsupported file format
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have sufficient permissions
- **Effects**: 
  - Creates a new translation request in the database
  - Saves the uploaded file to storage with a unique filename
  - Sets request status to Pending

#### Get User's Translation Requests
- **Description**: Retrieves a list of all translation requests created by the current user
- **URL**: `/api/translationrequest`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {token}
- **Response** (200 OK): Array of translation request objects
  ```json
  [
    {
      "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "Business Contract Translation",
      "description": "Legal business contract that needs translation",
      "sourceLanguage": "English",
      "targetLanguage": "Spanish",
      "originalFileName": "contract.pdf",
      "status": "Pending",
      "createdAt": "2025-04-27T16:00:00Z"
    },
    {
      "id": "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
      "title": "Technical Manual Translation",
      "description": "Product manual for international markets",
      "sourceLanguage": "English",
      "targetLanguage": "Japanese",
      "originalFileName": "manual.docx",
      "status": "Approved",
      "createdAt": "2025-04-26T14:30:00Z",
      "updatedAt": "2025-04-27T09:15:00Z"
    }
  ]
  ```
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
- **Effects**: Read-only operation, no database changes

#### Get Single Translation Request
- **Description**: Retrieves detailed information about a specific translation request
- **URL**: `/api/translationrequest/{id}`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {token}
- **Parameters**: id (GUID) - The translation request ID
- **Response** (200 OK): Detailed translation request information
  ```json
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Business Contract Translation",
    "description": "Legal business contract that needs translation",
    "sourceLanguage": "English",
    "targetLanguage": "Spanish",
    "originalFileName": "contract.pdf",
    "storedFileName": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d_contract.pdf",
    "translatedFileName": null,
    "status": "Pending",
    "adminComment": null,
    "userComment": "Please preserve the legal terminology",
    "createdAt": "2025-04-27T16:00:00Z",
    "updatedAt": null,
    "completedAt": null,
    "userId": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d"
  }
  ```
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User trying to access another user's request (non-admin)
  - 404 Not Found: Request with specified ID doesn't exist
- **Effects**: Read-only operation, no database changes

#### Update Translation Request
- **Description**: Updates information about an existing translation request
- **URL**: `/api/translationrequest/{id}`
- **Method**: `PUT`
- **Headers**: 
  - Authorization: Bearer {token}
  - Content-Type: application/json
- **Parameters**: id (GUID) - The translation request ID
- **Request Body**:
  ```json
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Updated Contract Translation",
    "description": "Legal business contract requiring certified translation",
    "sourceLanguage": "English",
    "targetLanguage": "Spanish",
    "userComment": "Please ensure legal terminology is correctly translated"
  }
  ```
- **Response** (200 OK): Updated translation request details
  ```json
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Updated Contract Translation",
    "description": "Legal business contract requiring certified translation",
    "sourceLanguage": "English",
    "targetLanguage": "Spanish",
    "originalFileName": "contract.pdf",
    "status": "Pending",
    "userComment": "Please ensure legal terminology is correctly translated",
    "createdAt": "2025-04-27T16:00:00Z",
    "updatedAt": "2025-04-28T10:15:00Z"
  }
  ```
- **Possible Errors**:
  - 400 Bad Request: Required fields missing, ID mismatch
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User trying to update another user's request
  - 404 Not Found: Request with specified ID doesn't exist or cannot be updated
- **Effects**: 
  - Updates the translation request in the database
  - Sets updatedAt timestamp to current time
  - Cannot update requests that are already Approved or Completed

#### Delete Translation Request
- **Description**: Removes a translation request from the system
- **URL**: `/api/translationrequest/{id}`
- **Method**: `DELETE`
- **Headers**: Authorization: Bearer {token}
- **Parameters**: id (GUID) - The translation request ID
- **Response** (204 No Content): Empty response on success
- **Possible Errors**:
  - 400 Bad Request: Request cannot be deleted (wrong status)
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User trying to delete another user's request
  - 404 Not Found: Request with specified ID doesn't exist
- **Effects**:
  - Deletes the translation request from the database
  - Deletes the associated file from storage
  - Only Pending or Rejected requests can be deleted

#### Download Original File
- **Description**: Downloads the original document that was submitted for translation
- **URL**: `/api/translationrequest/{id}/download-original`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {token}
- **Parameters**: id (GUID) - The translation request ID
- **Response** (200 OK): File download stream
  - Content-Type: Based on file type (application/pdf, application/msword, etc.)
  - Content-Disposition: attachment; filename=original_filename.ext
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User trying to download another user's file
  - 404 Not Found: Request or file doesn't exist
- **Effects**: Read-only operation, no database changes

#### Download Translated File
- **Description**: Downloads the translated document for a completed translation request
- **URL**: `/api/translationrequest/{id}/download-translated`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {token}
- **Parameters**: id (GUID) - The translation request ID
- **Response** (200 OK): File download stream
  - Content-Type: Based on file type (application/pdf, application/msword, etc.)
  - Content-Disposition: attachment; filename=Translated_original_filename.ext
- **Possible Errors**:
  - 400 Bad Request: Translation is not completed
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User trying to download another user's file
  - 404 Not Found: Request or translated file doesn't exist
- **Effects**: Read-only operation, no database changes

#### Resubmit Rejected Request
- **Description**: Updates and resubmits a previously rejected translation request
- **URL**: `/api/translationrequest/{id}/resubmit`
- **Method**: `POST`
- **Headers**: 
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data
- **Parameters**: id (GUID) - The translation request ID
- **Form Fields**:
  - `userComment`: String (required) - Explanation of changes addressing rejection reason
  - `file`: File (optional, max 10MB) - New document to translate (txt, doc, docx, pdf)
- **Response** (200 OK): Updated translation request details
  ```json
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Updated Contract Translation",
    "description": "Legal business contract requiring certified translation",
    "sourceLanguage": "English",
    "targetLanguage": "Spanish",
    "originalFileName": "updated_contract.pdf", // If file was changed
    "status": "Resubmitted",
    "userComment": "I've fixed the formatting issues as requested",
    "adminComment": "Please fix the formatting issues on pages 3-5",
    "createdAt": "2025-04-27T16:00:00Z",
    "updatedAt": "2025-04-28T14:45:00Z"
  }
  ```
- **Possible Errors**:
  - 400 Bad Request: Required comment missing, file format invalid
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User trying to resubmit another user's request
  - 404 Not Found: Request doesn't exist or cannot be resubmitted (not in Rejected status)
- **Effects**:
  - Updates the translation request status to Resubmitted
  - Updates userComment field
  - If new file provided, stores the new file and updates filenames
  - Sets updatedAt timestamp to current time

### Admin Translation Management Endpoints

#### Get All Translation Requests
- **Description**: Retrieves a list of all translation requests in the system
- **URL**: `/api/admin/translation`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {admin token}
- **Response** (200 OK): Array of all translation requests with user information
  ```json
  [
    {
      "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "Business Contract Translation",
      "description": "Legal business contract that needs translation",
      "sourceLanguage": "English",
      "targetLanguage": "Spanish",
      "originalFileName": "contract.pdf",
      "status": "Pending",
      "createdAt": "2025-04-27T16:00:00Z",
      "userId": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
      "user": {
        "id": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john.smith@example.com"
      }
    },
    // More translation requests...
  ]
  ```
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
- **Effects**: Read-only operation, no database changes

#### Get Translation Request Details
- **Description**: Retrieves detailed information about a specific translation request
- **URL**: `/api/admin/translation/{id}`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {admin token}
- **Parameters**: id (GUID) - The translation request ID
- **Response** (200 OK): Detailed translation request with user information
  ```json
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Business Contract Translation",
    "description": "Legal business contract that needs translation",
    "sourceLanguage": "English",
    "targetLanguage": "Spanish",
    "originalFileName": "contract.pdf",
    "storedFileName": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d_contract.pdf",
    "translatedFileName": null,
    "status": "Pending",
    "adminComment": null,
    "userComment": "Please preserve the legal terminology",
    "createdAt": "2025-04-27T16:00:00Z",
    "updatedAt": null,
    "completedAt": null,
    "userId": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
    "user": {
      "id": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com"
    }
  }
  ```
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
  - 404 Not Found: Request with specified ID doesn't exist
- **Effects**: Read-only operation, no database changes

#### Approve Translation Request
- **Description**: Approves a translation request, changing its status to Approved
- **URL**: `/api/admin/translation/{id}/approve`
- **Method**: `POST`
- **Headers**: 
  - Authorization: Bearer {admin token}
  - Content-Type: application/json
- **Parameters**: id (GUID) - The translation request ID
- **Request Body**:
  ```json
  {
    "comment": "Approved for translation to begin"
  }
  ```
- **Response** (200 OK): Updated translation request details
  ```json
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Business Contract Translation",
    "description": "Legal business contract that needs translation",
    "sourceLanguage": "English",
    "targetLanguage": "Spanish",
    "originalFileName": "contract.pdf",
    "status": "Approved",
    "adminComment": "Approved for translation to begin",
    "userComment": "Please preserve the legal terminology",
    "createdAt": "2025-04-27T16:00:00Z",
    "updatedAt": "2025-04-28T09:30:00Z"
  }
  ```
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
  - 404 Not Found: Request with specified ID doesn't exist or cannot be approved
- **Effects**:
  - Updates request status to Approved
  - Sets adminComment field if provided
  - Sets updatedAt timestamp to current time

#### Reject Translation Request
- **Description**: Rejects a translation request, requiring admin to provide a reason
- **URL**: `/api/admin/translation/{id}/reject`
- **Method**: `POST`
- **Headers**: 
  - Authorization: Bearer {admin token}
  - Content-Type: application/json
- **Parameters**: id (GUID) - The translation request ID
- **Request Body**:
  ```json
  {
    "comment": "Rejected because file is corrupted. Please upload a valid file."
  }
  ```
- **Response** (200 OK): Updated translation request details
  ```json
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Business Contract Translation",
    "description": "Legal business contract that needs translation",
    "sourceLanguage": "English",
    "targetLanguage": "Spanish",
    "originalFileName": "contract.pdf",
    "status": "Rejected",
    "adminComment": "Rejected because file is corrupted. Please upload a valid file.",
    "userComment": "Please preserve the legal terminology",
    "createdAt": "2025-04-27T16:00:00Z",
    "updatedAt": "2025-04-28T09:30:00Z"
  }
  ```
- **Possible Errors**:
  - 400 Bad Request: Comment is missing (required for rejection)
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
  - 404 Not Found: Request with specified ID doesn't exist or cannot be rejected
- **Effects**:
  - Updates request status to Rejected
  - Sets adminComment field with rejection reason
  - Sets updatedAt timestamp to current time

#### Complete Translation Request
- **Description**: Completes a translation request by uploading the translated file
- **URL**: `/api/admin/translation/{id}/complete`
- **Method**: `POST`
- **Headers**: 
  - Authorization: Bearer {admin token}
  - Content-Type: multipart/form-data
- **Parameters**: id (GUID) - The translation request ID
- **Form Fields**:
  - `file`: File (required, max 10MB) - The translated file (txt, doc, docx, pdf)
  - `adminComment`: String (optional) - Additional comments on the translation
- **Response** (200 OK): Updated translation request details
  ```json
  {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Business Contract Translation",
    "description": "Legal business contract that needs translation",
    "sourceLanguage": "English",
    "targetLanguage": "Spanish",
    "originalFileName": "contract.pdf",
    "translatedFileName": "Translated_contract.pdf",
    "status": "Completed",
    "adminComment": "Translation completed with all legal terminology preserved.",
    "userComment": "Please preserve the legal terminology",
    "createdAt": "2025-04-27T16:00:00Z",
    "updatedAt": "2025-04-30T15:45:00Z",
    "completedAt": "2025-04-30T15:45:00Z"
  }
  ```
- **Possible Errors**:
  - 400 Bad Request: File is missing or invalid format
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
  - 404 Not Found: Request doesn't exist or cannot be completed (not in Approved status)
- **Effects**:
  - Updates request status to Completed
  - Stores the translated file and updates translatedFileName
  - Sets adminComment field if provided
  - Sets updatedAt and completedAt timestamps to current time

#### Download Original File (Admin)
- **Description**: Downloads the original document submitted for translation
- **URL**: `/api/admin/translation/{id}/download-original`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {admin token}
- **Parameters**: id (GUID) - The translation request ID
- **Response** (200 OK): File download stream
  - Content-Type: Based on file type (application/pdf, application/msword, etc.)
  - Content-Disposition: attachment; filename=original_filename.ext
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
  - 404 Not Found: Request or file doesn't exist
- **Effects**: Read-only operation, no database changes

#### Download Translated File (Admin)
- **Description**: Downloads the translated document for a completed translation request
- **URL**: `/api/admin/translation/{id}/download-translated`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {admin token}
- **Parameters**: id (GUID) - The translation request ID
- **Response** (200 OK): File download stream
  - Content-Type: Based on file type (application/pdf, application/msword, etc.)
  - Content-Disposition: attachment; filename=Translated_original_filename.ext
- **Possible Errors**:
  - 400 Bad Request: Translation is not completed
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
  - 404 Not Found: Request or translated file doesn't exist
- **Effects**: Read-only operation, no database changes

### Admin User Management Endpoints

#### Get All Users
- **Description**: Retrieves a list of all users in the system
- **URL**: `/api/auth/users`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {admin token}
- **Response** (200 OK): Array of all user accounts
  ```json
  [
    {
      "id": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
      "email": "john.smith@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "userName": "john.smith@example.com",
      "roles": ["User"],
      "createdAt": "2025-04-27T10:30:00Z"
    },
    {
      "id": "7e6d5c4b-3a2a-1b0c-9d8e-7f6a5b4c3d2e",
      "email": "admin@translator.com",
      "firstName": "Admin",
      "lastName": "User",
      "userName": "admin@translator.com",
      "roles": ["User", "Admin"],
      "createdAt": "2025-04-25T09:00:00Z"
    }
    // More users...
  ]
  ```
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
- **Effects**: Read-only operation, no database changes

#### Get User By ID
- **Description**: Retrieves detailed information about a specific user
- **URL**: `/api/auth/users/{id}`
- **Method**: `GET`
- **Headers**: Authorization: Bearer {admin token}
- **Parameters**: id (string) - The user ID
- **Response** (200 OK): Detailed user information
  ```json
  {
    "id": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
    "email": "john.smith@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "userName": "john.smith@example.com",
    "roles": ["User"],
    "createdAt": "2025-04-27T10:30:00Z",
    "updatedAt": "2025-04-28T14:15:00Z"
  }
  ```
- **Possible Errors**:
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
  - 404 Not Found: User with specified ID doesn't exist
- **Effects**: Read-only operation, no database changes

#### Update User (Admin)
- **Description**: Updates user information and role assignments
- **URL**: `/api/auth/users/{id}`
- **Method**: `PUT`
- **Headers**: 
  - Authorization: Bearer {admin token}
  - Content-Type: application/json
- **Parameters**: id (string) - The user ID
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "roles": ["User", "Admin"]
  }
  ```
- **Response** (200 OK): Updated user information
  ```json
  {
    "id": "8f7e6d5c-4b3a-2a1b-0c9d-8e7f6a5b4c3d",
    "email": "john.smith@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "userName": "john.smith@example.com",
    "roles": ["User", "Admin"],
    "createdAt": "2025-04-27T10:30:00Z",
    "updatedAt": "2025-04-30T11:20:00Z"
  }
  ```
- **Possible Errors**:
  - 400 Bad Request: Email already in use by another user, invalid role
  - 401 Unauthorized: Invalid token
  - 403 Forbidden: User doesn't have Admin role
  - 404 Not Found: User with specified ID doesn't exist
- **Effects**:
  - Updates user profile information
  - Updates user role assignments
  - Sets updatedAt timestamp to current time

## Workflow to API Mapping

This section maps the application workflows to the specific API endpoints, helping to understand how the frontend UI would interact with the backend API.

### User Workflow Mapping

#### 1. User Registration and Authentication Flow
1. **Create Account**
   - Endpoint: [POST /api/auth/register](#register-user)
   - Data needed: Email, password, first name, last name
   - Next step: Redirect to login

2. **Login to System**
   - Endpoint: [POST /api/auth/login](#login)
   - Data needed: Email, password
   - Result: Receive JWT token for authentication
   - Next step: Store token and redirect to dashboard

3. **View/Edit Profile**
   - Get profile: [GET /api/auth/profile](#get-user-profile)
   - Update profile: [PUT /api/auth/profile](#update-user-profile)
   - Data needed for update: First name, last name, email (optional: current password)

### 2. Translation Request Submission Flow
1. **Create New Translation Request**
   - Endpoint: [POST /api/translationrequest](#create-translation-request)
   - Data needed: Title, description, source language, target language, file upload
   - Next step: Redirect to user's request list
2. **View All My Requests**
   - Endpoint: [GET /api/translationrequest](#get-users-translation-requests)
   - Result: List of all requests with status information
   - Next step: User can select a request to view details
3. **View Request Details**
   - Endpoint: [GET /api/translationrequest/{id}](#get-single-translation-request)
   - Data needed: Request ID
   - Result: Detailed information about the request
   - Next step: Download files, edit, or delete based on status
4. **Download Original Document**
   - Endpoint: [GET /api/translationrequest/{id}/download-original](#download-original-file)
   - Data needed: Request ID
   - Result: File download
5. **Download Translated Document** (if completed)
   - Endpoint: [GET /api/translationrequest/{id}/download-translated](#download-translated-file)
   - Data needed: Request ID
   - Result: Translated file download
   - Conditions: Only available if request status is Completed

### 3. Managing Existing Requests Flow
1. **Edit Pending Request**
   - Endpoint: [PUT /api/translationrequest/{id}](#update-translation-request)
   - Data needed: Request ID, updated fields
   - Conditions: Only works for Pending or Rejected requests
   - Next step: View updated request details
2. **Delete Request**
   - Endpoint: [DELETE /api/translationrequest/{id}](#delete-translation-request)
   - Data needed: Request ID
   - Conditions: Only works for Pending or Rejected requests
   - Next step: Redirect to request list
3. **Handle Rejected Request**
   - View rejection reason: [GET /api/translationrequest/{id}](#get-single-translation-request)
   - Resubmit with changes: [POST /api/translationrequest/{id}/resubmit](#resubmit-rejected-request)
   - Data needed: Request ID, explanation comment, optional new file
   - Next step: Request moves to Resubmitted status

### Admin Workflow Mapping

#### 1. Request Management Flow
1. **View All Translation Requests**
   - Endpoint: [GET /api/admin/translation](#get-all-translation-requests)
   - Result: List of all requests in the system
   - Next step: Select a request to manage
2. **Review Request Details**
   - Endpoint: [GET /api/admin/translation/{id}](#get-translation-request-details)
   - Data needed: Request ID
   - Result: Detailed request information with user details
   - Next step: Download original file, approve, reject, or complete
3. **Download Original Document**
   - Endpoint: [GET /api/admin/translation/{id}/download-original](#download-original-file-admin)
   - Data needed: Request ID
   - Result: File download
   - Next step: Review content for translation
4. **Approve Request**
   - Endpoint: [POST /api/admin/translation/{id}/approve](#approve-translation-request)
   - Data needed: Request ID, optional comment
   - Result: Request status changes to Approved
   - Next step: Begin actual translation work
5. **Reject Request**
   - Endpoint: [POST /api/admin/translation/{id}/reject](#reject-translation-request)
   - Data needed: Request ID, rejection reason (comment)
   - Result: Request status changes to Rejected
   - Next step: User will need to address issues and resubmit
6. **Complete Translation**
   - Endpoint: [POST /api/admin/translation/{id}/complete](#complete-translation-request)
   - Data needed: Request ID, translated file upload, optional comment
   - Result: Request status changes to Completed
   - Next step: User can now download the translated file

#### 2. User Management Flow
1. **View All Users**
   - Endpoint: [GET /api/auth/users](#get-all-users)
   - Result: List of all users in the system
   - Next step: Select a user to view or edit
2. **View User Details**
   - Endpoint: [GET /api/auth/users/{id}](#get-user-by-id)
   - Data needed: User ID
   - Result: Detailed user information
   - Next step: Edit user if needed
3. **Update User Information/Roles**
   - Endpoint: [PUT /api/auth/users/{id}](#update-user-admin)
   - Data needed: User ID, updated fields, role assignments
   - Result: User information and roles updated

## Security Implementation

### Authentication
- JWT token-based authentication
- Token expiration and refresh mechanism
- Password hashing using ASP.NET Core Identity

### Authorization
- Role-based access control with User and Admin roles
- Endpoint protection with appropriate Authorize attributes
- Owner-based resource access for users' translation requests

## File Management

Files are stored securely with the following safeguards:
- Original filenames are preserved for user experience
- Files are stored with unique generated names to prevent conflicts
- File types are restricted to .txt, .doc, .docx, and .pdf
- Maximum file size is limited to 10MB
- Files are served with appropriate content types for download

## Error Handling

The application implements comprehensive error handling:
- Validation errors return appropriate 400 Bad Request responses
- Authentication failures return 401 Unauthorized
- Authorization failures return 403 Forbidden
- Not found resources return 404 Not Found
- Server errors return 500 Internal Server Error with minimal details to avoid exposing sensitive information

## Deployment Considerations

- Use HTTPS in production
- Configure proper CORS policies
- Set up database connection strings in environment variables
- Configure JWT secret and token validity in environment variables
- Implement appropriate logging for monitoring and debugging
- Set up proper file storage location with backups