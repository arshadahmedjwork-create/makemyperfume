import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api";
import { MOCK_NEWS } from "@/lib/mockData";
import type { NewsItem } from "@/lib/types";

export default function News() {
  const { slug } = useParams();
  const { data: articles } = useQuery({ queryKey: ["news"], queryFn: async () => { try { return await apiGet<NewsItem[]>("/news"); } catch { return MOCK_NEWS; } } });
  const list = articles ?? MOCK_NEWS;
  const article = slug ? list.find((item) => item.slug === slug) : null;
  if (slug && article) return <article className="article-page page-width" data-testid="news-article-page"><Link to="/news" className="back-link" data-testid="news-article-back-link"><ArrowLeft size={15} /> All journal entries</Link><div className="article-header"><p className="eyebrow">{article.category} <span>·</span> {article.read_time}</p><h1>{article.title}</h1><p>{article.excerpt}</p></div><img className="article-image" src={article.image_url} alt="" /><div className="article-body"><p className="article-date">{article.date}</p><p>{article.body}</p><p>Wear it slowly. Notice what changes. The best fragrance stories are the ones that become yours.</p></div></article>;
  return <div className="news-page page-width" data-testid="news-page"><div className="page-intro"><p className="eyebrow">The letter</p><h1>The world of fragrance, <em>delivered.</em></h1><p>Occasional notes from our studio on scent, ritual and the art of the everyday.</p></div><div className="news-list">{list.map((item, index) => <Link to={`/news/${item.slug}`} className={`news-feature-card ${index === 0 ? "is-featured" : ""}`} key={item.id} data-testid={`news-list-card-${item.slug}`}><img src={item.image_url} alt="" /><div className="news-feature-copy"><p className="eyebrow">{item.category} <span>·</span> {item.read_time}</p><h2>{item.title}</h2><p>{item.excerpt}</p><span className="gold-link">Read entry <ArrowRight size={15} /></span></div></Link>)}</div></div>;
}
