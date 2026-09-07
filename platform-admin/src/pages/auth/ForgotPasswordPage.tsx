import { PrefetchLink } from "@/components/PrefetchLink";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";

const ForgotPassowordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail("");

      navigate("/auth/forgot-password/otp", {
        state: {
          email: email,
        },
      });
    }, 2000);
  };

  return (
    <div className="w-full max-w-sm">
      <PrefetchLink
        to="/auth/login"
        prefetchModule="login"
        aria-label="Back to sign in"
        className="mb-4 inline-flex text-foreground items-center gap-2"
      >
        <ArrowLeft className="size-5" />
        Back
      </PrefetchLink>

      <h2 className="text-2xl font-bold">Forgot Password</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        We'll email a 6 digit code to your email address.
      </p>

      <form className="mt-6" onSubmit={handleSubmit}>
        <Field>
          <FieldLabel htmlFor="email">Email Address</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@platform.com"
            autoComplete="username"
            className="h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </Field>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <Button type="submit" className="mt-6 h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="size-4" />
              Sending otp..
            </>
          ) : (
            "Send OTP"
          )}
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassowordPage;
