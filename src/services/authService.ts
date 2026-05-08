import axiosInstance from "./axiosInstance";

export const registerUser = async (email: string, password: string) => {
  const response = await axiosInstance.post("/api/auth/register", {
    email,
    password,
  });

  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const response = await axiosInstance.post("/api/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axiosInstance.get("/api/auth/me");

  return response.data;
};