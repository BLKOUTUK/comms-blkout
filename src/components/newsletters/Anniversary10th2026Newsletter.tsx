import React from 'react';

interface Anniversary10th2026NewsletterProps {
  previewMode?: boolean;
  recipientName?: string;
  unsubscribeUrl?: string;
}

export const Anniversary10th2026Newsletter: React.FC<Anniversary10th2026NewsletterProps> = ({
  previewMode: _previewMode = false,
  recipientName = 'dear boy',
  unsubscribeUrl = 'https://blkoutuk.com/unsubscribe'
}) => {
  return (
    <div style={{
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#1a1a2e',
      color: '#ffffff'
    }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #6b2d9a 0%, #9b4dca 50%, #d4af37 100%)',
        padding: '40px 20px',
        textAlign: 'center' as const
      }}>
        <div style={{
          fontSize: '64px',
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          10
        </div>
        <div style={{
          fontSize: '18px',
          letterSpacing: '4px',
          textTransform: 'uppercase' as const,
          marginTop: '10px'
        }}>
          YEARS OF LIBERATION
        </div>
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginTop: '20px'
        }}>
          BLKOUT
        </div>
        <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.9 }}>
          2016 - 2026
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 30px' }}>

        {/* Opening */}
        <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '30px' }}>
          {recipientName}, can you believe it? 10 years. 10 beautiful, revolutionary years.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
          On February 10th, 2016, BLKOUT began as a dream - a space where Black queer men
          could exist fully, love freely, and build boldly. Now look at what we've grown together.
        </p>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* 10 Year Journey Section */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          A Decade of Black Men Loving Black Men
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          Let me take you on a journey. In 2016, we started with gatherings in London - just
          brothers finding each other in a world that often forgot we existed. We grew to
          Manchester, Birmingham, Bristol. We survived a pandemic by becoming lifelines for
          each other online. We built partnerships, hosted parties, ran wellness workshops,
          and most importantly - we showed up for each other.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
          Every event. Every conversation. Every hand held. Every brother found. That's 10
          years of proving that Joseph Beam was right: <strong style={{ color: '#d4af37' }}>
          Black men loving Black men IS a revolutionary act.</strong>
        </p>

        {/* Timeline Visual */}
        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2016:</span> Founded in London - the dream begins
          </div>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2017-18:</span> Manchester, Birmingham, Bristol - growing roots
          </div>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2019-20:</span> Pandemic resilience - virtual lifelines
          </div>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2021-22:</span> Digital horizons - first website, newsletter
          </div>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2023-24:</span> Building infrastructure - community consultations
          </div>
          <div>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2025:</span> The revolution, digitized - full platform launch
          </div>
        </div>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* 2025 Section */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          2025: The Year Everything Changed
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          Last year, we transformed from a community project into a liberation technology
          platform. We launched IVOR, our AI companion who's helped thousands of brothers
          find events, access wellness support, and feel less alone. We built an Events
          Calendar, a News Platform, and a Communications Hub with 6 specialized AI agents.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
          And we did something historic: we formalized as a <strong>Community Benefit Society</strong>.
          Democratic governance. Member ownership. 75% of revenue to creators and community -
          <strong style={{ color: '#d4af37' }}> hardcoded, not aspirational</strong>.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
          We're not just a community anymore. We're an institution that will serve Black
          queer men for generations.
        </p>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* Platform Features Section */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          Introducing Our New Platform
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          The anniversary celebration is also a launch party. We're unveiling:
        </p>

        {/* Feature Cards */}
        <div style={{ marginBottom: '30px' }}>

          {/* IVOR AI */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            borderLeft: '4px solid #6b2d9a'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              <span style={{ marginRight: '10px' }}>🤖</span>
              <strong>IVOR AI Enhanced</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
              Now across WhatsApp, Telegram, Instagram, and web with journey-aware memory.
              Your 24/7 culturally competent companion.
            </p>
          </div>

          {/* Events Calendar */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            borderLeft: '4px solid #9b4dca'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              <span style={{ marginRight: '10px' }}>📅</span>
              <strong>Events Calendar 2.0</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
              Personalized recommendations and community reviews. Find your tribe across
              London, Manchester, Birmingham, Bristol, and beyond.
            </p>
          </div>

          {/* News Platform */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            borderLeft: '4px solid #d4af37'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              <span style={{ marginRight: '10px' }}>📰</span>
              <strong>BLKOUT News</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
              Community-driven stories and voices that mainstream media ignores.
              WE are the media now.
            </p>
          </div>

          {/* Shop */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            borderLeft: '4px solid #6b2d9a'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              <span style={{ marginRight: '10px' }}>🛍️</span>
              <strong>BLKOUT Shop</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
              Liberation Journals, apparel, and a creator marketplace.
              <strong> 75% to creators!</strong> Launching January 2026.
            </p>
          </div>

          {/* Coming Soon */}
          <div style={{
            backgroundColor: '#1a1a2e',
            borderRadius: '8px',
            padding: '20px',
            border: '2px dashed #d4af37'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '15px', color: '#d4af37' }}>
              <strong>COMING SOON:</strong>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              <strong>🎵 Critical Frequency</strong> - Social discovery platform (Q1 2026)
            </p>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              <strong>🧘🏾 Down App</strong> - Wellness companion (Spring 2026)
            </p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              <strong>🗳️ Governance Portal</strong> - Democratic decisions for members
            </p>
          </div>
        </div>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* Event Invitation Section */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          Join Us: February 10th, 2026
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          We're celebrating with a hybrid event - in-person in London and virtual worldwide.
        </p>

        {/* Event Details Box */}
        <div style={{
          background: 'linear-gradient(135deg, #6b2d9a 0%, #9b4dca 100%)',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          textAlign: 'center' as const
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            A Decade of Liberation
          </div>
          <div style={{ fontSize: '18px', marginBottom: '25px' }}>
            BLKOUT 10th Anniversary Celebration
          </div>

          <div style={{ marginBottom: '20px', fontSize: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>📅 Date:</strong> February 10th, 2026
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>⏰ Time:</strong> 7:00 PM GMT
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>📍 Format:</strong> London (In-Person) + Zoom (Virtual)
            </div>
            <div>
              <strong>👔 Dress Code:</strong> Purple, Gold & Black
            </div>
          </div>

          {/* CTA Button */}
          <a
            href="https://blkoutuk.com/10years"
            style={{
              display: 'inline-block',
              backgroundColor: '#d4af37',
              color: '#1a1a2e',
              padding: '15px 40px',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '18px',
              marginTop: '10px'
            }}
          >
            REGISTER NOW
          </a>
        </div>

        {/* What to Expect */}
        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#d4af37' }}>
            What to Expect:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '2' }}>
            <li>10 Years in 10 Minutes - Visual timeline presentation</li>
            <li>Live platform feature demos</li>
            <li>Founding member stories</li>
            <li>Critical Frequency + Down app previews</li>
            <li>Anniversary toast + Joseph Beam tribute</li>
            <li>Music, celebration, and connection</li>
          </ul>
        </div>

        {/* Special Perks */}
        <div style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #d4af37',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#d4af37' }}>
            Special Perks for Attendees:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '2' }}>
            <li><strong>Priority beta access</strong> to Critical Frequency</li>
            <li><strong>Exclusive anniversary merchandise</strong> (in-person)</li>
            <li><strong>Digital time capsule recording</strong> for BLKOUT's 20th anniversary</li>
            <li><strong>Virtual swag bag</strong> with digital assets</li>
          </ul>
        </div>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* Closing */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          Thank You
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          10 years. Every brother who showed up to an event. Every subscriber who opened
          a newsletter. Every member who voted in our governance. Every person who believed
          that Black queer men deserve better - <strong>you built this with us</strong>.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
          10 years ago, we dared to dream. Today, we're living it. Tomorrow, we build even bigger.
        </p>

        {/* Quote Box */}
        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          textAlign: 'center' as const,
          fontStyle: 'italic'
        }}>
          <p style={{ fontSize: '18px', margin: '0 0 10px 0', color: '#d4af37' }}>
            "Black men loving Black men is the revolutionary act."
          </p>
          <p style={{ fontSize: '14px', margin: 0, opacity: 0.8 }}>
            - Joseph Beam
          </p>
        </div>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
          After 10 years, {recipientName}, I'd say we've started a whole revolution.
        </p>

        {/* Sign Off */}
        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '10px' }}>
          The ancestors are celebrating with us.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '5px' }}>
          With revolutionary love,
        </p>

        <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '30px', color: '#d4af37' }}>
          IVOR Cummings & The BLKOUT Team
        </p>

        {/* PS */}
        <p style={{
          fontSize: '14px',
          lineHeight: '1.8',
          opacity: 0.8,
          borderLeft: '3px solid #6b2d9a',
          paddingLeft: '15px',
          marginBottom: '30px'
        }}>
          P.S. - Joseph Beam said "Black men loving Black men is the revolutionary act."
          After 10 years, I'd say we've started a whole revolution. See you on February 10th.
        </p>

        {/* CTA Buttons */}
        <div style={{ textAlign: 'center' as const, marginBottom: '30px' }}>
          <a
            href="https://blkoutuk.com/10years"
            style={{
              display: 'inline-block',
              backgroundColor: '#d4af37',
              color: '#1a1a2e',
              padding: '15px 30px',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              marginRight: '15px',
              marginBottom: '10px'
            }}
          >
            Register for Event
          </a>
          <a
            href="https://blkoutuk.com/membership"
            style={{
              display: 'inline-block',
              backgroundColor: '#6b2d9a',
              color: '#ffffff',
              padding: '15px 30px',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '10px'
            }}
          >
            Become a Member
          </a>
        </div>

        {/* Social Links */}
        <div style={{ textAlign: 'center' as const, marginBottom: '30px' }}>
          <p style={{ fontSize: '14px', marginBottom: '15px' }}>
            Follow us @blkoutuk
          </p>
          <a href="https://instagram.com/blkoutuk" style={{ color: '#d4af37', marginRight: '20px', textDecoration: 'none' }}>Instagram</a>
          <a href="https://twitter.com/blkoutuk" style={{ color: '#d4af37', marginRight: '20px', textDecoration: 'none' }}>Twitter</a>
          <a href="https://tiktok.com/@blkoutuk" style={{ color: '#d4af37', marginRight: '20px', textDecoration: 'none' }}>TikTok</a>
          <a href="https://linkedin.com/company/blkoutuk" style={{ color: '#d4af37', textDecoration: 'none' }}>LinkedIn</a>
        </div>

      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#0f0f1a',
        padding: '30px',
        textAlign: 'center' as const,
        fontSize: '12px',
        color: '#888'
      }}>
        <p style={{ marginBottom: '15px' }}>
          BLKOUT UK - Community-Owned Liberation Technology
        </p>
        <p style={{ marginBottom: '15px' }}>
          Registered Community Benefit Society
        </p>
        <p style={{ marginBottom: '15px' }}>
          <a href={unsubscribeUrl} style={{ color: '#888' }}>Unsubscribe</a>
          {' | '}
          <a href="https://blkoutuk.com/privacy" style={{ color: '#888' }}>Privacy Policy</a>
          {' | '}
          <a href="https://blkoutuk.com" style={{ color: '#888' }}>blkoutuk.com</a>
        </p>
        <p style={{ marginTop: '20px', color: '#d4af37' }}>
          #BLKOUT10Years - A Decade of Liberation
        </p>
      </div>
    </div>
  );
};

export default Anniversary10th2026Newsletter;
