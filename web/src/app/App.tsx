import { BrowserRouter, Routes, Route } from 'react-router';
import { Toaster } from 'sonner';
import { HomePage } from './pages/HomePage';
import { CompanyPage } from './pages/CompanyPage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH ?? '/'}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/company/:id" element={<CompanyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
