import axios from "axios";
import type { AxiosResponse } from "axios";
import { useAuthStore } from "@/store/authStore";

interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

const request = axios.create({
  baseURL: "/scc/zcy-platform-api",
  timeout: 10000,
});

// 请求拦截器：自动带 token；super_admin 切换租户时带 tenantId
request.interceptors.request.use((config) => {
  const token = localStorage.getItem("zcy_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // super_admin 切换了租户时，GET 请求自动带 tenantId 参数
  // 其他角色的 tenantId 由后端从 JWT 里取，不需要前端传
  const { user, currentTenantId } = useAuthStore.getState();
  if (user?.role === "super_admin" && currentTenantId) {
    config.params = {
      ...config.params,
      tenantId: currentTenantId,
    };
  }

  return config;
});

// 响应拦截器
request.interceptors.response.use(
  (res: AxiosResponse<ApiResponse>) => {
    // 后端统一响应格式 { code, data, message }
    if (res.data && typeof res.data === "object" && "code" in res.data) {
      if (res.data.code === 0) {
        return { ...res, data: res.data.data } as AxiosResponse;
      }
      // 业务错误（非 0 但 HTTP 200）
      return Promise.reject(new Error(res.data.message || "请求失败"));
    }

    // 兼容不是统一格式的接口
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const url = (err.config?.url as string | undefined) ?? "";

    // 登录接口 401（账号/密码错误等）应由页面自行展示错误，不要强制跳转/刷新
    if (status === 401 && url.includes("/auth/login")) {
      // passthrough
    } else if (status === 401) {
      localStorage.removeItem("zcy_token");
      localStorage.removeItem("zcy_user");

      // HashRouter：只改 hash，不刷新整页
      if (window.location.hash !== "#/login") {
        window.location.hash = "#/login";
      }
    }
    const backendMsg = err.response?.data?.message;
    if (backendMsg) err.message = backendMsg;
    return Promise.reject(err);
  }
);

export default request;
