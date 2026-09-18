import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UserAvatar } from "./UserAvatar";
import type { User } from "@/types";

const baseUser: User = {
  id: "u1",
  email: "jane@example.com",
  fullName: "Jane Doe",
  userType: "PLATFORM_ADMIN",
  phone: "555-0100",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarName: "JD",
};

describe("UserAvatar", () => {
  it("renders the user's initials as a fallback", () => {
    render(<UserAvatar user={baseUser} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("does not blow up when there is no user yet", () => {
    render(<UserAvatar user={null} />);

    expect(document.querySelector('[data-slot="avatar"]')).toBeInTheDocument();
  });

  it("applies a custom class name to the avatar root", () => {
    render(<UserAvatar user={baseUser} className="size-10" />);

    expect(document.querySelector('[data-slot="avatar"]')).toHaveClass(
      "size-10",
    );
  });
});
