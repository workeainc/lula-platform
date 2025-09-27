
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Card from "../../../components/ui/Card";
import BackButton from "../../../components/ui/BackButton";
import Textinput from "../../../components/ui/Textinput";
import SubmitButton from "../../../components/ui/SubmitButton";
import { handleError } from "../../../utils/functions";
import { toast } from "react-toastify";
import AccountService from "../../../services/AccountService";

const validationSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  phone: yup
    .string()
    .matches(/^[0-9]{10,15}$/, "Phone number must be between 10-15 digits")
    .required("Phone number is required"),
  password: yup.string().required("Password is required").min(6, "Password must be at least 6 characters"),
});

const AddUser = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onSubmit = async (data) => {
    try {
      const res= await AccountService.create(data)
      if (!res.error) {
        toast.success(res.message);
        reset();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Card title={"Create Account"} headerslot={<BackButton />}>
      <form onSubmit={handleSubmit(onSubmit)} className="md:grid grid-cols-2 gap-4 space-y-4 md:space-y-0">
        <Textinput
          name={"name"}
          error={errors.name}
          label={"Name"}
          register={register}
          placeholder="Enter full name"
          type={"text"}
          isRequired
          msgTooltip
          onChange={(e) => setValue("name", e.target.value)}
        />
        <Textinput
          name={"email"}
          error={errors.email}
          label={"Email"}
          register={register}
          placeholder="Enter email address"
          type={"email"}
          isRequired
          msgTooltip
          onChange={(e) => setValue("email", e.target.value)}
        />
        <Textinput
          name={"phone"}
          error={errors.phone}
          label={"Phone"}
          register={register}
          placeholder="Enter phone number"
          type={"tel"}
          isRequired
          msgTooltip
          onChange={(e) => setValue("phone", e.target.value)}
        />
        <Textinput
          name={"password"}
          error={errors.password}
          label={"Password"}
          register={register}
          placeholder="Enter password"
          type={"password"}
          isRequired
          msgTooltip
          hasicon
          onChange={(e) => setValue("password", e.target.value)}
        />
        
        {/* Submit Button */}
        <div className="col-span-2 text-end">
          <SubmitButton type="submit" isSubmitting={isSubmitting}>
            Create Account
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
};

export default AddUser;
