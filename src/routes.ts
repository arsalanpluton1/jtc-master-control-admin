export type RouteKey =
  | "stores"
  | "stations"
  | "inventory"
  | "recipes"
  | "products"
  | "inventory-requests"
  | "store-manager"
  | "store-employees";

export type AppRoute = {
  key: RouteKey;
  path: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  area: "Admin" | "Store Manager";
};

export const appRoutes: AppRoute[] = [
  {
    key: "stores",
    path: "/stores",
    label: "Stores",
    eyebrow: "Store Operations",
    title: "Stores",
    description: "Maintain locations, operating details, and store-level configuration.",
    area: "Admin",
  },
  {
    key: "stations",
    path: "/stations",
    label: "Stations",
    eyebrow: "Production Setup",
    title: "Stations",
    description: "Prepare station definitions for recipe flow, availability, and fulfillment.",
    area: "Admin",
  },
  {
    key: "inventory",
    path: "/inventory",
    label: "Inventory",
    eyebrow: "Stock Control",
    title: "Inventory",
    description: "Track ingredients, stock levels, and movement across JTC stores.",
    area: "Admin",
  },
  {
    key: "recipes",
    path: "/recipes",
    label: "Recipes",
    eyebrow: "Kitchen Control",
    title: "Recipes",
    description: "Manage preparation rules, ingredients, and station-ready recipe data.",
    area: "Admin",
  },
  {
    key: "products",
    path: "/products",
    label: "Products",
    eyebrow: "Catalog",
    title: "Products",
    description: "Organize sellable items and their connections to recipes and inventory.",
    area: "Admin",
  },
  {
    key: "inventory-requests",
    path: "/inventory-requests",
    label: "Inventory Requests",
    eyebrow: "Replenishment",
    title: "Inventory Requests",
    description: "Review the request workflow that will move stock from need to approval.",
    area: "Admin",
  },
  {
    key: "store-manager",
    path: "/store-manager",
    label: "Store Manager",
    eyebrow: "Store Manager Workspace",
    title: "Store Manager",
    description: "Reserved workspace for store-level daily operations in upcoming tasks.",
    area: "Store Manager",
  },
  {
    key: "store-employees",
    path: "/store-manager/employees",
    label: "Employees",
    eyebrow: "Store Team",
    title: "Employees",
    description: "View employees assigned to your store.",
    area: "Store Manager",
  },
];

export const defaultRoute = appRoutes[0];

export function findRoute(pathname: string, routes: AppRoute[] = appRoutes) {
  const normalizedPath = pathname === "/" ? defaultRoute.path : pathname.replace(/\/$/, "");
  const exactRoute = routes.find((route) => route.path === normalizedPath);

  if (exactRoute) {
    return exactRoute;
  }

  const nestedRoute = routes
    .filter((route) => normalizedPath.startsWith(`${route.path}/`))
    .sort((first, second) => second.path.length - first.path.length)[0];

  return nestedRoute ?? routes[0] ?? defaultRoute;
}
