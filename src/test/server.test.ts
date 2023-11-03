import request from 'supertest'
import app from '../server'

describe('Verify health endpoint', () => {
  test('Health endpoint', async () => {
    const res = await request(app).get('/')
    expect(res.body).toMatchSnapshot()
  })
})
