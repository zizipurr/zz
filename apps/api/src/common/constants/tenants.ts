export const TENANTS = [
  {
    id: 'shenzhen',
    name: '深圳市',
    center: { lng: 114.0579, lat: 22.5431 },
    districts: [
      '福田区', '南山区', '龙华区', '宝安区',
      '罗湖区', '盐田区', '龙岗区', '坪山区',
      '光明区', '大鹏新区',
    ],
  },
  {
    id: 'guangzhou',
    name: '广州市',
    center: { lng: 113.2644, lat: 23.1291 },
    districts: [
      '越秀区', '天河区', '海珠区', '荔湾区',
      '白云区', '黄埔区', '番禺区', '花都区',
      '南沙区', '从化区', '增城区',
    ],
  },
] as const

export type TenantId = 'shenzhen' | 'guangzhou'
