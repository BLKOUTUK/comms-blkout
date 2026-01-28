import React from 'react';

/**
 * BLKOUT Board Recruitment 2026 Newsletter
 * Campaign to recruit 5 board members by February 14th, 2026
 *
 * Positions: Chair, Treasurer, Secretary, Technology Director, Community Director
 * Voice: IVOR Cummings (warm, wise, inviting)
 *
 * Subject Line Options (A/B Testing):
 * A: "Shape Our Future: Join the BLKOUT Board"
 * B: "We Need Your Leadership, Dear Boy"
 * C: "5 Seats. 10,000 Brothers. One Movement."
 *
 * Preheader: "Help govern the UK's first community-owned platform for Black queer men"
 */

interface BoardRecruitment2026NewsletterProps {
  previewMode?: boolean;
  recipientName?: string;
  unsubscribeUrl?: string;
}

export const BoardRecruitment2026Newsletter: React.FC<BoardRecruitment2026NewsletterProps> = ({
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
          fontSize: '14px',
          letterSpacing: '3px',
          textTransform: 'uppercase' as const,
          marginBottom: '15px',
          opacity: 0.9
        }}>
          A Call to Leadership
        </div>
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '10px'
        }}>
          Join the BLKOUT Board
        </div>
        <div style={{
          fontSize: '16px',
          marginTop: '15px',
          opacity: 0.95
        }}>
          5 Positions | 10,000+ Community Members | One Vision
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 30px' }}>

        {/* Opening - IVOR Voice */}
        <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '25px' }}>
          {recipientName}, I need to tell you something important.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          For nearly 10 years, BLKOUT has been building something revolutionary - a
          community-owned platform where Black queer men can thrive, connect, and lead.
          We've grown to over <strong style={{ color: '#d4af37' }}>10,000 brothers</strong> across
          the UK. We've launched IVOR AI, our Events Calendar, and our News Platform.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
          Now we need something even more important than technology. We need <strong>you</strong>.
        </p>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* Why We Need Board Members */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          Why We Need Board Members Now
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          BLKOUT is a <strong>Community Benefit Society</strong> - democratically
          governed, member-owned, and legally structured to serve our community forever.
          But a society is only as strong as its leadership.
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

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>
          Our board will guide strategic direction, ensure financial sustainability,
          protect our values, and hold the organization accountable to our community.
          This is how we build institutions that last for generations.
        </p>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* The 5 Positions */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          The 5 Positions We're Filling
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          Each role is vital. Each brings unique gifts to our collective table.
        </p>

        {/* Position Cards */}
        <div style={{ marginBottom: '30px' }}>

          {/* Chair */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            borderLeft: '4px solid #d4af37'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              <span style={{ marginRight: '10px' }}>👑</span>
              <strong style={{ color: '#d4af37' }}>Chair</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Lead board meetings, represent BLKOUT publicly, and ensure governance
              excellence. You'll be the voice of our collective vision and the guardian
              of our democratic processes.
            </p>
          </div>

          {/* Treasurer */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            borderLeft: '4px solid #6b2d9a'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              <span style={{ marginRight: '10px' }}>💰</span>
              <strong style={{ color: '#d4af37' }}>Treasurer</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Oversee financial health, budgeting, and reporting. Ensure our 75%
              creator revenue share is honored. Financial literacy meets liberation economics.
            </p>
          </div>

          {/* Secretary */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            borderLeft: '4px solid #9b4dca'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              <span style={{ marginRight: '10px' }}>📋</span>
              <strong style={{ color: '#d4af37' }}>Secretary</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Maintain records, coordinate communications, ensure compliance.
              The organizational memory and administrative backbone of our movement.
            </p>
          </div>

          {/* Technology Director */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            borderLeft: '4px solid #d4af37'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              <span style={{ marginRight: '10px' }}>💻</span>
              <strong style={{ color: '#d4af37' }}>Technology Director</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Guide platform development, data sovereignty, and digital strategy.
              Help ensure our tech serves liberation, not extraction. Technical
              background valued but not required.
            </p>
          </div>

          {/* Community Director */}
          <div style={{
            backgroundColor: '#252547',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            borderLeft: '4px solid #6b2d9a'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              <span style={{ marginRight: '10px' }}>🤝</span>
              <strong style={{ color: '#d4af37' }}>Community Director</strong>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Champion member needs, partnerships, and community engagement.
              Ensure we stay rooted in the lived experiences of Black queer men
              across the UK.
            </p>
          </div>

        </div>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* What You'll Do & Get */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          What You'll Do & What You'll Get
        </h2>

        {/* Commitment Box */}
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

        {/* What You Get Box */}
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

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* Who Should Apply */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          Who Should Apply
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          Let me be clear, {recipientName}: you don't need a fancy CV or years of board
          experience. What we need is commitment, integrity, and care for our community.
        </p>

        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#d4af37' }}>
            We're Looking For People Who:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '2', fontSize: '15px' }}>
            <li>Identify as Black queer men (or allies with deep community ties)</li>
            <li>Believe in democratic, community-owned governance</li>
            <li>Can commit 4-6 hours monthly for 3 years</li>
            <li>Bring diverse perspectives - age, location, profession, life experience</li>
            <li>Are willing to learn and grow in the role</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          borderLeft: '4px solid #d4af37'
        }}>
          <p style={{ fontSize: '16px', lineHeight: '1.8', margin: 0 }}>
            <strong style={{ color: '#d4af37' }}>Especially welcome:</strong> First-time board
            members, people outside London, those with lived experience in health, housing,
            immigration, or other community challenges. Formal governance training will be provided.
          </p>
        </div>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* Application Process */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          How to Apply
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          The process is simple. We want to hear from you, not test you.
        </p>

        {/* Timeline */}
        <div style={{
          backgroundColor: '#252547',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>Step 1:</span> Join or reactivate your{' '}
            <a href="https://blkouthub.com" style={{ color: '#d4af37', textDecoration: 'underline' }}>
              BLKOUTHUB membership
            </a>{' '}
            (required for all candidates)
          </div>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>Step 2:</span> Complete the EOI form on our{' '}
            <a href="https://blkoutuk.com/governance" style={{ color: '#d4af37', textDecoration: 'underline' }}>
              Governance page
            </a>{' '}
            (15-20 minutes)
          </div>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>Step 3:</span> Attend our
            information session on BLKOUTHUB (Feb 15-16)
          </div>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>Step 4:</span> Informal
            conversation with current leadership (30 minutes)
          </div>
          <div>
            <span style={{ color: '#d4af37', fontWeight: 'bold' }}>Step 5:</span> Board
            review, selection, and onboarding (late February)
          </div>
        </div>

        {/* Key Dates Box */}
        <div style={{
          background: 'linear-gradient(135deg, #6b2d9a 0%, #9b4dca 100%)',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          textAlign: 'center' as const
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
            Key Dates
          </div>
          <div style={{ marginBottom: '15px', fontSize: '16px' }}>
            <strong>EOI Opens:</strong> Now
          </div>
          <div style={{ marginBottom: '15px', fontSize: '16px' }}>
            <strong>EOI Deadline:</strong> February 14th, 2026
          </div>
          <div style={{ marginBottom: '15px', fontSize: '16px' }}>
            <strong>Info Session (BLKOUTHUB):</strong> February 15-16th, 2026
          </div>
          <div style={{ fontSize: '16px' }}>
            <strong>Board Announcement:</strong> February 21st, 2026
          </div>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center' as const, marginBottom: '40px' }}>
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
            APPLY NOW
          </a>
          <p style={{ fontSize: '14px', marginTop: '15px', opacity: 0.8 }}>
            Questions? Email{' '}
            <a href="mailto:governance@blkoutuk.com" style={{ color: '#d4af37', textDecoration: 'underline' }}>
              governance@blkoutuk.com
            </a>
          </p>
        </div>

        {/* Section Divider */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          margin: '40px 0'
        }} />

        {/* Closing - Strong IVOR Voice */}
        <h2 style={{
          color: '#d4af37',
          fontSize: '24px',
          marginBottom: '20px',
          borderBottom: '2px solid #6b2d9a',
          paddingBottom: '10px'
        }}>
          A Final Word
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          {recipientName}, I want you to imagine something.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' }}>
          Imagine sitting at a table where every decision centers Black queer wellbeing.
          Where technology serves liberation, not surveillance. Where 75% of revenue goes
          to creators because that's not just policy - it's code. Where 10,000 brothers
          across the UK have a voice through democratic governance.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '25px' }}>
          That table exists. And there's a seat with your name on it.
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
          Black men <em>governing</em> for Black men? That's how we build the revolution to last.
        </p>

        {/* Sign Off */}
        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '10px' }}>
          The ancestors are watching. Let's make them proud.
        </p>

        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '5px' }}>
          With revolutionary love and hope,
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
          P.S. - Know someone who'd be perfect for the board? Forward this email to them.
          Sometimes the best leaders need a gentle nudge to step up. Be that nudge.
        </p>

        {/* Secondary CTA */}
        <div style={{ textAlign: 'center' as const, marginBottom: '30px' }}>
          <a
            href="https://blkoutuk.com/governance"
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
            Apply for the Board
          </a>
          <a
            href="mailto:?subject=BLKOUT%20Board%20Recruitment&body=I%20thought%20you%20might%20be%20interested%20in%20this%20opportunity%20to%20join%20the%20BLKOUT%20board.%20Apply%20at%20blkoutuk.com/governance"
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
            Nominate Someone
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
          #BLKOUTBoard - Shape Our Future
        </p>

        {/* Application Link Box */}
        <div style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #6b2d9a',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <p style={{ margin: '0 0 5px 0', color: '#d4af37', fontWeight: 'bold' }}>
            Apply for the Board
          </p>
          <a
            href="https://blkoutuk.com/governance"
            style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px' }}
          >
            blkoutuk.com/governance
          </a>
        </div>
      </div>
    </div>
  );
};

export default BoardRecruitment2026Newsletter;
