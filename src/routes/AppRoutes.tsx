import { Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/public/LandingPage'
import Login from '../pages/lms/Auth/Login'
import RegisterWizard from '../pages/lms/Auth/RegisterWizard'
import LmsHomepage from '../pages/lms/LmsHomepage'
import CourseViewer from '../pages/lms/CourseViewer'
import Dashboard from '../pages/lms/Dashboard'
import MemberProgress from '../pages/lms/MemberProgress'

// Studio (Admin Panel)
import StudioLayout from '../pages/studio/StudioLayout'
import CourseManager from '../pages/studio/CourseManager'
import SyllabusControl from '../pages/studio/SyllabusControl'
import MemberManagement from '../pages/studio/MemberManagement'
import RomushaPanel from '../pages/studio/RomushaPanel'
import StudioReportExport from '../pages/studio/StudioReportExport'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route path="/lms/login" element={<Login />} />
      <Route path="/lms/register" element={<RegisterWizard />} />

      {/* LMS Core */}
      <Route path="/lms" element={<LmsHomepage />} />
      <Route path="/lms/dashboard" element={<Dashboard />} />
      <Route path="/lms/progress" element={<MemberProgress />} />
      <Route path="/lms/course/:courseId" element={<CourseViewer />} />

      {/* Studio (Admin Panel) */}
      <Route path="/studio" element={<StudioLayout />}>
        <Route index element={<CourseManager />} />
        <Route path="syllabus" element={<SyllabusControl />} />
        <Route path="syllabus/:courseId" element={<SyllabusControl />} />
        <Route path="members" element={<MemberManagement />} />
        <Route path="romusha" element={<RomushaPanel />} />
        <Route path="reports" element={<StudioReportExport />} />
      </Route>
    </Routes>
  )
}


