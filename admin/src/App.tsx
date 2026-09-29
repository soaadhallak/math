import { Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

// Admin CRUD pages
import ServicesList from "./pages/Admin/Services/ServicesList";
import ServiceForm from "./pages/Admin/Services/ServiceForm";
import CategoriesList from "./pages/Admin/Categories/CategoriesList";
import CategoryForm from "./pages/Admin/Categories/CategoryForm";
import ProjectsList from "./pages/Admin/Projects/ProjectsList";
import ProjectForm from "./pages/Admin/Projects/ProjectForm";
import ReferenceLogosList from "./pages/Admin/ReferenceLogos/ReferenceLogosList";
import ReferenceLogoForm from "./pages/Admin/ReferenceLogos/ReferenceLogoForm";
import UserLogsList from "./pages/Admin/Logs/UserLogsList";
import UsersList from "./pages/Admin/Users/UsersList";
import UserForm from "./pages/Admin/Users/UserForm";
import DocumentsList from "./pages/Admin/Documents/DocumentsList";
import DocumentForm from "./pages/Admin/Documents/DocumentForm";
import MessagesList from "./pages/Admin/Messages/MessagesList";
import MessageDetail from "./pages/Admin/Messages/MessageDetail";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Services */}
            <Route path="/services" element={<ServicesList />} />
            <Route path="/services/new" element={<ServiceForm />} />
            <Route path="/services/:id/edit" element={<ServiceForm />} />

            {/* Project Categories */}
            <Route path="/categories" element={<CategoriesList />} />
            <Route path="/categories/new" element={<CategoryForm />} />
            <Route path="/categories/:id/edit" element={<CategoryForm />} />

            {/* Projects */}
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/new" element={<ProjectForm />} />
            <Route path="/projects/:id/edit" element={<ProjectForm />} />

            {/* Reference Logos */}
            <Route path="/reference-logos" element={<ReferenceLogosList />} />
            <Route path="/reference-logos/new" element={<ReferenceLogoForm />} />
            <Route path="/reference-logos/:id/edit" element={<ReferenceLogoForm />} />

            {/* Documents */}
            <Route path="/documents" element={<DocumentsList />} />
            <Route path="/documents/new" element={<DocumentForm />} />
            <Route path="/documents/:id/edit" element={<DocumentForm />} />

            {/* Users */}
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/new" element={<UserForm />} />
            <Route path="/users/:id/edit" element={<UserForm />} />

            {/* User Logs */}
            <Route path="/logs" element={<UserLogsList />} />

            {/* Messages */}
            <Route path="/messages" element={<MessagesList />} />
            <Route path="/messages/:id" element={<MessageDetail />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
