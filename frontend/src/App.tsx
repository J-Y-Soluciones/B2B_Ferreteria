import { QueryProvider } from "@/app/providers/QueryProvider";
import { AuthProvider } from "@/modules/auth/context/AuthContext";
import { AppRouter } from "@/app/router";
import { ThemeProvider } from "@/shared/context/ThemeContext";

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppRouter />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
