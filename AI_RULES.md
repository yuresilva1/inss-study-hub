# AI Rules & Tech Stack - SimulaINSS

## 🚀 Tech Stack
- **Framework**: React 18 with Vite and TypeScript.
- **Styling**: Tailwind CSS for all styling needs, following a mobile-first approach.
- **UI Components**: shadcn/ui (built on Radix UI) for accessible and consistent interface elements.
- **Backend & Auth**: Supabase (PostgreSQL, Auth, RLS) for data persistence and user management.
- **Data Fetching**: TanStack Query (React Query) for efficient server state management.
- **Navigation**: React Router DOM for client-side routing.
- **Charts**: Recharts for visualizing student performance and evolution.
- **Icons**: Lucide React for a consistent and modern icon set.
- **Forms**: React Hook Form combined with Zod for schema-based validation.

## 🛠️ Library Usage Rules

### 1. UI & Styling
- **Always** use Tailwind CSS classes for layout and custom styling.
- **Prefer** shadcn/ui components for complex UI elements (Dialogs, Selects, Tabs, etc.).
- **Icons**: Use `lucide-react` exclusively. Do not import other icon libraries.
- **Animations**: Use `tailwindcss-animate` for simple transitions and `framer-motion` (if added) for complex ones.

### 2. Data & State
- **Supabase**: Use the generated client in `@/integrations/supabase/client`.
- **Queries/Mutations**: Always wrap Supabase calls in TanStack Query hooks for caching and loading states.
- **Auth**: Use the `useAuth` hook for accessing user session and profile data.

### 3. Forms & Validation
- **Validation**: Use `zod` to define schemas for all forms and API responses.
- **Forms**: Use `react-hook-form` with the `@hookform/resolvers/zod` resolver.

### 4. Architecture
- **Pages**: Keep page components in `src/pages/`.
- **Components**: Keep reusable UI pieces in `src/components/`.
- **Hooks**: Custom logic should reside in `src/hooks/`.
- **Types**: Use the generated Supabase types from `@/integrations/supabase/types`.

### 5. Design System
- **Colors**: Use the CSS variables defined in `index.css` (e.g., `bg-primary`, `text-foreground`).
- **Gradients**: Use the utility classes `gradient-primary`, `gradient-warm`, and `gradient-hero` for the app's signature look.
- **Typography**: Use `font-display` (Space Grotesk) for headings and `font-sans` (Nunito) for body text.