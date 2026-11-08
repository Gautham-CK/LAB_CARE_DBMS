import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ResourcePage from './pages/ResourcePage.jsx';

const resourcePages = [
  { path: 'laboratories', title: 'Laboratories', singular: 'laboratory', description: 'Manage laboratory locations and their details.', icon: 'building' },
  { path: 'equipment', title: 'Equipment', singular: 'equipment item', description: 'Track assets, assignments, and equipment status.', icon: 'microscope' },
  { path: 'categories', title: 'Categories', singular: 'category', description: 'Organize equipment into reusable categories.', icon: 'layers' },
  { path: 'complaints', title: 'Complaints', singular: 'complaint', description: 'Review reported equipment issues and their priority.', icon: 'message' },
  { path: 'assignments', title: 'Technician assignments', singular: 'assignment', description: 'Assign complaints and follow technician progress.', icon: 'users' },
  { path: 'repairs', title: 'Repairs', singular: 'repair record', description: 'Record repair work, costs, and resolution status.', icon: 'wrench' },
  { path: 'maintenance', title: 'Maintenance history', singular: 'maintenance record', description: 'Keep a searchable history of equipment maintenance.', icon: 'calendar' },
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        {resourcePages.map((resource) => (
          <Route
            key={resource.path}
            path={resource.path}
            element={<ResourcePage resource={resource} />}
          />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
