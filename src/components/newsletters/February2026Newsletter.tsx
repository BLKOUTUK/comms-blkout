import React from 'react';

/**
 * BLKOUT February 2026 Combined Newsletter
 * 10th Anniversary Celebration + Board Recruitment
 *
 * Subject Line Options (A/B Testing):
 * A: "10 Years of Liberation. Now We Need You."
 * B: "A Decade of Revolution - And 5 Seats at the Table"
 * C: "Happy Birthday, BLKOUT. The Next Chapter Starts With You."
 *
 * Preheader: "Celebrate our 10th anniversary on Feb 10th + apply for the board by Feb 14th"
 */

interface February2026NewsletterProps {
  previewMode?: boolean;
  recipientName?: string;
  unsubscribeUrl?: string;
}

export const February2026Newsletter: React.FC<February2026NewsletterProps> = ({
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

        {/* Opening - IVOR Voice */}
        <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '25px' }}>
          {recipientName}, can you believe it? 10 years. 10 beautiful, revolutionary years.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          On February 10th, 2016, BLKOUT began as a dream - a space where Black queer men
          could exist fully, love freely, and build boldly. Now look at what we've grown together:
          over <strong style={{ color: '#d4af37' }}>10,000 brothers</strong> across the UK, a
          full liberation technology platform, and a registered Community Benefit Society.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
          This February, we're celebrating everything we've built - and inviting you to help lead
          what comes next.
        </p>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* ===== PART 1: 10TH ANNIVERSARY ===== */}

        {/* 10 Year Journey */}
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
          In 2016, we started with gatherings in London - just brothers finding each other in a
          world that often forgot we existed. We grew to Manchester, Birmingham, Bristol. We
          survived a pandemic by becoming lifelines for each other online. We built partnerships,
          hosted parties, ran wellness workshops, and most importantly - we showed up for each other.
        </p>

        {/* Timeline */}
        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2016:</span> Founded in London - the dream begins
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2017-18:</span> Manchester, Birmingham, Bristol - growing roots
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2019-20:</span> Pandemic resilience - virtual lifelines
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2021-22:</span> Digital horizons - first website, newsletter
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2023-24:</span> Building infrastructure - community consultations
          </div>
          <div>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>2025:</span> The revolution, digitized - full platform launch
          </div>
        </div>

        {/* 2025 Achievements */}
        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          Last year, we transformed from a community project into a liberation technology
          platform. We launched AIvor, built an Events Calendar, a News Platform, a Communications
          Hub, and formalized as a <strong>Community Benefit Society</strong> - democratic governance,
          member ownership, 75% of revenue to creators and community,
          <strong style={{ color: '#d4af37' }}> hardcoded, not aspirational</strong>.
        </p>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* Event Invitation */}
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
          marginBottom: '25px',
          textAlign: 'center' as const
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
            A Decade of Liberation
          </div>
          <div style={{ fontSize: '16px', marginBottom: '20px' }}>
            BLKOUT 10th Anniversary Celebration
          </div>
          <div style={{ marginBottom: '20px', fontSize: '15px', lineHeight: '2' }}>
            <div><strong>Date:</strong> February 10th, 2026</div>
            <div><strong>Time:</strong> 7:00 PM GMT</div>
            <div><strong>Format:</strong> London (In-Person) + Zoom (Virtual)</div>
            <div><strong>Dress Code:</strong> Purple, Gold & Black</div>
          </div>
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
              fontSize: '18px'
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
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#d4af37' }}>
            What to Expect:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '2', fontSize: '15px' }}>
            <li>10 Years in 10 Minutes - visual timeline presentation</li>
            <li>Live platform feature demos</li>
            <li>Founding member stories</li>
            <li>Critical Frequency + Down app previews</li>
            <li>Anniversary toast + Joseph Beam tribute</li>
            <li>Music, celebration, and connection</li>
          </ul>
        </div>

        {/* Attendee Perks */}
        <div style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #d4af37',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#d4af37' }}>
            Attendee Perks:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '2', fontSize: '15px' }}>
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

        {/* ===== PART 2: BOARD RECRUITMENT ===== */}

        {/* Bridge Section */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          The Next Decade Needs You
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          10 years of community has brought us here. But the next 10 years need something even
          more important than technology. They need <strong>you</strong>.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          As a Community Benefit Society, BLKOUT is democratically governed and member-owned.
          We're now recruiting <strong style={{ color: '#d4af37' }}>5 board members</strong> to
          guide our strategic direction, protect our values, and hold the organization accountable
          to our community.
        </p>

        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          borderLeft: '4px solid #d4af37'
        }}>
          <p style={{ fontSize: '16px', lineHeight: '1.8', margin: 0, fontStyle: 'italic' }}>
            "We're not looking for figureheads, {recipientName}. We're looking for builders.
            People who understand that governance isn't just paperwork - it's the foundation
            of liberation. Every decision we make echoes through 10,000 lives."
          </p>
        </div>

        {/* The 5 Positions */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          5 Positions. 5 Ways to Lead.
        </h2>

        <div style={{ marginBottom: '30px' }}>
          {/* Chair */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '12px',
            borderLeft: '4px solid #d4af37'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '6px' }}>
              <strong style={{ color: '#d4af37' }}>Chair</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Lead board meetings, represent BLKOUT publicly, and ensure governance excellence.
              The voice of our collective vision.
            </p>
          </div>

          {/* Treasurer */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '12px',
            borderLeft: '4px solid #6b2d9a'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '6px' }}>
              <strong style={{ color: '#d4af37' }}>Treasurer</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Oversee financial health, budgeting, and reporting. Ensure our 75% creator revenue
              share is honored. Liberation economics in action.
            </p>
          </div>

          {/* Secretary */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '12px',
            borderLeft: '4px solid #9b4dca'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '6px' }}>
              <strong style={{ color: '#d4af37' }}>Secretary</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Maintain records, coordinate communications, ensure compliance. The organizational
              memory of our movement.
            </p>
          </div>

          {/* Technology Director */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '12px',
            borderLeft: '4px solid #d4af37'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '6px' }}>
              <strong style={{ color: '#d4af37' }}>Technology Director</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Guide platform development, data sovereignty, and digital strategy. Technical
              background valued but not required.
            </p>
          </div>

          {/* Community Director */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '12px',
            borderLeft: '4px solid #6b2d9a'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '6px' }}>
              <strong style={{ color: '#d4af37' }}>Community Director</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Champion member needs, partnerships, and community engagement. Stay rooted in the
              lived experiences of Black queer men across the UK.
            </p>
          </div>
        </div>

        {/* Commitment & Benefits - Side by Side */}
        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#d4af37' }}>
            The Commitment:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '2', fontSize: '15px' }}>
            <li><strong>4-6 hours per month</strong> - meetings, prep, and correspondence</li>
            <li><strong>Quarterly board meetings</strong> - hybrid (London + virtual)</li>
            <li><strong>3-year term</strong> - renewable based on member vote</li>
            <li><strong>Voluntary role</strong> - expenses reimbursed</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #d4af37',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#d4af37' }}>
            What You'll Gain:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '2', fontSize: '15px' }}>
            <li><strong>Leadership experience</strong> in a registered Community Benefit Society</li>
            <li><strong>Governance training</strong> and professional development</li>
            <li><strong>Network</strong> with tech, nonprofit, and community leaders</li>
            <li><strong>Direct impact</strong> on 10,000+ lives</li>
            <li><strong>Legacy</strong> - help build an institution that outlasts us all</li>
          </ul>
        </div>

        {/* Who Should Apply */}
        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          You don't need a fancy CV or years of board experience. What we need is commitment,
          integrity, and care for our community.
        </p>

        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          borderLeft: '4px solid #d4af37'
        }}>
          <p style={{ fontSize: '15px', lineHeight: '1.8', margin: 0 }}>
            <strong style={{ color: '#d4af37' }}>Especially welcome:</strong> First-time board
            members, people outside London, those with lived experience in health, housing,
            immigration, or other community challenges. Formal governance training will be provided.
          </p>
        </div>

        {/* Application Timeline */}
        <div style={{
          background: 'linear-gradient(135deg, #6b2d9a 0%, #9b4dca 100%)',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '25px',
          textAlign: 'center' as const
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            Board Recruitment Timeline
          </div>
          <div style={{ marginBottom: '12px', fontSize: '15px' }}>
            <strong>EOI Opens:</strong> Now
          </div>
          <div style={{ marginBottom: '12px', fontSize: '15px' }}>
            <strong>EOI Deadline:</strong> February 14th, 2026
          </div>
          <div style={{ marginBottom: '12px', fontSize: '15px' }}>
            <strong>Info Session (BLKOUTHUB):</strong> February 15-16th, 2026
          </div>
          <div style={{ fontSize: '15px' }}>
            <strong>Board Announcement:</strong> February 21st, 2026
          </div>
        </div>

        {/* Board CTA */}
        <div style={{ textAlign: 'center' as const, marginBottom: '30px' }}>
          <a
            href="https://blkoutuk.com/governance"
            style={{
              display: 'inline-block',
              backgroundColor: '#d4af37',
              color: '#1a1a2e',
              padding: '18px 50px',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '20px'
            }}
          >
            APPLY FOR THE BOARD
          </a>
          <p style={{ fontSize: '14px', marginTop: '15px', opacity: 0.8 }}>
            Questions? Email{' '}
            <a href="mailto:blkoutuk@gmail.com" style={{ color: '#d4af37', textDecoration: 'underline' }}>
              blkoutuk@gmail.com
            </a>
          </p>
        </div>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* ===== CLOSING ===== */}

        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          Two Ways to Shape the Next Decade
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          {recipientName}, this February gives you two chances to show up for our community:
        </p>

        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{ marginBottom: '15px', fontSize: '16px' }}>
            <strong style={{ color: '#d4af37' }}>Feb 10th:</strong> Celebrate 10 years with us -
            register for the anniversary event
          </div>
          <div style={{ fontSize: '16px' }}>
            <strong style={{ color: '#d4af37' }}>By Feb 14th:</strong> Apply for the board -
            help govern the next decade of liberation
          </div>
        </div>

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

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          Black men <em>governing</em> for Black men? That's how we build the revolution to last.
          After 10 years, {recipientName}, I'd say we've started something that can't be stopped.
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
          P.S. - Know someone who'd be perfect for the board? Forward this email. Sometimes the
          best leaders need a gentle nudge to step up. Be that nudge.
        </p>

        {/* Dual CTA Buttons */}
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
            Register for Feb 10th
          </a>
          <a
            href="https://blkoutuk.com/governance"
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
            Apply for the Board
          </a>
        </div>

        {/* Forward / Nominate */}
        <div style={{ textAlign: 'center' as const, marginBottom: '30px' }}>
          <a
            href="mailto:?subject=BLKOUT%2010th%20Anniversary%20%2B%20Board%20Recruitment&body=Two%20chances%20to%20shape%20our%20community%3A%20celebrate%2010%20years%20on%20Feb%2010th%20and%20apply%20for%20the%20board%20by%20Feb%2014th.%20Details%20at%20blkoutuk.com"
            style={{
              display: 'inline-block',
              backgroundColor: 'transparent',
              color: '#d4af37',
              padding: '12px 25px',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '14px',
              border: '2px solid #d4af37'
            }}
          >
            Forward to a Brother
          </a>
        </div>

        {/* Social Links */}
        <div style={{ textAlign: 'center' as const, marginBottom: '30px' }}>
          <p style={{ fontSize: '14px', marginBottom: '15px' }}>
            Follow us @blkoutuk
          </p>
          <a href="https://instagram.com/blkout_uk" style={{ color: '#d4af37', marginRight: '20px', textDecoration: 'none' }}>Instagram</a>
          <a href="https://tiktok.com/@blkoutuk" style={{ color: '#d4af37', marginRight: '20px', textDecoration: 'none' }}>TikTok</a>
          <a href="https://linkedin.com/company/blkout-uk" style={{ color: '#d4af37', textDecoration: 'none' }}>LinkedIn</a>
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
          #BLKOUT10Years #BLKOUTBoard
        </p>
      </div>
    </div>
  );
};

export default February2026Newsletter;
