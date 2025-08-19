import React, { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "@/components/ui/spinner";

export default function EditorialContent() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const rssUrl = encodeURIComponent("https://flipboard.com/@JeetBharti/test.rss");
        const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        setArticles(response.data.items);
        console.log("Fetched Flipboard articles:", response.data.items);
      } catch (error) {
        console.error("Error fetching Flipboard articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2>Editorial Content</h2>
      <ul>
        {articles.map((article) => (
          <li key={article.guid}>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
            <p dangerouslySetInnerHTML={{ __html: article.description }}></p>
          </li>
        ))}
      </ul>
    </div>
  );
}
