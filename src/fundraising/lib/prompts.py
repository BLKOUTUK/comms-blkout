"""Critical Frequency prompt library — codified from the NotebookLM workflow doc.

Each entry: id, output_type, audience (id or "any"), prompt template (uses {profile_block}
and {claims} placeholders), target word count, output dir.
"""

from .profiles import profile_block, SIX_UNCHANGING_CLAIMS


def briefing_template(profile_id: str, structure: str) -> str:
    return (
        f"Generate a partnership briefing of approximately 1,500 words tailored for the following audience:\n\n"
        f"{profile_block(profile_id)}\n\n"
        f"STRUCTURE INSTRUCTIONS:\n{structure}\n\n"
        f"TONE: peer-to-peer, intellectually serious, evidence-led. Avoid charity register.\n"
        f"LANGUAGE: British English.\n"
        f"CITATIONS: cite source statistics with the original caveats intact.\n\n"
        f"{SIX_UNCHANGING_CLAIMS}\n\n"
        f"Output: the full briefing only, no preamble."
    )


PROMPTS = [
    # --- Briefings ---
    {
        "id": "briefing-A-policy",
        "type": "briefing",
        "audience": "A",
        "out_dir": "A-policy-funders",
        "filename": "briefing.md",
        "prompt": briefing_template(
            "A",
            "- Lead with what they care about most: prevention economics and the data-gap.\n"
            "- Anchor the opening on the detention cost figures from the Detention Estimate source, with original caveats intact.\n"
            "- Move quickly to the network-science mechanism (complex contagion, the 25% threshold, the 45,000 exposure points).\n"
            "- Treat the seven-lives material lightly here — one sentence reference only.\n"
            "- Close on the foundation-year specification and what the £250–500k unlocks.\n"
            "- Additional tone note: evidence-led, no charity register, weight Narrative + Detention Estimate + Phased Partnership most heavily."
        ),
    },
    {
        "id": "briefing-B-arts-culture",
        "type": "briefing",
        "audience": "B",
        "out_dir": "B-arts-culture",
        "filename": "briefing.md",
        "prompt": briefing_template(
            "B",
            "- Lead with the cultural infrastructure framing and the under-archived community.\n"
            "- Bring the Seven Lives forward as the methodological anchor — describe how each historical figure embeds in a programme element.\n"
            "- Treat the network-science framing more lightly here — present it as the rigorous mechanism underneath the cultural work, but not as the main register.\n"
            "- Close on the Commons as openly-licensed sector property.\n"
            "- Additional tone note: warm, curatorial, considered."
        ),
    },
    {
        "id": "briefing-C-nhs-clinical",
        "type": "briefing",
        "audience": "C",
        "out_dir": "C-nhs-clinical",
        "filename": "briefing.md",
        "prompt": briefing_template(
            "C",
            "- Lead with the clinical case: detention rates, completion-rate disparities, the partner-ecology framing.\n"
            "- Position Critical Frequency as the relational infrastructure around statutory services, never as a replacement.\n"
            "- Bring forward the systems change leaders as the embedded-practice piece they will recognise.\n"
            "- Close on the partner-coalition phase of the foundation year.\n"
            "- Additional tone note: professional, equity-fluent, partnership-oriented. Use NHS-current terminology."
        ),
    },
    {
        "id": "briefing-D-peer-orgs",
        "type": "briefing",
        "audience": "D",
        "out_dir": "D-peer-orgs",
        "filename": "briefing.md",
        "prompt": briefing_template(
            "D",
            "- Lead with the Commons as shared sector property — openly licensed fair-use framework, cooperative governance template, shared archive protocols.\n"
            "- Make explicit: BLKOUT is not competing for your funding; we are building substrate.\n"
            "- Treat detention/economic figures lightly; the case lands through solidarity infrastructure, not prevention economics.\n"
            "- Close on the Advisory Circle and Free Ticketing service as concrete commons offers.\n"
            "- Additional tone note: warm, peer-to-peer, anti-scope-creep, explicitly non-encroaching."
        ),
    },
    {
        "id": "briefing-E-academic",
        "type": "briefing",
        "audience": "E",
        "out_dir": "E-academic",
        "filename": "briefing.md",
        "prompt": briefing_template(
            "E",
            "- Lead with the methodological contribution: complex contagion applied to mental health intervention as a novel move.\n"
            "- Anchor on the architecture sections of the Narrative; foreground the action-learning frame as ethics-integrated-into-method, not ethics-as-gate.\n"
            "- Make explicit the uncharted territory of community-led data stewardship and the scholarly partnership it invites.\n"
            "- Close on the evaluation framework in Phased Partnership and what scholarly partners gain.\n"
            "- Additional tone note: intellectually serious, epistemically careful, peer-to-peer with senior academics."
        ),
    },
    {
        "id": "briefing-F-diasporic",
        "type": "briefing",
        "audience": "F",
        "out_dir": "F-diasporic",
        "filename": "briefing.md",
        "prompt": briefing_template(
            "F",
            "- Lead with the already-diasporic lineage: Beam and Baltrop (US) in the Seven Lives; Pasuka (Jamaica); Belfield Clarke (Barbados).\n"
            "- Frame BLKOUT as contributing to a transnational movement, not exporting from a UK centre.\n"
            "- Foreground the openly-licensed Commons as adoptable apparatus.\n"
            "- Close on what transnational adoption looks like in practice.\n"
            "- Additional tone note: scholarly diasporic register; British English but with diasporic awareness."
        ),
    },
    {
        "id": "briefing-G-journalists",
        "type": "briefing",
        "audience": "G",
        "out_dir": "G-journalists",
        "filename": "briefing.md",
        "prompt": briefing_template(
            "G",
            "- Lead with the news hook: the cornerstone partnership ask is news; the data-gap is investigation; the Seven Lives is the long-read; the CBS asset-lock is the structural angle.\n"
            "- Foreground Rob Berkeley's ten-year arc as the founder narrative.\n"
            "- Use specific, citable figures with caveats intact.\n"
            "- Offer multiple hooks so different journalists can take different angles.\n"
            "- Close with what a feature, an investigation, and a long-read each look like.\n"
            "- Additional tone note: direct, specific, hook-forward. Avoid PR register."
        ),
    },
    {
        "id": "briefing-H-philanthropists",
        "type": "briefing",
        "audience": "H",
        "out_dir": "H-philanthropists",
        "filename": "briefing.md",
        "prompt": briefing_template(
            "H",
            "- Lead with vision and the cornerstone partner role.\n"
            "- Foreground founder credibility — ten-year track record as proof of seriousness, not biography.\n"
            "- Make the action-learning frame explicit as genuine participation rather than transactional funding.\n"
            "- Anchor on the CBS asset-lock as the structural commitment to non-extraction.\n"
            "- Close on legacy and what £4–6m unlocks across the foundation year and the seven-year arc.\n"
            "- Additional tone note: warm, considered, founder-voice, intimacy of engagement."
        ),
    },
    # --- FAQ (A and D, explicit doc prompts) ---
    {
        "id": "faq-A-policy",
        "type": "faq",
        "audience": "A",
        "out_dir": "A-policy-funders",
        "filename": "faq.md",
        "prompt": (
            f"Generate an FAQ tailored for the following audience:\n\n"
            f"{profile_block('A')}\n\n"
            f"STRUCTURE:\n"
            f"- Cover 18–20 questions a fund officer would actually ask before recommending the work to their board.\n"
            f"- Group questions into six sections: Evidence, Mechanism, Cost, Governance, Risk, Exit.\n"
            f"- Anticipate sceptical questions (e.g. 'what if the network theory doesn't transfer to mental health?', 'what happens if BLKOUT's founder leaves?').\n"
            f"- Answer with the source material, acknowledging genuine uncertainty where it exists.\n"
            f"- Each answer 80–150 words.\n\n"
            f"TONE: candid, peer-to-peer, no defensive boilerplate.\n"
            f"LANGUAGE: British English.\n\n"
            f"{SIX_UNCHANGING_CLAIMS}\n\n"
            f"Output: the full FAQ only, no preamble."
        ),
    },
    {
        "id": "faq-D-peer",
        "type": "faq",
        "audience": "D",
        "out_dir": "D-peer-orgs",
        "filename": "faq.md",
        "prompt": (
            f"Generate an FAQ tailored for the following audience:\n\n"
            f"{profile_block('D')}\n\n"
            f"STRUCTURE:\n"
            f"- Focus entirely on the Commons and the Advisory Circle.\n"
            f"- Anticipate the questions a peer organisation actually has: 'is this scope creep into our space?', 'how does my organisation use the openly-licensed governance documents?', 'who decides what goes into the Commons?', 'can our staff sit on the Advisory Circle?'.\n"
            f"- Answer warmly, with practical detail. Avoid funder-register entirely.\n"
            f"- 15 questions, ~100 words each.\n\n"
            f"TONE: warm, peer-to-peer, practical.\n"
            f"LANGUAGE: British English.\n\n"
            f"{SIX_UNCHANGING_CLAIMS}\n\n"
            f"Output: the full FAQ only, no preamble."
        ),
    },
    # --- Talking points (H, explicit doc prompt) ---
    {
        "id": "talking-points-H-philanthropist",
        "type": "talking-points",
        "audience": "H",
        "out_dir": "H-philanthropists",
        "filename": "talking-points.md",
        "prompt": (
            f"Generate a one-page talking-points document for a 30-minute introductory conversation with the following audience:\n\n"
            f"{profile_block('H')}\n\n"
            f"STRUCTURE:\n"
            f"- Opening hook (one sentence).\n"
            f"- Three landing claims (one sentence each).\n"
            f"- Two specific anchors of credibility (CBS asset-lock + ten-year track record + Advisory Circle — pick the strongest two for an opening conversation).\n"
            f"- The ask (£4–6m, cornerstone partner).\n"
            f"- One open invitation (action-learning participation).\n"
            f"- Total under 400 words.\n"
            f"- Designed to be glanced at before the call and forgotten during it.\n\n"
            f"TONE: warm, considered, founder-voice.\n"
            f"LANGUAGE: British English.\n\n"
            f"{SIX_UNCHANGING_CLAIMS}\n\n"
            f"Output: the talking-points only, no preamble."
        ),
    },
    # --- Reframes ---
    {
        "id": "reframe-B-whats-mistuned",
        "type": "reframe",
        "audience": "B",
        "out_dir": "reframes",
        "filename": "B-whats-mistuned-curatorial.md",
        "prompt": (
            f"Take the section of the source material titled 'What's mistuned' and rewrite it for the following audience in a curatorial register rather than a policy register:\n\n"
            f"{profile_block('B')}\n\n"
            f"STRUCTURE:\n"
            f"- Same three frequencies (diagnostic, evidence, intervention), but landing in language an arts commissioner uses.\n"
            f"- Approximately 350 words.\n\n"
            f"TONE: curatorial, considered, warm.\n"
            f"LANGUAGE: British English.\n\n"
            f"{SIX_UNCHANGING_CLAIMS}\n\n"
            f"Output: the reframed section only, no preamble."
        ),
    },
    {
        "id": "personal-letter-H-template",
        "type": "personal-letter",
        "audience": "H",
        "out_dir": "H-philanthropists",
        "filename": "personal-letter-template.md",
        "prompt": (
            f"Take the partnership ask section (the £4–6m commitment, the foundation year, the milestone tranches) and rewrite as a personal letter from Rob Berkeley to a specific named individual philanthropist [INSERT NAME].\n\n"
            f"AUDIENCE CONTEXT:\n{profile_block('H')}\n\n"
            f"STRUCTURE:\n"
            f"- Length: under 600 words.\n"
            f"- Warm, candid, founder-voice.\n"
            f"- Keep [INSERT NAME] as a placeholder throughout — this is a template.\n"
            f"- End with a specific next step (a 45-minute conversation).\n\n"
            f"TONE: warm, candid, founder-voice. First-person from Rob Berkeley.\n"
            f"LANGUAGE: British English.\n\n"
            f"{SIX_UNCHANGING_CLAIMS}\n\n"
            f"Note: NotebookLM generates a serviceable first draft. Rob expects to rewrite the relational layer by hand.\n\n"
            f"Output: the letter only, no preamble."
        ),
    },
    {
        "id": "pasuka-pushback",
        "type": "pushback",
        "audience": "any",
        "out_dir": "reframes",
        "filename": "pasuka-register-pushback.md",
        "prompt": (
            f"Generate a 300-word piece in the register of Berto Pasuka's letter to the New Statesman critic — a pushback to an imagined funder objection that 'network-positioned therapy is unproven so we should fund something more established.'\n\n"
            f"STRUCTURE:\n"
            f"- Defend the work with humour and intellectual confidence.\n"
            f"- Lean into the deadpan register the Threshold Field aesthetic suggests.\n"
            f"- Hold the genuine uncertainty as strength — do not soften it into 'tested methodology'.\n\n"
            f"TONE: deadpan, confident, faintly literary.\n"
            f"LANGUAGE: British English.\n\n"
            f"{SIX_UNCHANGING_CLAIMS}\n\n"
            f"Output: the 300-word piece only, no preamble."
        ),
    },
    # --- Difficult-conversation prompts ---
    {
        "id": "founder-dependency-response",
        "type": "difficult-conversation",
        "audience": "any",
        "out_dir": "difficult-conversations",
        "filename": "founder-dependency.md",
        "prompt": (
            f"Generate a one-page response document for the question: 'How does BLKOUT prevent the founder-dependency risk that has collapsed other Black-led organisations after charismatic founders left?'\n\n"
            f"STRUCTURE:\n"
            f"- Answer using actual structural features: CBS asset-lock, seven-director cooperative board, Advisory Circle distribution of authority, openly-licensed documentation that lets work continue under any leadership.\n"
            f"- Be candid about the historical pattern this question references without flattening it.\n"
            f"- Approximately one page (400–500 words).\n\n"
            f"TONE: candid, structural, non-defensive.\n"
            f"LANGUAGE: British English.\n\n"
            f"{SIX_UNCHANGING_CLAIMS}\n\n"
            f"Output: the response only, no preamble."
        ),
    },
    {
        "id": "why-blkout-not-larger-institution",
        "type": "difficult-conversation",
        "audience": "any",
        "out_dir": "difficult-conversations",
        "filename": "why-blkout-not-larger-institution.md",
        "prompt": (
            f"Generate a 400-word response to the implicit question: 'Why is BLKOUT the right organisation to hold this work, rather than [a larger established equity or health organisation]?'\n\n"
            f"STRUCTURE:\n"
            f"- Answer from a position of considered confidence.\n"
            f"- Anchor on: the lineage of ten years of community trust; the cooperative legal home; the existing 200+ member base; the lived relational expertise that cannot be assembled from institutional resources.\n"
            f"- Acknowledge that larger institutions could partner with BLKOUT on this work, but only BLKOUT can hold the trust this work requires.\n\n"
            f"TONE: considered, confident, non-defensive.\n"
            f"LANGUAGE: British English.\n\n"
            f"{SIX_UNCHANGING_CLAIMS}\n\n"
            f"Output: the response only, no preamble."
        ),
    },
]
