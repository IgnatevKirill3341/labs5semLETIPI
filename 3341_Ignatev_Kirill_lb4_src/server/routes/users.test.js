import request from 'supertest';
import express from 'express';
import usersRouter from './users.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users API', () => {

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by id', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('email');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/999')
        .expect(404);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        firstName: 'New',
        lastName: 'User',
        email: `newuser${Date.now()}@example.com`,
        role: 'user',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe(newUser.firstName);
      expect(response.body.email).toBe(newUser.email);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update an existing user', async () => {
      const updatedData = {
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/users/1')
        .send(updatedData)
        .expect(200);

      expect(response.body.firstName).toBe(updatedData.firstName);
      expect(response.body.email).toBe(updatedData.email);
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .put('/api/users/999')
        .send({ firstName: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      await request(app)
        .delete('/api/users/1')
        .expect(200);

      // Verify user is deleted
      await request(app)
        .get('/api/users/1')
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .delete('/api/users/999')
        .expect(404);
    });
  });
});

