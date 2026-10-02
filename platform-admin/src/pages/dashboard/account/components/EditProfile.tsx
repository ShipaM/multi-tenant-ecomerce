import { PageTitle, SubmitButton } from "@/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { updateUser } from "@/store/auth/thunks";
import type { User } from "@/types";
import { type FC, useState, type ChangeEvent, type SubmitEvent } from "react";
import { toast } from "sonner";

type EditProfileProps = {
  user: User;
};

export const EditProfile: FC<EditProfileProps> = ({ user }) => {
  const dispatch = useAppDispatch();
  const isUpdateUserLoading = useAppSelector(
    (state) => state.auth.isUpdateUserLoading,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<User>(user);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    data.fullName !== user.fullName ||
    data.email !== user.email ||
    data.phone !== user.phone ||
    data.profileImage !== user.profileImage;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await dispatch(
        updateUser({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          profileImage: data.profileImage,
        }),
      ).unwrap();
      toast.success(response.message);
      setIsOpen(false);
    } catch (err) {
      const message =
        typeof err === "string" ? err : "Failed to update the profile";
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
          setData(user);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer" variant="outline">
          Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full lg:max-w-2xl min-h-28 p-4 lg:p-6">
        <PageTitle
          title="Edit profile"
          classNameTitle="font-semibold"
          description="Update your profile details"
        />
        <form className="my-3 grid gap-3 grid-cols-2" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={data.fullName}
              type="text"
              disabled={isUpdateUserLoading}
              placeholder="Enter full name"
              className="h-10"
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              className="h-10"
              value={data.email}
              type="text"
              name="email"
              disabled={isUpdateUserLoading}
              placeholder="Enter email"
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={data.phone}
              disabled={isUpdateUserLoading}
              className="h-10"
              type="text"
              onChange={handleChange}
              name="phone"
              placeholder="Enter phone"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profileImage">Profile image</Label>
            <Input
              id="profileImage"
              value={data.profileImage}
              disabled={isUpdateUserLoading}
              className="h-10"
              type="text"
              placeholder="Please enter new photo url"
              name="profileImage"
              onChange={handleChange}
            />
          </div>
          {error && (
            <p className="col-span-2 text-sm text-destructive">{error}</p>
          )}
          <div className="col-span-2 mt-4 flex flex-col items-center gap-2">
            <SubmitButton
              loading={isUpdateUserLoading}
              loadingText="Saving changes..."
              disabled={!isDirty}
            >
              Save changes
            </SubmitButton>
            {!isUpdateUserLoading && !isDirty && (
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
