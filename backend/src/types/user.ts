export interface User {
  id: string;
  username: string;
  password: string; // bcrypt hashed
  name: string;
  email: string;
  phone?: string;
  id_card?: string;           // 身份证号码
  emergency_contact?: string; // 紧急联系人
  emergency_phone?: string;   // 紧急联系人电话
  department?: string;
  position?: string;          // 职位
  bio?: string;               // 个人简介
  avatar?: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserPublic {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  id_card?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  department?: string;
  position?: string;
  bio?: string;
  avatar?: string;
  role: User['role'];
  status: User['status'];
  created_at: string;
  last_login?: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: User['role'];
  iat?: number;
  exp?: number;
}

export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    id_card: user.id_card,
    emergency_contact: user.emergency_contact,
    emergency_phone: user.emergency_phone,
    department: user.department,
    position: user.position,
    bio: user.bio,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    last_login: user.last_login,
  };
}
