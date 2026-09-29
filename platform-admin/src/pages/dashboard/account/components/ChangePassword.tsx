import { PageTitle, PasswordInput, SubmitButton } from "@/components";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { useAppSelector, useAppDispatch } from "@/hooks/use-store";
import { changePassword } from "@/store/auth/authSlice";
import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";

export const ChangePassword = () => {
  const dispatch = useAppDispatch();
  const [data, setData] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [isOpen, setIsOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const isDirty =
    data.currentPassword.length > 0 &&
    data.password.length > 0 &&
    data.confirmPassword.length > 0;

  const isChangePasswordLoading = useAppSelector(
    (state) => state.auth.isChangePasswordLoading,
  );

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const misMatchPassword = data.password !== data.confirmPassword;

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (misMatchPassword) {
      setError("Password does not match");
      return;
    }

    try {
      const response = await dispatch(
        changePassword({
          currentPassword: data.currentPassword,
          password: data.password,
        }),
      ).unwrap();
      toast.success(response.message);
      setIsOpen(false);
    } catch (err) {
      const message =
        typeof err === "string" ? err : "Failed to change the password";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (nextOpen) {
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full lg:max-w-2xl min-h-28 p-4 lg:p-6">
        <PageTitle
          title="Change Password"
          classNameTitle="font-semibold"
          description="Update your password here..."
          className="mb-4"
        />
        <form
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2">
            <label htmlFor="currentPassword">Current Password</label>
            <PasswordInput
              className="h-10"
              name="currentPassword"
              id="currentPassword"
              placeholder="••••••••"
              value={data.currentPassword}
              onChange={handleOnChange}
              disabled={isChangePasswordLoading}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="new-password">New Password</label>
            <PasswordInput
              className="h-10"
              name="password"
              id="new-password"
              placeholder="••••••••"
              value={data.password}
              onChange={handleOnChange}
              disabled={isChangePasswordLoading}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <PasswordInput
              className="h-10"
              name="confirmPassword"
              id="confirmPassword"
              placeholder="••••••••"
              value={data.confirmPassword}
              onChange={handleOnChange}
              disabled={isChangePasswordLoading}
            />
          </div>
          {error && (
            <p className="col-span-2 text-sm text-destructive">{error}</p>
          )}
          <div className="col-span-2 mt-4 flex flex-col items-center gap-2">
            <SubmitButton
              loading={isChangePasswordLoading}
              loadingText="Saving changes..."
              disabled={!isDirty || misMatchPassword}
            >
              Save changes
            </SubmitButton>
            {!isChangePasswordLoading && !isDirty && (
              <p className="text-sm text-muted-foreground">
                No changes to save
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
