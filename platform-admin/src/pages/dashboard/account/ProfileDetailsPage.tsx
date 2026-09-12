import { PageTitle } from "@/components/PageTitle";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { useAppSelector } from "@/hooks/use-store";
import { EditProfile } from "./components";

const ProfileDetailsPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  return (
    <div>
      <PageTitle
        title="My account"
        description="Your profile, password, two-factor authentication, and where you're signed in"
      />

      <div className="space-y-4 space-x-4 mt-4 lg:mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          <div className="col-span-1 lg:col-span-2">
            <Card className="p-4 lg:p-6">
              <div className="flex justify-between gap-4">
                <div className="flex items-start gap-4">
                  <UserAvatar user={user} className="w-14 h-14" />
                  <div>
                    <div className="text-semibold text-lg">
                      {user?.fullName}
                    </div>
                    <div className="bg-primary/30 text-primary font-medium py-1 px-2 text-sm rounded-full">
                      {user?.userType}
                    </div>
                  </div>
                </div>
                <div>{user && <EditProfile user={user} />}</div>
              </div>
              <div className="border-b"></div>

              <div className="grid gap-3">
                <div className="flex justify-between items-center gap-3">
                  <label>Email</label>
                  <div>{user?.email}</div>
                </div>
                <div className="border-b"></div>
                <div className="flex justify-between items-center gap-3">
                  <label>Phone</label>
                  <div>{user?.phone}</div>
                </div>
              </div>
            </Card>
          </div>
          <div>
            <Card></Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailsPage;
