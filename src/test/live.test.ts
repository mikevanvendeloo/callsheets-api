import request from 'supertest'
import app from '../server'

describe('Verify live endpoint', () => {
  test('should return the live callsheet', async () => {
    const res = await request(app).get('/api/live')
    expect(res.body).toMatchSnapshot()
  })
})
