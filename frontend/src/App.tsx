import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ModalProvider } from '@/components/modal'
import { modalRegistry } from '@/modals/registry'
import { Login } from '@/pages/Login'
import { Home } from '@/pages/Home'
import { ProjectList } from '@/pages/projects/ProjectList'
import { ProjectDetail } from '@/pages/projects/ProjectDetail'
import { TaskList } from '@/pages/tasks/TaskList'
import { EmployeeList, DepartmentList, PositionList, CompanyProfile } from '@/pages/organization'
import { ServiceList, ServiceDetail, ConfigList } from '@/pages/pricing'
import { Settings } from '@/pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider registry={modalRegistry}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="tasks" element={<TaskList />} />

            {/* 组织管理 - 需要管理员权限 */}
            <Route
              path="organization/employees"
              element={
                <ProtectedRoute requiredRole={['admin']}>
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="organization/departments"
              element={
                <ProtectedRoute requiredRole={['admin']}>
                  <DepartmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="organization/positions"
              element={
                <ProtectedRoute requiredRole={['admin']}>
                  <PositionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="organization/company"
              element={
                <ProtectedRoute requiredRole={['admin']}>
                  <CompanyProfile />
                </ProtectedRoute>
              }
            />

            <Route path="settings" element={<Settings />} />

            {/* 服务定价 */}
            <Route path="pricing/services" element={<ServiceList />} />
            <Route path="pricing/services/:category/:name" element={<ServiceDetail />} />
            <Route path="pricing/addons" element={<ConfigList />} />
            <Route path="pricing/policies" element={<PlaceholderPage title="价格政策" />} />
            <Route path="pricing/templates" element={<PlaceholderPage title="报价模板" />} />

            {/* Placeholder routes */}
            <Route path="proposals" element={<PlaceholderPage title="提案管理" />} />
            <Route path="finance" element={<PlaceholderPage title="财务管理" />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ModalProvider>
    </QueryClientProvider>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2">功能开发中...</p>
      </div>
    </div>
  )
}

export default App
