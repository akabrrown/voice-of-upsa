"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mic, PlaySquare, Settings, Activity } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatsShadowLoader } from "@/components/ui/shadow-loaders";

interface Show {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  created_at: string;
  episodes?: [{ count: number }];
}

export default function AdminPodcastsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/podcasts")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShows(data.data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsShadowLoader count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight flex items-center gap-2">
            <Mic className="h-8 w-8 text-upsa-gold" />
            Podcasts & Audio
          </h1>
          <p className="text-gray-500">Manage audio shows, episodes, and RSS feeds</p>
        </div>
        <Link href="/dashboard/admin/podcasts/new">
          <Button className="bg-upsa-gold hover:bg-yellow-500 text-upsa-navy font-bold shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Create New Show
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase">Active Shows</CardTitle>
            <Activity className="h-4 w-4 text-upsa-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-upsa-navy">{shows.filter(s => s.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase">Total Episodes</CardTitle>
            <PlaySquare className="h-4 w-4 text-upsa-navy" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-upsa-navy">
              {shows.reduce((acc, show) => acc + (show.episodes?.[0]?.count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-lg text-upsa-navy">All Shows</CardTitle>
          <CardDescription>Click a show to manage its episodes and settings.</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Show Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Episodes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  No podcast shows created yet.
                </TableCell>
              </TableRow>
            ) : (
              shows.map((show) => (
                <TableRow key={show.id}>
                  <TableCell className="font-bold text-upsa-navy">
                    {show.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{show.category.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-600">
                    {show.episodes?.[0]?.count || 0}
                  </TableCell>
                  <TableCell>
                    <Badge className={show.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {show.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/admin/podcasts/${show.id}`}>
                      <Button variant="ghost" size="sm" className="text-upsa-navy hover:bg-gray-100">
                        <Settings className="h-4 w-4 mr-2" /> Manage
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
