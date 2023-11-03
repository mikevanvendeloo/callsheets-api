import request from 'supertest'
import app from '../server'

describe('Verify callsheet endpoint', () => {
  test('should return the list of callsheets that were uploaded', async () => {
    const res = await request(app).get('/api/callsheets')
    expect(res.body).toMatchSnapshot()
  })
})
