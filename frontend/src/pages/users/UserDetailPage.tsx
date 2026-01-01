/**
 * 用户详情页（含多 Profile Tab 切换）
 * Phase 3.1: Principal + Profile 用户体系
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, Mail, Phone, ArrowLeft, Briefcase, Users, 
  Building2, Calendar, Hash, Shield 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchPrincipalContext, type PrincipalContext, type ProfileEntry } from '@/api/principals';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PrincipalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    if (id) {
      loadPrincipal(id);
    }
  }, [id]);

  async function loadPrincipal(principalId: string) {
    setLoading(true);
    setError(null);
    
    try {
      const context = await fetchPrincipalContext(principalId);
      setData(context);
      
      // 设置默认 Tab
      if (context.summary.has_employee) {
        setActiveTab('employee');
      } else if (context.summary.has_client_contact) {
        setActiveTab('client_contact');
      } else {
        setActiveTab('overview');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '用户不存在'}</p>
          <Link to="/users">
            <Button variant="outline">返回用户列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { principal, profiles, profiles_by_type, summary } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/users" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回用户列表
          </Link>
          
          {/* User Info */}
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="w-10 h-10 text-indigo-600" />
            </div>
            
            {/* Details */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {principal.display_name}
              </h1>
              
              <div className="mt-2 flex flex-wrap gap-4 text-slate-600">
                {principal.emails.map((email, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {email}
                  </span>
                ))}
                {principal.phones.map((phone, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {phone}
                  </span>
                ))}
              </div>
              
              {/* Status Badge */}
              <div className="mt-3 flex gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  principal.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {principal.status === 'active' ? '活跃' : principal.status}
                </span>
                <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-600">
                  {summary.profile_count} 个档案
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <Users className="w-4 h-4 mr-2" />
              概览
            </TabsTrigger>
            {summary.has_employee && (
              <TabsTrigger value="employee">
                <Briefcase className="w-4 h-4 mr-2" />
                员工档案
              </TabsTrigger>
            )}
            {summary.has_client_contact && (
              <TabsTrigger value="client_contact">
                <Building2 className="w-4 h-4 mr-2" />
                客户联系人
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">档案概览</h2>
              
              {profiles.length === 0 ? (
                <p className="text-slate-500">该用户暂无业务档案</p>
              ) : (
                <div className="grid gap-4">
                  {profiles.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Employee Tab */}
          {summary.has_employee && (
            <TabsContent value="employee">
              <div className="space-y-4">
                {profiles_by_type['employee']?.map((profile) => (
                  <EmployeeProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            </TabsContent>
          )}

          {/* Client Contact Tab */}
          {summary.has_client_contact && (
            <TabsContent value="client_contact">
              <div className="space-y-4">
                {profiles_by_type['client_contact']?.map((profile) => (
                  <ClientContactProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

// ============================================================
// Profile Card Components
// ============================================================

function ProfileCard({ profile }: { profile: ProfileEntry }) {
  const typeLabel = profile.profile_type === 'employee' ? '员工档案' 
    : profile.profile_type === 'client_contact' ? '客户联系人' 
    : profile.profile_type;
    
  const TypeIcon = profile.profile_type === 'employee' ? Briefcase : Building2;
  
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200">
          <TypeIcon className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="font-medium text-slate-900">{profile.title}</p>
          <p className="text-sm text-slate-500">{typeLabel}</p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded text-xs ${
        profile.status === 'active' 
          ? 'bg-green-100 text-green-700' 
          : 'bg-slate-100 text-slate-600'
      }`}>
        {profile.status === 'active' ? '活跃' : profile.status}
      </span>
    </div>
  );
}

function EmployeeProfileCard({ profile }: { profile: ProfileEntry }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">员工档案</h3>
          <p className="text-sm text-slate-500">{profile.id}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <InfoItem icon={Hash} label="工号" value={profile.id.replace('p-employee-', '')} />
        <InfoItem icon={Building2} label="部门" value={profile.department || '-'} />
        <InfoItem icon={Briefcase} label="职位" value={profile.title} />
        <InfoItem icon={Calendar} label="状态" value={profile.status === 'active' ? '在职' : profile.status} />
      </div>
      
      {/* Document Link */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          文档位置：
          <Link to={`/workspace/${profile.document}`} className="text-indigo-600 hover:underline ml-1">
            {profile.document}#{profile.anchor}
          </Link>
        </p>
      </div>
    </div>
  );
}

function ClientContactProfileCard({ profile }: { profile: ProfileEntry }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">客户联系人档案</h3>
          <p className="text-sm text-slate-500">{profile.id}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <InfoItem icon={Building2} label="客户" value={profile.client_id || '-'} />
        <InfoItem icon={Briefcase} label="职位" value={profile.role_title || '-'} />
        <InfoItem icon={Users} label="部门" value={profile.department || '-'} />
        <InfoItem icon={Shield} label="状态" value={profile.status === 'active' ? '活跃' : profile.status} />
      </div>
      
      {/* Client Link */}
      {profile.client_id && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            关联客户：
            <span className="text-emerald-600 ml-1">
              {profile.client_id}
            </span>
          </p>
        </div>
      )}
      
      {/* Document Link */}
      <div className="mt-4">
        <p className="text-sm text-slate-500">
          文档位置：
          <Link to={`/workspace/${profile.document}`} className="text-indigo-600 hover:underline ml-1">
            {profile.document}#{profile.anchor}
          </Link>
        </p>
      </div>
    </div>
  );
}

function InfoItem({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-slate-400 mt-0.5" />
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default UserDetailPage;

