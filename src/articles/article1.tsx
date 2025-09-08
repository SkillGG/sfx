import Link from "next/link";
import type { Article } from ".";

import "./article.css";

export const Article1: Article = {
  author: "Skillu",
  slug: "devlog-1",
  title: "[Devlog #1] Welcome to SFX Vault",
  description: "The why and how",
  date: new Date().toISOString(),
  tags: ["devlog", "site", "app"],
  content: (
    <>
      <section className="text-justify">
        <h3 className="text-center text-2xl text-(--complement-700) dark:text-(--complement-100)">
          So I&apos;ve made an app
        </h3>
        <p>
          In this post I&apos;ll tell you about it a bit. Why did I create it,
          how it came to be and what&apos;s the plan for the future.
        </p>
        <p className="text-center text-xl text-(--complement-700) dark:text-(--complement-200)">
          So, first things first. Why?
        </p>
        <p>
          As a hobbyist manga translator who worked on many series over past 5
          years the thing I&apos;ve always dreaded were sound effects. Things
          like Japanese ドキドキ or english mumble or polish zgrzt. I always
          have a hard time translating them between languages. So I&apos;ve had
          an idea. Why not make an app to store all my SFX research on a
          database that I&apos;ll be able to quickly find the words I need.
        </p>
        <blockquote className="text-center font-mono text-balance">
          Do I remember a Polish SFX, but forgot how to say it in English?
          <br />
          <span className="text-(--complement-500)">Just look it up!</span>
        </blockquote>
        <blockquote className="text-center font-mono text-balance">
          Do I want to check what SFX to use in English or Portuguese for
          &quot;fast blowing wind&quot;?
          <br />
          <span className="text-(--complement-500)">Just search it up.</span>
        </blockquote>
        <p className="text-sm">
          Also,{" "}
          <Link
            className="link"
            target="_blank"
            href={"https://thejadednetwork.com/sfx/"}
          >
            Jaded SFX
          </Link>{" "}
          site is broken, smh.
        </p>
      </section>
      <section className="text-justify">
        <h3 className="text-center text-xl text-(--complement-700) dark:text-(--complement-200)">
          The way (and the stack)
        </h3>
        <p>
          So I&apos;ve decided to go with whhat I knew quite a lot. T3. Never
          been faster to prototype the apps thhan when I tried T3 stack for the
          first time! So I decided to use it here.
        </p>
        <p>
          For the DB I&apos;ve used supabase&apos;s PostgreSQL base for now,
          maybe in the future I&apos;ll move to some other DB when I get enough
          data and traffic for supabase to stop being achievable for me to host.
        </p>
        <p>
          For deployment. I&apos;ve decided on Vercel. They&apos;re pretty good
          for now. And their free tier I&apos;m on allows me to hohst on them
          for now. Later probably will move it to some other cloud provider as I
          grow.
        </p>
      </section>
    </>
  ),
};
