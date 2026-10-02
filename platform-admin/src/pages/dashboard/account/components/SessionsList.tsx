import { PageTitle, SubmitButton } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import {
  fetchSessionsList,
  revokeOtherSessions,
  revokeSession,
} from "@/store/auth/thunks";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const SessionsList = () => {
  const [isRevokingSession, setIsRevokingSession] = useState(false);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const sessions = useAppSelector((state) => state.auth.sessions);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSessionsList());
  }, []);

  const isSessionsLoading = useAppSelector(
    (state) => state.auth.isSessionsLoading,
  );

  const handleRevokeSession = async (sessionId: string) => {
    setIsRevokingSession(true);
    try {
      const response = await dispatch(revokeSession({ sessionId })).unwrap();

      if (response.success) {
        toast.success("Session revoked");
        dispatch(fetchSessionsList());
        setRevokeTargetId(null);
      }
    } catch (err) {
      // keep the dialog open so the user can retry
      toast.error(
        typeof err === "string" ? err : "Failed to revoke the session",
      );
    } finally {
      setIsRevokingSession(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setIsRevokingOthers(true);
    try {
      const response = await dispatch(revokeOtherSessions()).unwrap();

      if (response.success) {
        toast.success("Other sessions signed out");
        dispatch(fetchSessionsList());
      }
    } catch (err) {
      toast.error(
        typeof err === "string" ? err : "Failed to sign out other sessions",
      );
    } finally {
      setIsRevokingOthers(false);
    }
  };

  return (
    <Card className="p-4 lg:p-6 h-full">
      <PageTitle
        title="Active sessions"
        classNameTitle="font-medium text-base"
        description={`${sessions.length} device${sessions.length === 1 ? "" : "s"} signed in`}
        className="flex w-full items-baseline justify-between gap-4"
      />
      <div>
        {isSessionsLoading ? (
          <div className="flex items-center justify-center min-h-20">
            <Spinner className="size-10" />
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {sessions.map((session, index) => (
              <div
                className={cn(
                  "flex w-full justify-between gap-4 lg:gap-6 my-4",
                  index !== sessions.length - 1 && "border-b pb-4",
                )}
                key={session.sessionId}
              >
                <div>
                  <div className="font-semibold">
                    {session.os}/{session.browser}
                  </div>
                  <p>
                    {session.isCurrent
                      ? "Active now"
                      : moment(session.lastActiveAt)
                          .startOf("seconds")
                          .fromNow()}
                  </p>
                </div>
                <div>
                  {session.isCurrent ? (
                    <Badge className="">This device</Badge>
                  ) : (
                    <Dialog
                      open={revokeTargetId === session.sessionId}
                      onOpenChange={(nextOpen) => {
                        if (!isRevokingSession) {
                          setRevokeTargetId(
                            nextOpen ? session.sessionId : null,
                          );
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">Revoke</Button>
                      </DialogTrigger>
                      <DialogContent className="w-full lg:max-w-2xl min-h-28 p-4 lg:p-6">
                        <PageTitle title="Revoke session" description="" />
                        <p>Do you want to revoke this session?</p>
                        <DialogFooter className="flex items-center sm:justify-center justify-center">
                          <Button
                            variant="outline"
                            className="black h-10"
                            onClick={() => setRevokeTargetId(null)}
                            disabled={isRevokingSession}
                          >
                            Cancel
                          </Button>
                          <SubmitButton
                            onClick={() =>
                              handleRevokeSession(session.sessionId)
                            }
                            loading={isRevokingSession}
                            loadingText="Revoking..."
                          >
                            Confirm
                          </SubmitButton>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <SubmitButton
        onClick={handleRevokeOtherSessions}
        loading={isRevokingOthers}
        loadingText="Signing out..."
        className="mt-4 mr-auto"
      >
        Sign out all other sessions
      </SubmitButton>
    </Card>
  );
};
