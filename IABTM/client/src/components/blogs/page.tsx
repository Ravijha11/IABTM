"use client"
import React, { useEffect, useState } from 'react';

interface DevToArticle {
  id: number;
  title: string;
  description: string;
  slug: string;
  url: string;
  published_at: string;
  cover_image: string | null;
  social_image: string;
  body_html?: string;
  user: {
    name: string;
    profile_image: string;
  };
}

const username = 'iabtm';

const Blogs: React.FC = () => {
  const [articles, setArticles] = useState<DevToArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<DevToArticle | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      const res = await fetch(`https://dev.to/api/articles?username=${username}`);
      const data = await res.json();
      setArticles(data);
    };
    fetchArticles();
  }, []);

  const fetchFullArticle = async (slug: string) => {
    setLoadingArticle(true);
    const res = await fetch(`https://dev.to/api/articles/${username}/${slug}`);
    const data = await res.json();
    setSelectedArticle(data);
    setLoadingArticle(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (selectedArticle) {
    return (
      <div className="container mx-auto px-6 py-12 font-sans max-w-3xl">
        <button
          onClick={() => setSelectedArticle(null)}
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Back to blog
        </button>

        {loadingArticle ? (
          <div>Loading article...</div>
        ) : (
          <>
            <h2 className="text-4xl font-bold mb-4">{selectedArticle.title}</h2>
            <div className="text-gray-500 text-sm mb-4">
              By {selectedArticle.user.name} on {formatDate(selectedArticle.published_at)}
            </div>
            
            <img
                src={selectedArticle.cover_image || selectedArticle.social_image}
                alt={selectedArticle.title}
                className="rounded mb-6 w-full max-h-[400px] object-cover"
            />
            <div
              className="prose max-w-none text-justify"
              dangerouslySetInnerHTML={{ __html: selectedArticle.body_html || '' }}
            />
          </>
        )}
      </div>
    );
  }

  const featured = articles[0];
  const others = articles.slice(1, 5);

  return (
    <div className="container mx-auto px-6 font-sans">

      <div className="grid md:grid-cols-3 gap-10">
        {/* Featured Post */}
        {featured && (
          <div className="md:col-span-1">
            <img
              src={featured.cover_image || featured.social_image}
              alt={featured.title}
              className="w-full h-[300px] object-contain rounded"
            />
            <div className="mt-4 text-sm text-gray-500">{formatDate(featured.published_at)}</div>
            <h2 className="text-2xl font-semibold mt-2 text-gray-900">{featured.title}</h2>
            <p className="text-gray-700 mt-2">{featured.description}</p>
            <button
              onClick={() => fetchFullArticle(featured.slug)}
              className="text-blue-600 text-sm mt-2 hover:underline"
            >
              Read more
            </button>
          </div>
        )}

        {/* Other Articles */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {others.map((article) => (
            <div key={article.id} className="bg-white rounded overflow-hidden">
              <img
                src={article.cover_image || article.social_image}
                alt={article.title}
                className="w-full h-40 object-cover rounded"
              />
              <div className="mt-2 text-sm text-gray-500">{formatDate(article.published_at)}</div>
              <h3 className="text-md font-semibold mt-1 text-gray-900">{article.title}</h3>
              <p className="text-sm text-gray-700">{article.description.slice(0, 80)}...</p>
              <button
                onClick={() => fetchFullArticle(article.slug)}
                className="text-blue-600 text-sm mt-1 hover:underline"
              >
                Read more
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blogs;
