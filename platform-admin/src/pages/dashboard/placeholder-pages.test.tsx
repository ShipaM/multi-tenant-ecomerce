import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CommissionPayoutsPage from "./commission-payouts/CommissionPayoutsPage";
import CustomersPage from "./customers/CustomersPage";
import DashboardPage from "./DashboardPage";
import DeliveryNetworkPage from "./delivery-network/DeliveryNetworkPage";
import GlobalCatalogPage from "./global-catalog/GlobalCatalogPage";
import MarketingPage from "./marketing/MarketingPage";
import OrdersPage from "./orders/OrdersPage";
import ReportsPage from "./reports/ReportsPage";
import SellersPage from "./sellers/SellersPage";
import SettingsPage from "./settings/SettingsPage";
import SupportPage from "./support/SupportPage";
import UsersPermissionsPage from "./users-permissions/UsersPermissionsPage";

describe("dashboard placeholder pages", () => {
  it.each([
    ["DashboardPage", DashboardPage],
    ["SellersPage", SellersPage],
    ["CommissionPayoutsPage", CommissionPayoutsPage],
    ["GlobalCatalogPage", GlobalCatalogPage],
    ["DeliveryNetworkPage", DeliveryNetworkPage],
    ["CustomersPage", CustomersPage],
    ["OrdersPage", OrdersPage],
    ["SupportPage", SupportPage],
    ["MarketingPage", MarketingPage],
    ["ReportsPage", ReportsPage],
    ["UsersPermissionsPage", UsersPermissionsPage],
    ["SettingsPage", SettingsPage],
  ])("%s renders its placeholder", (name, Page) => {
    render(<Page />);

    expect(screen.getByText(name)).toBeInTheDocument();
  });
});
