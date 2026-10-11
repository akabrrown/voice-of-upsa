"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  verifyServiceToday,
  toggleServiceStatus,
  toggleServiceFeatured,
  softDeleteService,
} from "@/lib/actions/services";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Star,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ServiceAdminActionsProps {
  service: {
    id: string;
    slug: string;
    name: string;
    status: string;
    is_featured: boolean;
  };
}

export function ServiceAdminActions({ service }: ServiceAdminActionsProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleVerifyToday = async () => {
    setIsVerifying(true);
    try {
      await verifyServiceToday(service.id);
      toast.success(`Marked "${service.name}" as verified today!`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to verify service");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsUpdating(true);
    try {
      await toggleServiceStatus(service.id, service.status);
      toast.success(`Service marked as ${service.status === "active" ? "inactive" : "active"}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFeatured = async () => {
    setIsUpdating(true);
    try {
      await toggleServiceFeatured(service.id, service.is_featured);
      toast.success(service.is_featured ? "Removed from featured" : "Promoted to featured");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update featured status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await softDeleteService(service.id);
      toast.success("Service removed from directory");
      setDeleteDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleVerifyToday}
        disabled={isVerifying}
        title="Mark contact details as verified today"
        className="h-8 text-xs font-semibold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200"
      >
        {isVerifying ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
        )}
        Verify
      </Button>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 border-gray-200 text-gray-700 hover:text-upsa-navy hover:bg-gray-50 text-xs font-semibold"
      >
        <Link href={`/dashboard/admin/services/${service.id}/edit`}>
          <Edit2 className="h-3 w-3 mr-1 text-gray-500" /> Edit
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-700"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-upsa-navy" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/services/${service.slug}`} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2 text-gray-500" />
              View Public Page
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleToggleStatus} className="cursor-pointer">
            {service.status === "active" ? (
              <>
                <XCircle className="w-4 h-4 mr-2 text-amber-600" />
                Deactivate Service
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                Activate Service
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleToggleFeatured} className="cursor-pointer">
            <Star className={`w-4 h-4 mr-2 ${service.is_featured ? "text-upsa-gold fill-upsa-gold" : "text-gray-500"}`} />
            {service.is_featured ? "Unfeature" : "Feature at Top"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Service
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Service
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              Are you sure you want to remove &ldquo;{service.name}&rdquo; from the student services directory?
              <br />
              <span className="block mt-2 text-xs text-gray-500">
                This soft-deletes the listing and records the audit log event.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Confirm Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
