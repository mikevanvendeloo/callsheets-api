import request from 'supertest'
import app from '../server'

describe('Verify call sheet endpoint', () => {
  test('should return the list of call sheets that were uploaded', async () => {
    const res = await request(app).get('/api/callsheets')
    expect(res.body).toMatchSnapshot()
  })

  test('should activate call sheet', async () => {
    const res = await request(app).post('/api/callsheets').send({
      callSheetFileName: 'currentActiveCallSheet',
      currentScheduleItem: 0,
      activationTimestamp: Date.now(),
    })
    expect(res.body).toMatchSnapshot()
  })
})
