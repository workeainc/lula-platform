import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import Textinput from "@/components/ui/Textinput";
import { handleError } from "../../utils/functions";
// import axiosInstance from "../../configs/axios.config";
import SubmitButton from "../../components/ui/SubmitButton";
// import { setAuth } from "../../store/slice/auth";
import logoFull from "../../assets/images/logo/logo.png";
import AuthService from "../../services/AuthService";
import { setUser, setToken } from "../../store/slice/auth";
import { toast } from "react-toastify";
const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup.string().required("Password is Required"),
  })
  .required();
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const onSubmit = async (data) => {
    try {
      const res = await AuthService.login(data.email, data.password);
      if (!res.error) {
        // Store token and user data
        dispatch(setToken(res.data.token));
        dispatch(setUser({ user: res.data.user }));
        
        // Also store in localStorage for persistence
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        navigate("/dashboard");
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <>
      <div className="min-h-[100vh] flex justify-center items-center p-4  bg-gradient-to-b  from-[#4158D0] to-[#C850C0]">
        <div className="bg-white min-w-full md:min-w-[500px] px-6 py-8 rounded-lg">
          <div className="flex justify-center mb-4">
            <img src={logoFull} alt="SOV-O Logo" className="h-10" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-2">
            👋 Welcome Back
          </h2>
          <p className="text-gray-500 text-sm mb-6 text-center">Enter the details below to continue to the portal</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
            <Textinput
              name="email"
              placeholder="Enter Your Email..."
              label="email"
              type="email"
              register={register}
              error={errors.email}
              className="h-[48px]"
              onChange={(e) => setValue("email", e.target.value)}
            />
            <Textinput
              name="password"
              label="passwrod"
              type="password"
              placeholder="Enter Your Password..."
              register={register}
              error={errors.password}
              className="h-[48px]"
              hasicon={true}
              onChange={(e) => setValue("password", e.target.value)}
            />
            <div className="flex justify-between">
              <Link to="/forgot-password" className="text-sm text-slate-800 dark:text-slate-400 leading-6 font-medium">
                Forgot Password?{" "}
              </Link>
            </div>

            <div className="flex flex-col">
              <SubmitButton isSubmitting={isSubmitting}>Login</SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
