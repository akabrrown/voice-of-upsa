"use client";

import { useEffect, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserCog, UserMinus, ShieldCheck, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { TableShadowLoader } from "@/components/ui/shadow-loaders";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setUsers(
          data.map((user: any) => ({
            id: user.id,
            name: user.full_name || "Anonymous User",
            email: user.username || "no-handle",
            role: user.role || "public",
            status: user.is_active ? "active" : "suspended",
            joined: user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
          }))
        );
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast.error(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [supabase]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`User role updated to ${newRole}!`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newActive = currentStatus !== "active";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: newActive })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`User status updated!`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight">User Management</h1>
          <p className="text-gray-500">Manage platform users, roles, and access permissions</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableShadowLoader rows={5} hasSearch={false} />
          </div>
        ) : users.length > 0 ? (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-upsa-navy">User</TableHead>
                <TableHead className="font-bold text-upsa-navy">Role</TableHead>
                <TableHead className="font-bold text-upsa-navy">Status</TableHead>
                <TableHead className="font-bold text-upsa-navy">Joined Date</TableHead>
                <TableHead className="text-right font-bold text-upsa-navy">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-upsa-navy/5 flex items-center justify-center text-upsa-navy font-black text-xs">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-upsa-navy">{user.name}</div>
                        <div className="text-xs text-gray-400">@{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize font-bold text-[10px] tracking-widest",
                        user.role === "admin" ? "border-red-200 text-red-600 bg-red-50" : 
                        user.role === "editor" ? "border-blue-200 text-blue-600 bg-blue-50" : 
                        "border-gray-200 text-gray-600 bg-gray-50"
                      )}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "capitalize font-bold text-[10px] tracking-widest",
                        user.status === "active" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                      )}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{user.joined}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleUpdateRole(user.id, "admin")}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" /> Promote to Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleUpdateRole(user.id, "editor")}
                        >
                          <UserCog className="mr-2 h-4 w-4 text-blue-500" /> Change to Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleUpdateRole(user.id, "public")}
                        >
                          <UserCog className="mr-2 h-4 w-4 text-gray-500" /> Make Reader (Public)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => handleToggleStatus(user.id, user.status)}
                        >
                          <UserMinus className="mr-2 h-4 w-4" /> 
                          {user.status === "active" ? "Suspend Account" : "Activate Account"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-20 text-center text-gray-500 italic">No users found.</div>
        )}
      </div>
    </div>
  );
}
