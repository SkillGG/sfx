import type { Article } from ".";

export const Article1: Article = {
    author: "Skillu",
    slug: "devlog-1",
    title: "[Devlog #1] Welcome to SFX Vault",
    description: "How it all started",
    date: new Date().toISOString(),
    tags: ["devlog", "site", "app"],
    content: (
      <>
        <h3 className="text-lg">
          {"So I've made an app"}
        </h3>
        <p>
          {"In this post I'll tell you about it a bit. Why did I create it, how it came to be and what's the plan for the future."}
        </p>
        <p>
          {"So, first things first. Why?"}
          <br/>
          {`As a hobbyist manga translator who worked on many series over past 5 years the thing I've always dreaded were sound effects. Things like Japanese ドキドキ or english mumble or polish zgrzt. I always have a hard time translating them between languages. So I've had an idea. Why not make an app to store all my SFX research on a database that I'll be able to quickly find the words I need.`}
        </p>
        <p>
          {`Do I remember a Polish SFX, but forgot how to say it in English? Just look it up!`}
        </p>
        <p>
          {`Do I want to check what SFX to use in English or Portuguese for "fast blowing wind"? Just search it up.`}
        </p>
      </>
    ),
  };
