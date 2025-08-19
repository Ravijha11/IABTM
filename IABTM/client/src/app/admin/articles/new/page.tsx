'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function AddArticlePage() {
  const [form, setForm] = useState({
    title: '',
    tags: '',
    category: 'Blog',
    content: '',
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const { title, tags, category, content } = form;

    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }

    const payload = {
      title,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      category,
      content,
    };

    try {
      setLoading(true);

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/articles/create`,
        payload
      );

      if (data?.statusCode === 200) {
        toast.success('Article created successfully');
        router.push('/articles');
      } else {
        toast.error(data?.message || 'Failed to create article');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-semibold mb-6">Add New Article</h1>

      <div className="space-y-6">
        <InputField
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter article title"
        />

        <InputField
          label="Tags"
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="Comma-separated tags"
        />

        <div>
          <label className="block mb-1 font-medium">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="Blog">Blog</option>
            <option value="Research">Research</option>
            <option value="No category">No category</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Content</label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={10}
            className="w-full border px-3 py-2 rounded"
            placeholder="Write your article..."
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            className="border px-4 py-2 rounded"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border px-3 py-2 rounded"
        placeholder={placeholder}
      />
    </div>
  );
}
