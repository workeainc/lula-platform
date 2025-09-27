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
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../../components/Loading";

const validationSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  phone: yup
    .string()
    .matches(/^[0-9]{10,15}$/, "Phone number must be between 10-15 digits")
    .required("Phone number is required"),
});

const AddUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        const res = await AccountService.getAccountById(id);
        if (!res.error) {
          reset({ name: res.data.name, phone: res.data.phone });
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, []);

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
      const res = await AccountService.updateDetails({ ...data, id });
      if (!res.error) {
        toast.success(res.message);
        navigate(-1);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Loading isLoading={isLoading}>
      <Card title={"Edit Account"} headerslot={<BackButton />}>
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
          {/* Submit Button */}
          <div className="col-span-2 text-end">
            <SubmitButton type="submit" isSubmitting={isSubmitting}>
              Update Account
            </SubmitButton>
          </div>
        </form>
      </Card>
    </Loading>
  );
};

export default AddUser;
