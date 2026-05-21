"""Critical Frequency audience profiles — codified from the NotebookLM workflow doc.

Each profile carries: name, example partners, priorities, framing that lands, pushbacks,
and source emphasis. These are inlined into NotebookLM prompts since NotebookLM cannot see
the workflow document itself.
"""

PROFILES = {
    "A": {
        "name": "Mental-health policy funders",
        "example_partners": [
            "Wellcome Mental Health",
            "The Health Foundation",
            "Esmée Fairbairn Social Change Fund",
            "MQ Mental Health Research",
        ],
        "priorities": "evidence-led, prevention economics, scale, system change, measurable outcomes",
        "framing": "the data-gap as itself a system failure; prevention investment vs crisis-cost (£12–16M annual detention); network science as a methodological advance",
        "pushback": '"Show me the evidence this works." — Reply: building the evidence base IS the work, because the existing data infrastructure does not see this population. Network-positioned therapy is a novel clinical concept; the foundation year is where the evaluation framework is built.',
        "source_emphasis": "Narrative + Detention Estimate + Phased Partnership",
    },
    "B": {
        "name": "Arts, culture, and heritage funders",
        "example_partners": [
            "National Lottery Heritage Fund",
            "Paul Hamlyn Foundation",
            "Esmée Fairbairn arts strand",
            "Wolfson Foundation",
            "Arts Council England",
            "Henry Smith Charity",
        ],
        "priorities": "cultural infrastructure, archival significance, public engagement, voice, community-led practice",
        "framing": "cultural memory infrastructure for an under-archived community; recognition as psychic medicine; the Commons as openly-licensed sector property",
        "pushback": '"How does this fit with mental health, which is a different sector?" — Reply: the sectors are the system\'s, not the community\'s. Cultural recognition is itself the prevention work. Seven Lives shows this directly.',
        "source_emphasis": "Narrative + Seven Lives Script",
    },
    "C": {
        "name": "NHS, public-health and clinical partners",
        "example_partners": [
            "NHS Race & Health Observatory",
            "OHID",
            "Integrated care board commissioners",
            "Mental health trust senior leaders",
        ],
        "priorities": "clinical pathways, equity, integration, sustainability, partnership not displacement",
        "framing": "networked therapy as service-improvement contribution; the detention cost-avoidance economic case; community as partner ecology around statutory services, not in competition with them",
        "pushback": '"This isn\'t a service we can commission as a single line." — Reply: it\'s the partner ecology around the service. Critical Frequency builds the trusted intermediary infrastructure that statutory commissioning has been unable to build itself.',
        "source_emphasis": "Narrative + Detention Estimate + Phased Partnership",
    },
    "D": {
        "name": "Black, queer, equity peer organisations",
        "example_partners": [
            "Black Equity Organisation",
            "Stonewall",
            "Black Thrive",
            "Imkaan",
            "Switchboard",
            "Akina Mama wa Afrika",
            "UK Black Pride",
        ],
        "priorities": "solidarity, shared infrastructure, mutual aid, reparations, voice, no encroachment on existing remit",
        "framing": "the Commons gives the wider sector the same tools — openly licensed fair-use framework, cooperative governance template, shared archive protocols. BLKOUT is not competing for your funding; we are building the substrate that all of our work can stand on.",
        "pushback": '"What\'s in it for us?" / "Is this scope creep?" — Reply: the Commons is for you. The Advisory Circle is open. The Free Ticketing service is open. Your remit stays yours; the substrate gets stronger.',
        "source_emphasis": "Narrative + the Architecture sections specifically",
    },
    "E": {
        "name": "Academic and research partners",
        "example_partners": [
            "Medical sociology departments",
            "Public health institutes",
            "Race-and-health scholars",
            "Queer studies",
            "IP and digital rights scholars",
        ],
        "priorities": "epistemology, methodological rigour, theoretical contribution, ethics, IP, data stewardship",
        "framing": "complex contagion applied to mental health intervention is a genuinely novel methodological move; community-led data stewardship is uncharted territory needing scholarly partners; action-learning frame integrates ethics into method rather than treating ethics as a gate",
        "pushback": "Rigour, ethics, IP. — Reply: ethics is held by community governance (CBS structure + Advisory Circle); rigour is built into the action-learning frame; IP is openly licensed by design.",
        "source_emphasis": "Narrative (architecture sections) + Detention Estimate (methodology) + Phased Partnership (evaluation framework)",
    },
    "F": {
        "name": "Diasporic and international peer partners",
        "example_partners": [
            "Audre Lorde Project (NYC)",
            "Black queer organising collectives in Toronto / Lagos / Johannesburg / São Paulo",
            "Schwules Museum Berlin",
            "Queer Black scholars in the Caribbean",
        ],
        "priorities": "transnational solidarity, shared lineage, mutual learning, transferable methodology",
        "framing": "the lineage is already diasporic (Beam and Baltrop are US figures in the Seven Lives; Pasuka came from Jamaica; Belfield Clarke from Barbados). We are contributing to a transnational movement, not exporting from a UK centre. The Commons is openly licensed for adoption.",
        "pushback": '"Why should we engage with a UK project?" — Reply: because the work is already in conversation with yours; the lineage is shared; the methodology is designed for adoption.',
        "source_emphasis": "Narrative + Seven Lives Script",
    },
    "G": {
        "name": "Journalists and media partners",
        "example_partners": [
            "The Guardian",
            "Black Ballad",
            "Tortoise",
            "Novara",
            "Independent long-form writers",
            "BBC arts/health desks",
        ],
        "priorities": "story, character, hook, exclusivity, factual specificity",
        "framing": "a founder narrative (Rob's ten-year arc); the £4–6m ask as the immediate news hook; the data-gap as the investigation; the Seven Lives as the long-read; the CBS asset-lock as the unusual structural angle",
        "pushback": '"Where\'s the news hook?" — Reply: the cornerstone partnership ask itself is news. Or the data-gap. Or the cooperative structure. Or the seven-lives historical recovery. Different journalists take different hooks.',
        "source_emphasis": "Narrative + Seven Lives Script + Detention Estimate",
    },
    "H": {
        "name": "Individual philanthropists and family foundations",
        "example_partners": [
            "High-net-worth individuals with conviction-led giving",
            "Family foundations with reparative ambitions",
            "Donor-advised funds with social justice mandates",
        ],
        "priorities": "vision, conviction, founder credibility, transformation at scale, legacy, intimacy of engagement",
        "framing": "the cornerstone partner role; the action-learning frame as genuine participation rather than transactional funding; the ten-year track record as proof of seriousness",
        "pushback": '"Can I trust BLKOUT with this scale?" — Reply: the CBS asset-lock makes capture structurally impossible; the Advisory Circle distributes authority; ten years of delivery proves operational seriousness.',
        "source_emphasis": "Narrative + Phased Partnership",
    },
}


SIX_UNCHANGING_CLAIMS = """DO NOT soften the reparations framing (UN GA Resolution 60/147) into "social investment" or "impact philanthropy" — keep the reparations language.
DO NOT reframe the £4–6m founding partnership ask as a panel of contributing funders — it is a single cornerstone partner.
DO NOT convert the action-learning frame into a steering-group structure.
DO NOT soften the CBS asset-lock — it is the structural commitment to non-extraction.
DO NOT soften the genuine uncertainties (network-positioned therapy as novel; community-led data stewardship as unproven; AI/community trust as uncharted) into "tested methodology". Hold them as strength.
DO NOT reframe "community-led from the start" as "designed with community input"."""


def profile_block(profile_id: str) -> str:
    p = PROFILES[profile_id]
    partners = "; ".join(p["example_partners"])
    return (
        f"AUDIENCE: {p['name']} (Profile {profile_id})\n"
        f"Example partners: {partners}.\n"
        f"Priorities: {p['priorities']}.\n"
        f"Framing that lands: {p['framing']}.\n"
        f"Pre-empt this pushback: {p['pushback']}\n"
        f"Source emphasis: weight the following sources most heavily: {p['source_emphasis']}."
    )
