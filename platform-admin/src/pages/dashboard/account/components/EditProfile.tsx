import { PageTitle } from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAppDispatch } from "@/hooks/use-store";
import { updateUser } from "@/store/auth/authSlice";
import type { User } from "@/types";
import { type FC, useState, type ChangeEvent, type SubmitEvent } from "react";
import { Spinner } from "@/components/ui/spinner";

type EditProfileProps = {
  user: User;
};

export const EditProfile: FC<EditProfileProps> = ({ user }) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<User>(user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await dispatch(
        updateUser({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          profileImage: data.profileImage,
        }),
      ).unwrap();
      setOpen(false);
    } catch (error) {
      setError(
        typeof error === "string" ? error : "Failed to update the profile",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              placeholder="Enter email"
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={data.phone}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
          <div className="col-span-2 mt-4 flex justify-center">
            <Button
              className="black h-10"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  Saving changes...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
