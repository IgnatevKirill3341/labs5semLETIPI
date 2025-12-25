import request from 'supertest';
import express from 'express';
import newsRouter from './news.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/news', newsRouter);

describe('News API', () => {

  describe('GET /api/news', () => {
    it('should return all news', async () => {
      const response = await request(app)
        .get('/api/news')
        .expect(200);

      expect(response.body).toHaveProperty('news');
      expect(Array.isArray(response.body.news)).toBe(true);
    });

    it('should filter news by userId', async () => {
      const response = await request(app)
        .get('/api/news?userId=1')
        .expect(200);

      expect(response.body.news.every(n => n.authorId === 1)).toBe(true);
    });

    it('should sort news by date (newest first)', async () => {
      const response = await request(app)
        .get('/api/news')
        .expect(200);

      if (response.body.news.length > 1) {
        const dates = response.body.news.map(n => new Date(n.createdAt));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
        }
      }
    });
  });

  describe('GET /api/news/:id', () => {
    it('should return a news item by id', async () => {
      const response = await request(app)
        .get('/api/news/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
    });

    it('should return 404 for non-existent news', async () => {
      await request(app)
        .get('/api/news/999')
        .expect(404);
    });
  });

  describe('POST /api/news', () => {
    it('should create a new news item', async () => {
      const newNews = {
        authorId: 1,
        title: 'New News',
        content: 'New content',
        isActive: true
      };

      const response = await request(app)
        .post('/api/news')
        .send(newNews)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newNews.title);
      expect(response.body.content).toBe(newNews.content);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should default isActive to true if not provided', async () => {
      const newNews = {
        authorId: 1,
        title: `News without active flag ${Date.now()}`,
        content: 'Content'
      };

      const response = await request(app)
        .post('/api/news')
        .send(newNews)
        .expect(201);

      expect(response.body.isActive).toBe(true);
    });
  });

  describe('PUT /api/news/:id', () => {
    it('should update an existing news item', async () => {
      const updatedData = {
        title: 'Updated News',
        content: 'Updated content'
      };

      const response = await request(app)
        .put('/api/news/1')
        .send(updatedData)
        .expect(200);

      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.content).toBe(updatedData.content);
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 for non-existent news', async () => {
      await request(app)
        .put('/api/news/999')
        .send({ title: 'Test' })
        .expect(404);
    });
  });

  describe('PATCH /api/news/:id/toggle', () => {
    it('should toggle news status', async () => {
      const initialResponse = await request(app)
        .get('/api/news/1')
        .expect(200);

      const initialStatus = initialResponse.body.isActive;

      const toggleResponse = await request(app)
        .patch('/api/news/1/toggle')
        .expect(200);

      expect(toggleResponse.body.isActive).toBe(!initialStatus);
      expect(toggleResponse.body).toHaveProperty('updatedAt');
    });

    it('should return 404 for non-existent news', async () => {
      await request(app)
        .patch('/api/news/999/toggle')
        .expect(404);
    });
  });

  describe('DELETE /api/news/:id', () => {
    it('should delete a news item', async () => {
      await request(app)
        .delete('/api/news/1')
        .expect(200);

      // Verify news is deleted
      await request(app)
        .get('/api/news/1')
        .expect(404);
    });

    it('should return 404 for non-existent news', async () => {
      await request(app)
        .delete('/api/news/999')
        .expect(404);
    });
  });
});

