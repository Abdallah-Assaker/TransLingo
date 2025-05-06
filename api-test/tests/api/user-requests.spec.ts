import { test, expect, request } from '@playwright/test';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

test.describe('User Translation Request Endpoints', () => {
  const baseUrl = 'http://localhost:8080';
  let userToken: string;
  // let registeredUserId: string;
  let createdRequestId: string; // To store ID of a created request

  // Setup a user before running tests
  test.beforeAll(async ({ request }) => {
    const userEmail = faker.internet.email().toLowerCase();
    const userPassword = 'SecurePassword123!';

    // Register user
    const registerResponse = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        email: userEmail,
        password: userPassword,
        ConfirmPassword: userPassword,
        firstName: 'Request',
        lastName: 'Tester',
      },
    });
    expect(registerResponse.status()).toBe(200);
    const userData = await registerResponse.json();
    // registeredUserId = userData.id;

    // Login user to get token
    const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
      data: {
        email: userEmail,
        password: userPassword,
      },
    });
    expect(loginResponse.status()).toBe(200);
    const authData = await loginResponse.json();
    userToken = authData.token;

    console.log(`User setup completed. Token available.`);
  });

  // Test to create a new translation request with file upload
  test('should create a new translation request with file upload', async ({ request }) => {
    expect(userToken, 'User token is required to create request').toBeDefined();


    const filePath = path.join(__dirname, 'report.pdf');
    const fileBuffer = fs.readFileSync(filePath);

    // 2. Send multipart/form-data
    const createResponse = await request.post(`${baseUrl}/api/translationrequest`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Accept': '*/*',
      },
      multipart: {
        title: 'Test Document',
        description: 'This is a test document for translation.',
        sourceLanguage: 'English',
        targetLanguage: 'French',
        userComment: 'Please translate carefully',
        File: {
          name: path.basename(filePath),
          mimeType: 'application/pdf',
          buffer: fileBuffer,
        },
      },
    });

    expect(createResponse.status()).toBe(201);
    const responseBody = await createResponse.json();

    expect(responseBody).toHaveProperty('id');
    expect(typeof responseBody.id).toBe('string');
    expect(responseBody.title).toBe('Test Document');
    expect(responseBody.description).toBe('This is a test document for translation.');
    expect(responseBody.sourceLanguage).toBe('English');
    expect(responseBody.targetLanguage).toBe('French');
    expect(responseBody.originalFileName).toBe('report.pdf'); // Assuming filename from upload
    expect(responseBody.userComment).toBe('Please translate carefully');
    expect(responseBody).toHaveProperty('createdAt');

    // Store the request ID for subsequent tests
    createdRequestId = responseBody.id;
  });

  // Test to fetch the list of user's translation requests
  test('should get the list of user\'s translation requests', async ({ request }) => {
    expect(userToken, 'User token is required to get requests').toBeDefined();

    const listResponse = await request.get(`${baseUrl}/api/translationrequest`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    expect(listResponse.status()).toBe(200);
    const responseBody = await listResponse.json();

    expect(Array.isArray(responseBody)).toBe(true);
    // Check if the previously created request is in the list
    const foundRequest = responseBody.find((req: any) => req.id === createdRequestId);
    expect(foundRequest).toBeDefined();
    expect(foundRequest?.title).toBe('Test Document'); // Basic check
  });

  // Test to fetch details of a specific translation request
  test('should get details of a specific translation request', async ({ request }) => {
    expect(userToken, 'User token is required to get request details').toBeDefined();
    expect(createdRequestId, 'Request ID must be available').toBeDefined();

    const detailsResponse = await request.get(`${baseUrl}/api/translationrequest/${createdRequestId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    expect(detailsResponse.status()).toBe(200);
    const responseBody = await detailsResponse.json();

    expect(responseBody.id).toBe(createdRequestId);
    expect(responseBody.title).toBe('Test Document');
    expect(responseBody).toHaveProperty('storedFileName'); // Should be populated by the API
    expect(responseBody).toHaveProperty('translatedFileName'); // Should be null initially
    expect(responseBody).toHaveProperty('adminComment'); // Should be null initially
    expect(responseBody).toHaveProperty('completedAt'); // Should be null initially
  });

  // Test to update a pending translation request
  test('should update a pending translation request', async ({ request }) => {
    expect(userToken, 'User token is required to update request').toBeDefined();
    expect(createdRequestId, 'Request ID must be available').toBeDefined();

    const updatedTitle = 'Updated Test Document';
    const updatedUserComment = 'Revised comments';

    const updateResponse = await request.put(`${baseUrl}/api/translationrequest/${createdRequestId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        id: createdRequestId,
        title: updatedTitle,
        description: 'Updated description',
        sourceLanguage: 'English',
        targetLanguage: 'French',
        userComment: updatedUserComment,
      },
    });

    expect(updateResponse.status()).toBe(200);
    const responseBody = await updateResponse.json();

    expect(responseBody.id).toBe(createdRequestId);
    expect(responseBody.title).toBe(updatedTitle);
    expect(responseBody.userComment).toBe(updatedUserComment);
    expect(responseBody).toHaveProperty('updatedAt');
    expect(responseBody.updatedAt).not.toBeNull();
  });

  // Test to delete a pending translation request
  test('should delete a pending translation request', async ({ request }) => {
    expect(userToken, 'User token is required to delete request').toBeDefined();

    // Create a *new* request specifically for deletion, as the previous one is updated
    const filePath = path.join(__dirname, 'report.pdf');
    const fileStream = fs.createReadStream(filePath);

    const createResponse = await request.post(`${baseUrl}/api/translationrequest`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
      multipart: {
        title: 'Request to Delete',
        description: 'This request will be deleted.',
        sourceLanguage: 'German',
        targetLanguage: 'Spanish',
        file: fileStream,
      },
    });
    expect(createResponse.status()).toBe(201);
    const requestToDeleteId = (await createResponse.json()).id;

    const deleteResponse = await request.delete(`${baseUrl}/api/translationrequest/${requestToDeleteId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    expect(deleteResponse.status()).toBe(204); // No content response

    // Verify it's gone by trying to get it
    const verifyResponse = await request.get(`${baseUrl}/api/translationrequest/${requestToDeleteId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
    });
    expect(verifyResponse.status()).toBe(404);
  });

  // Test to download the original file of a translation request
  test('should download the original file', async ({ request }) => {
    expect(userToken, 'User token is required to download original file').toBeDefined();
    expect(createdRequestId, 'Request ID must be available').toBeDefined();

    const downloadResponse = await request.get(`${baseUrl}/api/translationrequest/${createdRequestId}/download-original`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    expect(downloadResponse.status()).toBe(200);
    expect(downloadResponse.headers()['content-type']).toContain('application/');
    expect(downloadResponse.headers()['content-disposition']).toContain('attachment');
    expect(downloadResponse.headers()['content-disposition']).toContain("report.pdf");
  });
});