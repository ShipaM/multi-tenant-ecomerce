import { PageTitle, UserAvatar } from "@/components";
import { Card } from "@/components/ui/card";
import { useAppSelector } from "@/hooks/use-store";
import {
  EditProfile,
  ChangePassword,
  TwoFactorAuthentication,
  SessionsList,
} from "./components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import moment from "moment";

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
          <div className="col-span-1 lg:col-span-2 grid gap-4 lg:gap-8">
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
            <Card className="p-4 lg:p-6">
              <PageTitle
                title="Password & Security"
                classNameTitle="font-medium text-base"
                description="Manage your password and two-factor authentication"
              />
              <div className="grid gap-3">
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <div>Password</div>
                    <p className="text-xs text-muted-foreground">
                      {moment(user?.passwordUpdatedAt)
                        .startOf("seconds")
                        .fromNow()}
                    </p>
                  </div>
                  <ChangePassword />
                </div>
                <div className="border-b"></div>
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <div>Two-factor authentication</div>
                    <p className="text-xs text-muted-foreground">
                      Extra code required at login, in addition to your password
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        user?.twoFactorEnabled ? "default" : "destructive"
                      }
                      className={
                        user?.twoFactorEnabled
                          ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-400"
                          : ""
                      }
                    >
                      {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    {user && <TwoFactorAuthentication user={user} />}
                  </div>
                </div>
              </div>
            </Card>
            <SessionsList />
          </div>
          <div>
            <Card className="p-4 lg:p-6">
              <PageTitle
                title="Role & Access"
                classNameTitle="font-medium text-base"
                description="Update your profile details"
              />
              <div className="grid gap-3">
                <div className="flex justify-between items-center gap-3">
                  <label>Role</label>
                  <div>{user?.role?.name ?? "-"}</div>
                </div>
              </div>
              <p className="text-xs font-accent">
                Full acccess to every module -stores, catalog, payouts,
                delivery, network, and platform settings.
              </p>
              <Button variant="link" className="cursor-pointer">
                View permission matrix <ArrowRight />
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailsPage;
