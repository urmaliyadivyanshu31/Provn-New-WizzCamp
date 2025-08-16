// Quick debug script to test the manual sync API locally
const fetch = require('node-fetch')

async function testSyncAPI() {
  try {
    console.log('🔄 Testing manual sync API...')
    
    const response = await fetch('http://localhost:3000/api/profile/sattaman/sync-videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Response status:', response.status)
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.text() // Get as text first to see if it's valid JSON
    console.log('📊 Raw response:', data)
    
    try {
      const jsonData = JSON.parse(data)
      console.log('📊 Parsed JSON:', jsonData)
    } catch (e) {
      console.log('❌ Response is not valid JSON')
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

testSyncAPI()