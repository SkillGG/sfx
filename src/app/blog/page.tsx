import { cn } from "@/utils/utils";
import Link from "next/link";
import { getArticles } from "@/articles";
import BlogHeader from "./_components/Header";
import Tag from "./_components/Tag";

const BlogPage = () => {
  const posts = getArticles();

  return (
    <main className={cn("mx-auto w-full max-w-3xl px-4 py-8")}>
      <BlogHeader
        title={
          <>
            {" "}
            <div>
              <h1 className={cn("text-3xl font-bold text-(--header-text)")}>
                SFX Vault&apos;s Blog
              </h1>
              <p className={cn("text-(--regular-text)")}>
                News, tips, and updates.
              </p>
            </div>
          </>
        }
      />

      <section aria-label="Articles list">
        <ul className={cn("flex flex-col gap-4")}>
          {posts.map((post) => (
            <li key={post.slug} className={cn("list-none")}>
              <article
                className={cn(
                  "rounded-lg border border-(--regular-border)",
                  "bg-(--main-bg)/60 p-4 shadow-sm",
                )}
                aria-labelledby={`post_${post.slug}_title`}
              >
                <header className={cn("space-y-1")}>
                  <h2
                    id={`post_${post.slug}_title`}
                    className={cn("text-xl font-semibold text-(--header-text)")}
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className={cn("underline-offset-4 hover:underline")}
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className={cn("text-sm text-(--label-text)")}>
                    {new Date(post.date).toLocaleDateString()}
                  </p>
                </header>
                <p className={cn("mt-2 text-(--regular-text)")}>
                  {post.description}
                </p>
                {post.tags && post.tags.length > 0 && (
                  <ul className={cn("mt-3 flex flex-wrap gap-2")}>
                    {post.tags.map((t) => (
                      <li key={t} className={cn("list-none")}>
                        <Tag tag={t}>{t}</Tag>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default BlogPage;
