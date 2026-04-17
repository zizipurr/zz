const MAP_KEY = '3UHBZ-4TUKW-3BFRN-3S6ZZ-BFMKV-ZQFD5'

export interface GeoAddress {
  district: string  // 区县，如"福田区"
  street: string    // 街道，如"华强北街道"
  detail: string    // 完整地址描述
}

/**
 * 坐标逆地理编码（腾讯地图）
 * 失败时 resolve 空对象，不阻断业务流程
 */
export function reverseGeocode(lat: number, lng: number): Promise<Partial<GeoAddress>> {
  return new Promise((resolve) => {
    uni.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${lat},${lng}`,
        key: MAP_KEY,
        output: 'json',
      },
      success: (res: any) => {
        const result = res.data?.result
        if (!result) { resolve({}); return }
        const addr = result.address_component
        resolve({
          district: addr?.district ?? '',
          street: addr?.street ?? '',
          detail: result.address ?? '',
        })
      },
      fail: () => resolve({}),
    })
  })
}
