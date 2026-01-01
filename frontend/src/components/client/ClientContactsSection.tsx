/**
 * 客户联系人列表组件
 * Phase 3.1: Principal + Profile 用户体系
 * 
 * 用于在客户详情页显示关联的联系人列表
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, ChevronRight, Users } from 'lucide-react';
import { fetchClientContacts, type ClientContact } from '@/api/profiles';

interface ClientContactsSectionProps {
  clientId: string;
}

export function ClientContactsSection({ clientId }: ClientContactsSectionProps) {
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, [clientId]);

  async function loadContacts() {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchClientContacts(clientId);
      setContacts(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">联系人</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">联系人</h3>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          联系人 ({contacts.length})
        </h3>
        {contacts.length > 0 && (
          <Link 
            to={`/users?client=${clientId}`}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            查看全部
          </Link>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>暂无联系人</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactCard({ contact }: { contact: ClientContact }) {
  const principalId = contact.principal?.id || contact.principal_id;
  
  return (
    <Link 
      to={`/users/${principalId}`}
      className="block"
    >
      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          
          {/* Info */}
          <div>
            <p className="font-medium text-slate-900">
              {contact.principal?.display_name || contact.title}
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>{contact.role_title}</span>
              {contact.principal?.phones?.[0] && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {contact.principal.phones[0]}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </Link>
  );
}

export default ClientContactsSection;

