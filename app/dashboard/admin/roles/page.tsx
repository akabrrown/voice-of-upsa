"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { TableShadowLoader } from "@/components/ui/shadow-loaders";
import { UserAvatar } from "@/components/ui/user-avatar";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string;
  created_at: string;
}

export default function RoleManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/roles");
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setUsers(result.data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, newRole }),
      });
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error);
      
      toast.success("User role updated successfully");
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Role Management</h1>
        <p className="text-gray-500">Manage user access levels and permissions</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableShadowLoader rows={5} hasSearch={false} />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-upsa-navy">User</TableHead>
                <TableHead className="font-bold text-upsa-navy">Email</TableHead>
                <TableHead className="font-bold text-upsa-navy">Registered</TableHead>
                <TableHead className="font-bold text-upsa-navy">Current Role</TableHead>
                <TableHead className="text-right font-bold text-upsa-navy">Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar src={user.avatar_url} name={user.full_name} size="md" />
                      <span className="font-semibold text-upsa-navy">{user.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{user.email}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`uppercase tracking-widest text-[10px] ${
                        user.role === 'admin' ? 'bg-red-500 hover:bg-red-600' :
                        user.role === 'editor' ? 'bg-amber-500 hover:bg-amber-600' :
                        'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-upsa-navy/20 outline-none cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
