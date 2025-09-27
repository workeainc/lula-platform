import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import Textinput from "@/components/ui/Textinput";
import SubmitButton from "../../components/ui/SubmitButton";
import logoFull from "../../assets/images/logo/logo.png";
import AdminAuthService from "../../services/AdminAuthService";
import { setUser, setToken } from "../../store/slice/auth";
import { toast } from "react-toastify";

const phoneSchema = yup
  .object({
    phoneNumber: yup
      .string()
      .required("Phone number is required")
      .matches(/^\+[1-9]\d{1,14}$/, "Invalid phone number format"),
  })
  .required();

const otpSchema = yup
  .object({
    otp: yup
      .string()
      .required("OTP is required")
      .length(6, "OTP must be 6 digits"),
  })
  .required();

const OTPLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: phone, 2: OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const phoneForm = useForm({
    resolver: yupResolver(phoneSchema),
    mode: "all",
  });

  const otpForm = useForm({
    resolver: yupResolver(otpSchema),
    mode: "all",
  });

  const handleSendOTP = async (data) => {
    setIsLoading(true);
    try {
      const res = await AdminAuthService.sendOTP(data.phoneNumber);
      if (!res.error) {
        setPhoneNumber(data.phoneNumber);
        setStep(2);
        toast.success("OTP sent successfully!");
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data) => {
    setIsLoading(true);
    try {
      const res = await AdminAuthService.verifyOTP(phoneNumber, data.otp);
      if (!res.error) {
        // Store token and user data
        AdminAuthService.setAuth(res.data.token, res.data.user);
        dispatch(setToken(res.data.token));
        dispatch(setUser({ user: res.data.user }));
        
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const res = await AdminAuthService.sendOTP(phoneNumber);
      if (!res.error) {
        toast.success("OTP resent successfully!");
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep(1);
    setPhoneNumber("");
    phoneForm.reset();
    otpForm.reset();
  };

  return (
    <div className="min-h-[100vh] flex justify-center items-center p-4 bg-gradient-to-b from-[#4158D0] to-[#C850C0]">
      <div className="bg-white min-w-full md:min-w-[500px] px-6 py-8 rounded-lg">
        <div className="flex justify-center mb-4">
          <img src={logoFull} alt="Lula Admin Logo" className="h-10" />
        </div>
        
        {step === 1 ? (
          <>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-2">
              🔐 Admin Login
            </h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
              Enter your phone number to receive OTP
            </p>
            
            <form onSubmit={phoneForm.handleSubmit(handleSendOTP)} className="space-y-4">
              <Textinput
                name="phoneNumber"
                placeholder="+1234567890"
                label="Phone Number"
                type="tel"
                register={phoneForm.register}
                error={phoneForm.formState.errors.phoneNumber}
                className="h-[48px]"
                onChange={(e) => phoneForm.setValue("phoneNumber", e.target.value)}
              />
              
              <div className="flex flex-col">
                <SubmitButton isSubmitting={isLoading}>
                  Send OTP
                </SubmitButton>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-2">
              📱 Verify OTP
            </h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
              Enter the 6-digit OTP sent to {phoneNumber}
            </p>
            
            <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
              <Textinput
                name="otp"
                placeholder="123456"
                label="OTP Code"
                type="text"
                register={otpForm.register}
                error={otpForm.formState.errors.otp}
                className="h-[48px] text-center text-2xl tracking-widest"
                maxLength={6}
                onChange={(e) => otpForm.setValue("otp", e.target.value.replace(/\D/g, ''))}
              />
              
              <div className="flex flex-col space-y-2">
                <SubmitButton isSubmitting={isLoading}>
                  Verify OTP
                </SubmitButton>
                
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Resend OTP
                </button>
                
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  disabled={isLoading}
                  className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  ← Back to phone number
                </button>
              </div>
            </form>
          </>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Admin access only. Contact system administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;
