export interface ApiResponse<T = any> {
  code: number
  data: T | null
  message: string
}
