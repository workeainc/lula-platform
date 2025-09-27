import Textinput from "../../../components/ui/Textinput";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { handleError } from "../../../utils/functions";
// import { updateAdminPassword } from '../../../utils/firebase/auth';
import { toast } from "react-toastify";
import SubmitButton from "../../../components/ui/SubmitButton";
import AuthService from "../../../services/AuthService";

const schema = yup.object({
  currentPassword: yup.string().required("Current password is Required"),
  password: yup.string().required("New password is Required"),
  cpassword: yup.string().oneOf([yup.ref("password"), null], "Passwords must match"),
});
const Password = () => {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({ resolver: yupResolver(schema), mode: "all" });

  const onSubmit = async (data) => {
    try {
      const res = await AuthService.updatePassword(data);
      if (!res.error) {
        toast.success(res.message);
        reset()
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      handleError(error);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full p-2 md:p-4 ">
      <div className="input-area">
        <div className="input-item mb-3 md:mb-5 flex-1 ">
          <Textinput
            placeholder="Enter Your Current Password"
            label="Current Password"
            type="password"
            name={"currentPassword"}
            register={register}
            error={errors.currentPassword}
            hasicon
            isRequired
          />
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="input-item mb-3 md:mb-5 flex-1 ">
            <Textinput
              placeholder="Enter Your Password"
              label="New Password"
              type="password"
              name={"password"}
              register={register}
              error={errors.password}
              hasicon
              isRequired
            />
          </div>
          <div className="input-item mb-3 md:mb-5 flex-1">
            <Textinput
              placeholder="Confirm Your Password"
              label="Confirm Passoword"
              type="password"
              name={"cpassword"}
              register={register}
              error={errors.cpassword}
              hasicon
              isRequired
            />
          </div>
        </div>

        <div className="signin-area mb-3.5">
          <div className="flex justify-end">
            <SubmitButton isSubmitting={isSubmitting}>Update</SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Password;
