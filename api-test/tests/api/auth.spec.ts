import { test, expect, request } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Authentication Endpoints', () => {
  const baseUrl = 'http://localhost:8080';
  let userEmail: string;
  const userPassword = 'SecurePassword123!';
  let userToken: string;
  let userId: string; // To potentially use later for admin tests

  // Create a unique user email for each test run
  test.beforeAll(async () => {
    userEmail = faker.internet.email().toLowerCase();
  });

  // Test for user registration
  test('should register a new user', async ({ request }) => {
    const registerResponse = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        email: userEmail,
        password: userPassword,
        ConfirmPassword: userPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(registerResponse.status()).toBe(200);
    const responseBody = await registerResponse.json();

    // Ensure the response contains the expected fields
    expect(responseBody).toHaveProperty('message', 'User created successfully!');
  });

  // Test to prevent duplicate email registration
  test('should prevent registration with existing email', async ({ request }) => {
    // Use the same email from the previous test (assuming they run sequentially or within the same context)
    // If tests run in parallel, ensure a user is registered in a beforeEach
    // For this example, we rely on the beforeAll registration or previous test
    const registerResponse = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        email: userEmail, // Use the email registered in the first test
        password: 'AnotherPassword456!',
        firstName: 'Another',
        lastName: 'User',
      },
    });

    expect(registerResponse.status()).toBe(400);
    const responseBody = await registerResponse.json();
    expect(responseBody).toHaveProperty('errors');
    // Expect specific error message related to email duplication if API provides it
  });

  // Test for user login and token retrieval
  test('should login the registered user and get a token', async ({ request }) => {

    const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
      data: {
        email: userEmail,
        password: userPassword,
      },
    });

    expect(loginResponse.status()).toBe(200); // Ensure the login is successful
    const responseBody = await loginResponse.json();

    // Ensure the response contains the expected fields
    expect(responseBody).toHaveProperty('token');
    expect(typeof responseBody.token).toBe('string');
    expect(responseBody).toHaveProperty('expiration');
    expect(typeof responseBody.expiration).toBe('string'); // Assuming ISO 8601 format

    userToken = responseBody.token; // Store the token for subsequent tests
  });

  // Test to prevent login with invalid credentials
  test('should prevent login with invalid credentials', async ({ request }) => {
    const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
      data: {
        email: userEmail,
        password: 'WrongPassword!',
      },
    });

    expect(loginResponse.status()).toBe(401);
    const responseBody = await loginResponse.json();
    expect(responseBody.message).toBe('Invalid credentials.');
  });

  // Test to fetch the authenticated user's profile
  test('should get the authenticated user profile', async ({ request }) => {
    // Ensure userToken is available (from a preceding login test)
    expect(userToken, 'User token should be available after login').toBeDefined();

    const profileResponse = await request.get(`${baseUrl}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    expect(profileResponse.status()).toBe(200);
    const responseBody = await profileResponse.json();

    expect(responseBody.email).toBe(userEmail);
    expect(responseBody.firstName).toBe('Test');
    expect(responseBody.lastName).toBe('User');
    expect(responseBody.userName).toBe(userEmail);
    expect(responseBody).toHaveProperty('createdAt');
    expect(responseBody).toHaveProperty('updatedAt'); // Nullable, but property should exist
  });

  // Test to prevent fetching profile without authentication
  test('should prevent getting profile without authentication', async ({ request }) => {
    const profileResponse = await request.get(`${baseUrl}/api/auth/profile`);

    expect(profileResponse.status()).toBe(401);

  });

  // Test to update the authenticated user's profile
  test('should update the authenticated user profile', async ({ request }) => {
    // Ensure userToken is available
    expect(userToken, 'User token should be available before profile update').toBeDefined();

    const updatedFirstName = 'Updated';
    const updatedLastName = 'Profile';

    const updateResponse = await request.put(`${baseUrl}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
      data: {
        firstName: updatedFirstName,
        lastName: updatedLastName,
        email: userEmail, // Keep email the same if not testing email change
        // currentPassword is required if email is changed
      },
    });

    expect(updateResponse.status()).toBe(200);
    const responseBody = await updateResponse.json();

    // Access the nested user object in the response
    const updatedUser = responseBody.user;
    expect(updatedUser.firstName).toBe(updatedFirstName);
    expect(updatedUser.lastName).toBe(updatedLastName);
    expect(updatedUser).toHaveProperty('updatedAt');
    expect(updatedUser.updatedAt).not.toBeNull();
  });
});
