import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext } from "@tanstack/react-router";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold" style={{ color: "#F5F5F0" }}>404</h1>
        <h2 className="mt-4 text-xl font-semibold" style={{ color: "#F5F5F0" }}>Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="underline" style={{ color: "#FF6B35" }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
          Something went wrong
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#8A8A7A" }}>
          {error?.message ?? "An unexpected error occurred."}
        </p>
        <div className="mt-6">
          <a href="/" className="underline" style={{ color: "#FF6B35" }}>
            Reload
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
