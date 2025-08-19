'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const getStatusStyle = (status: boolean) =>
  status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

// Component
export default function ArticlesTable() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fade, setFade] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-oldest');
  // const sampleArticles = [
  //   {
  //     _id: '1',
  //     title: 'Understanding React Server Components',
  //     category: 'Frontend',
  //     publishStatus: true,
  //     createdAt: '2024-11-12T10:00:00Z',
  //   },
  //   {
  //     _id: '2',
  //     title: 'Mastering Node.js Performance',
  //     category: 'Backend',
  //     publishStatus: false,
  //     createdAt: '2024-12-01T15:45:00Z',
  //   },
  //   {
  //     _id: '3',
  //     title: 'Design Patterns in TypeScript',
  //     category: 'Architecture',
  //     publishStatus: true,
  //     createdAt: '2025-01-20T09:30:00Z',
  //   },
  //   {
  //     _id: '4',
  //     title: 'Exploring AI Tools for Developers',
  //     category: 'AI/ML',
  //     publishStatus: false,
  //     createdAt: '2025-02-14T08:15:00Z',
  //   },
  //   {
  //     _id: '5',
  //     title: 'Database Optimization Tips',
  //     category: 'Databases',
  //     publishStatus: true,
  //     createdAt: '2025-03-03T12:00:00Z',
  //   },
  // ];
  // useEffect(() => {
  //   setTimeout(() => {
  //     setArticles(sampleArticles);
  //     setLoading(false);
  //   }, 500); // simulate loading
  // }, []);

  {/*Fetch articles*/}
  useEffect(() => {
    const fetchArticles = async () => {
      try {

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/articles/getAllArticles`,
          {}
        );

        const { data } = response.data;
        if (Array.isArray(data)) {
          setArticles(data);
        } else {
          toast.error('Unexpected data format from backend');
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Delete article
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {

      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/articles/delete/${id}`,
      );

      setArticles((prev) => prev.filter((a: any) => a._id !== id));
      toast.success('Article deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete article');
    }
  };

  // Filtering, sorting & pagination
  const filteredAndSortedArticles = useMemo(() => {
    let result = articles.filter((a: any) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortOption) {
      case 'title-desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'date-newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [articles, searchQuery, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedArticles.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedArticles = filteredAndSortedArticles.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="flex justify-center items-start p-10 min-h-screen bg-gray-50">
      <div className="w-full max-w-6xl bg-white rounded shadow p-6">
        {/* Header + Actions */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-semibold">Articles</h2>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => router.push('/admin/articles/new')}
            >
              + Add New
            </button>
          </div>

          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="border px-3 py-2 rounded w-64"
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border px-3 py-2 rounded w-48"
            >
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="date-newest">Date Newest</option>
              <option value="date-oldest">Date Oldest</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading articles...</p>
        ) : (
          <table className="min-w-full table-auto border rounded overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left"><input type="checkbox" /></th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Created At</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className={`transition-opacity duration-300 ${fade ? 'opacity-0' : 'opacity-100'}`}>
              {paginatedArticles.map((article: any) => (
                <tr key={article._id} className="border-t hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" /></td>
                  <td className="p-3">{article.title}</td>
                  <td className="p-3">{new Date(article.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{article.category || 'N/A'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusStyle(article.publishStatus)}`}>
                      {article.publishStatus ? 'Published' : 'Unpublished'}
                    </span>
                  </td>
                  <td className="p-3 flex gap-3 text-blue-600">
                    <button onClick={() => router.push(`/articles/edit/${article._id}`)} aria-label="Edit">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(article._id)} aria-label="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="flex justify-end items-center mt-6 text-sm">
          <div className="flex items-center gap-4">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border px-2 py-1 rounded"
            >
              {[10, 20, 30].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <span>
              {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredAndSortedArticles.length)} of {filteredAndSortedArticles.length}
            </span>
            <button onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>&lt;</button>
            <button onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
