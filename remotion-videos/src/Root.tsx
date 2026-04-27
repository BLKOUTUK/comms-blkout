import React from "react";
import { Composition } from "remotion";
import { IVORMessage } from "./compositions/IVORMessage";
import { ivorMessagePropsSchema } from "./schemas/ivor-message";

const FPS = 30;

const sampleNewsDigest = {
  property: "news-digest" as const,
  title: "Your news of the week",
  intro: "My dear friends, three stories worth your time.",
  teases: [
    {
      title: "Sample story one",
      hook: "A short, intriguing tease for the first story.",
      url: "https://blkoutuk.com/news/story-one?utm_source=video",
      rank: 1,
      voteCount: 247,
    },
    {
      title: "Sample story two",
      hook: "Another tease that makes you want to read the full piece.",
      url: "https://blkoutuk.com/news/story-two?utm_source=video",
      rank: 2,
      voteCount: 189,
    },
    {
      title: "Sample story three",
      hook: "The third tease, often the strongest, plants the click.",
      url: "https://blkoutuk.com/news/story-three?utm_source=video",
      rank: 3,
      voteCount: 156,
    },
  ],
  cta: {
    text: "Read & vote — no login —",
    url: "https://blkoutuk.com/news?utm_source=video&utm_medium=reel",
    spokenUrl: "blkoutuk.com/news",
  },
  avatarVideo: "assets/aivor-news.jpg",
  backdropVideo: "assets/hero-newsroom.mp4",
  bgMusic: false,
  durationSeconds: 35,
  showName: "BLKOUT News",
  weekLabel: "Week 17",
  dateRangeFrom: "21 April",
  dateRangeTo: "27 April 2026",
  tickerText:
    "Community-owned journalism · Upvote the stories that matter · No login needed · We tally votes every week · Vote at blkoutuk.com/news",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IVORMessage"
        component={IVORMessage}
        durationInFrames={sampleNewsDigest.durationSeconds * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        schema={ivorMessagePropsSchema}
        defaultProps={{ ...sampleNewsDigest, aspect: "9:16" as const }}
      />
      <Composition
        id="IVORMessage9x16"
        component={IVORMessage}
        durationInFrames={sampleNewsDigest.durationSeconds * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        schema={ivorMessagePropsSchema}
        defaultProps={{ ...sampleNewsDigest, aspect: "9:16" as const }}
      />
      <Composition
        id="IVORMessage1x1"
        component={IVORMessage}
        durationInFrames={sampleNewsDigest.durationSeconds * FPS}
        fps={FPS}
        width={1080}
        height={1080}
        schema={ivorMessagePropsSchema}
        defaultProps={{ ...sampleNewsDigest, aspect: "1:1" as const }}
      />
      <Composition
        id="IVORMessage16x9"
        component={IVORMessage}
        durationInFrames={sampleNewsDigest.durationSeconds * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={ivorMessagePropsSchema}
        defaultProps={{ ...sampleNewsDigest, aspect: "16:9" as const }}
      />
    </>
  );
};
