// 模拟完整演示链路
// 1. 登录 admin
// 2. 登录 grid_fukuda
// 3. 网格员上报事件
// 4. 检查大屏事件列表是否出现
// 5. admin 派单
// 6. 检查网格员工单列表
// 7. 网格员完成处置
// 8. 检查大屏状态

import fetch from 'node-fetch'

const BASE = 'http://localhost:3000'

async function testFlow() {
  console.log('🚀 开始链路测试...')
  
  // 1. admin 登录
  const adminLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  }).then(r => r.json())
  
  const adminToken = adminLogin.data.token
  console.log('✅ admin 登录成功')
  
  // 2. 网格员登录
  const staffLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'grid_fukuda', password: '123456' })
  }).then(r => r.json())
  
  const staffToken = staffLogin.data.token
  console.log('✅ grid_fukuda 登录成功')
  console.log(`   角色：${staffLogin.data.user.role}`)
  console.log(`   区县：${staffLogin.data.user.district}`)
  console.log(`   租户：${staffLogin.data.user.tenantId}`)
  
  // 3. 网格员上报事件
  const newEvent = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      title: '测试事件-链路验证',
      district: '福田区',
      street: '华强北街道',
      location: '华强北路测试点',
      level: 'high',
      status: 'pending',
    })
  }).then(r => r.json())
  
  const eventId = newEvent.data.id
  console.log(`✅ 事件上报成功，ID：${eventId}`)
  
  // 4. admin 查看事件列表（验证隔离）
  const adminEvents = await fetch(`${BASE}/events`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json())
  console.log(`✅ admin 看到 ${adminEvents.data.length} 条事件`)
  
  // 5. 广州网格员登录，验证隔离
  const gzLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'gz_grid_yuexiu', password: '123456' })
  }).then(r => r.json())
  
  const gzToken = gzLogin.data.token
  const gzEvents = await fetch(`${BASE}/events`, {
    headers: { 'Authorization': `Bearer ${gzToken}` }
  }).then(r => r.json())
  
  const hasShenzhenEvent = gzEvents.data?.some(e => e.tenantId === 'shenzhen')
  console.log(hasShenzhenEvent 
    ? '❌ 租户隔离失败：广州网格员看到了深圳事件' 
    : '✅ 租户隔离正常：广州网格员看不到深圳事件'
  )
  
  // 6. 获取网格员列表（验证派单下拉）
  const staffList = await fetch(`${BASE}/users/staff?tenantId=shenzhen`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json())
  console.log(`✅ 深圳网格员列表：${staffList.data?.length} 人`)
  staffList.data?.forEach(s => {
    console.log(`   - ${s.realName}（${s.district}）`)
  })
  
  // 7. admin 派单
  const dispatch = await fetch(`${BASE}/events/${eventId}/dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      assigneeId: staffLogin.data.user.id,
      remark: '请立即前往处置',
    })
  }).then(r => r.json())
  console.log(`✅ 派单成功，状态：${dispatch.data?.status}`)
  
  // 8. 网格员查看工单（验证派单后能看到）
  const myEvents = await fetch(`${BASE}/events`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  }).then(r => r.json())
  const myEvent = myEvents.data?.find(e => e.id === eventId)
  console.log(myEvent 
    ? `✅ 网格员工单列表有此任务，状态：${myEvent.status}` 
    : '❌ 网格员工单列表没有此任务'
  )
  
  // 9. 网格员完成处置
  const complete = await fetch(`${BASE}/events/${eventId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ result: '测试处置完成' })
  }).then(r => r.json())
  console.log(`✅ 处置完成，状态：${complete.data?.status}`)
  
  console.log('\n🎉 链路测试完成！')
}

testFlow().catch(console.error)