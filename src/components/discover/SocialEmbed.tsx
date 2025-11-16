
interface SocialEmbedProps {
  platform: 'instagram' | 'linkedin' | 'twitter' | 'facebook';
  url: string;
}

export function SocialEmbed({ platform, url }: SocialEmbedProps) {
  // For Instagram and LinkedIn, we'll use their embed APIs
  // This is a simplified version - in production you'd implement proper oEmbed
  
  if (platform === 'instagram') {
    return (
      <div className="instagram-embed">
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            View this post on Instagram
          </a>
        </blockquote>
      </div>
    );
  }

  if (platform === 'linkedin') {
    return (
      <div className="linkedin-embed">
        <iframe
          src={`https://www.linkedin.com/embed/feed/update/${url}`}
          height="400"
          width="100%"
          frameBorder="0"
          allowFullScreen
          title="LinkedIn Post"
          className="rounded-lg"
        />
      </div>
    );
  }

  // Fallback for other platforms
  return (
    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
      <p className="text-gray-500">
        Embed preview for {platform}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blkout-purple hover:underline mt-2 inline-block"
      >
        View original post
      </a>
    </div>
  );
}
