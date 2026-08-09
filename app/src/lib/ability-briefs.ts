// The brief line for every Ability — the "what is this" shown beside the name
// wherever abilities are listed (builder spec §8: every sheet-line entity
// carries a brief and a full; the card is the full). Keyed "Category/Name".
// Plain statements of what the card does in play; no selling, no epithets.
// ability-briefs.test.ts fails the build if a card is missing its brief.

export const ABILITY_BRIEFS: Record<string, string> = {
  // ── General ───────────────────────────────────────────────────────────
  'General/Second Wind': 'Catch your breath: a guard of Temp HP, or true healing.',

  // ── Arms ──────────────────────────────────────────────────────────────
  'Arms/Martial Strike': 'The standard weapon attack; every ladder on it can grow.',
  'Arms/Power Attack': 'A harder swing for more damage, bought less often.',
  'Arms/Defensive Strike': 'Attack while covering yourself; a hit also firms up a Defence.',
  'Arms/Parry': 'Turn aside part of an incoming blow.',
  'Arms/Disarming Strike': 'Strike at the weapon hand; the foe hits less well after.',
  'Arms/Martial Focus': 'Take a beat to line up your next attack.',
  'Arms/Raise Shield': 'Put the shield to work: its DR applies while raised.',
  'Arms/Measure the Foe': 'Size up an enemy: how tough, where strong, where soft.',

  // ── Protection ────────────────────────────────────────────────────────
  'Protection/Shield Bash': 'A shield blow that leaves the target reeling.',
  'Protection/Marking Strike': 'Hit and mark the foe; attacking anyone but you costs them.',
  'Protection/Sentinel Strike': 'A strike that also shelters a nearby ally.',
  'Protection/Guard': 'Set your feet and cover up.',
  'Protection/Intercept': 'Swap places with an ally and take the hit meant for them.',
  'Protection/Bulwark': 'Brace behind armour and shield for temporary HP.',
  'Protection/Stand Watch': 'Your watch is never surprised.',

  // ── Leadership ────────────────────────────────────────────────────────
  'Leadership/Command': 'Bark an order; an ally attacks out of turn.',
  'Leadership/Commander’s Strike': 'Hit a target and call it; allies strike it better.',
  'Leadership/Focus Fire': 'Name the target; the whole line shoots at it better.',
  'Leadership/Resolute Strike': 'A strike that steadies nearby allies against the same foe.',
  'Leadership/Rally': 'Steady the line; nearby allies defend better.',
  'Leadership/War Cry': 'Lift the company; nearby allies attack better.',
  'Leadership/Inspiring Word': 'A word that lets an ally shake off a Condition.',

  // ── Marksmanship ──────────────────────────────────────────────────────
  'Marksmanship/Marksman’s Shot': 'The standard ranged attack for any ranged weapon.',
  'Marksmanship/Pinning Shot': 'A shot that slows the target where it stands.',
  'Marksmanship/Skirmishing Shot': 'Shoot, step, and keep your guard up.',
  'Marksmanship/Covering Fire': 'Spoil an enemy attack on your ally.',
  'Marksmanship/Run and Gun': 'Shoot on the move.',
  'Marksmanship/Debilitating Shot': 'A placed shot that weakens a chosen Defence.',
  'Marksmanship/Marksman’s Eye': 'Trained eyes; you spot things at distance.',

  // ── Mercy ─────────────────────────────────────────────────────────────
  'Mercy/Mending Touch': 'A modest laying-on of hands; heals a little.',
  'Mercy/Stabilize': 'Slow the bleeding, ease the poison; a touch stops dying.',
  'Mercy/Blessing': 'A blessing over an ally; their Saves improve.',
  'Mercy/Prayer for the Saintly': 'A prayer that grants a shared Reroll.',
  'Mercy/Preach to the Saintly': 'Preach to a gathering and win it over.',
  'Mercy/Tend the Wounded': 'Camp care: the tended heal more on a rest.',

  // ── Forbearance ───────────────────────────────────────────────────────
  'Forbearance/Vow of Mercy': 'A standing vow: your healing runs deeper; you may never wield a weapon.',
  'Forbearance/Vow of Poverty': 'A standing vow: better Defences; no wealth kept.',
  'Forbearance/Vow of Abstinence': 'A standing vow: better Saves; nothing stronger than water.',
  'Forbearance/Flesh of the Martyr': 'Take an ally’s suffering onto yourself as their Temp HP.',
  'Forbearance/Nimbus of the Martyr': 'Your endurance shelters those around you: Temp HP nearby.',
  'Forbearance/Endurance of the Saintly': 'For a time, you cannot be dropped below 1 HP.',
  "Forbearance/Pilgrim's Endurance": 'Hunger, thirst, and weather do not touch you.',

  // ── Spiritual ─────────────────────────────────────────────────────────
  'Spiritual/Censure': 'A denunciation that strips the target’s Defences.',
  'Spiritual/Rebuke': 'A rebuke that leaves the target reeling.',
  "Spiritual/Kerrigan's Prayer": 'A prayer that strips false protections from your enemies.',
  'Spiritual/Fly the Wicked': 'Put fear into the wicked; they attack worse.',
  'Spiritual/Vow of Nicetus': 'A standing vow against the Black Faith; you strike its servants truer.',
  'Spiritual/Exorcism': 'Contest a possession or domination and loosen its hold.',
  'Spiritual/Ferret the Wicked': 'Question a soul; you know each lie as it is told.',

  // ── Letters ───────────────────────────────────────────────────────────
  'Letters/Research': 'Work the sources; answers come with a bonus, given time.',
  'Letters/Scholar’s Strike': 'A scholar’s poke with a stick; it does what it does.',
  'Letters/Evade': 'Slip out of reach without inviting a blow.',
  'Letters/Recall': 'Dredge up the relevant fact at the relevant moment.',
  'Letters/Read Scrolls': 'Read a scroll’s spell; its Ranks let you cast it.',
  'Letters/Read Spellbooks': 'Read a spellbook’s spell; its Ranks let you cast it.',
  'Letters/Conduct Ritual': 'Lead a ritual properly, and better than the book alone.',
  'Letters/Identify': 'Determine whether a thing is magic, and of what kind.',

  // ── Medicine ──────────────────────────────────────────────────────────
  'Medicine/Surgeon’s Strike': 'A cut where it counts; the wound keeps bleeding.',
  'Medicine/Envenom': 'Apply a prepared poison to your weapon and deliver it.',
  'Medicine/Guard Vitals': 'Know where you can least afford to be hit, and cover it.',
  'Medicine/Field Dressing': 'Kit-and-supplies healing on the spot.',
  'Medicine/Field Medicine': 'Treat a Condition, a poison, or a dying patient in the field.',
  'Medicine/Tend the Wounded': 'Camp care: the tended heal more on a rest.',
  'Medicine/Convalescence': 'Long care that compresses a week of mending into a day.',

  // ── New Magic ─────────────────────────────────────────────────────────
  'New Magic/Telum Eminus': 'Spell-builder: a ranged bolt of your chosen element.',
  'New Magic/Tactus Comminus': 'Spell-builder: a charged touch for close work.',
  'New Magic/Globus Eminus': 'Spell-builder: a thrown burst of your chosen element.',
  'New Magic/Corona Comminus': 'Spell-builder: a burst centred on yourself.',
  'New Magic/Lorica Arcana': 'Arcane armour worn as a working.',
  'New Magic/Scutum Virium': 'A shield of force, raised like a buckler.',
  'New Magic/Manus Eminus': 'An unseen hand that moves things at a distance.',
  'New Magic/Lumen Arcanum': 'Conjured light where you need it.',

  // ── The Lost ──────────────────────────────────────────────────────────
  'The Lost/Sneak Attack': 'The killing economy of the unseen: heavy damage on an Off Guard mark.',
  'The Lost/Feint': 'Sell a false move; the mark is open to you.',
  'The Lost/Dirty Trick': 'Sand, ash, a boot — the mark fights half-blind.',
  'The Lost/Nimble Evasion': 'A quick step out of trouble, clean.',
  'The Lost/Vanish': 'Drop from sight even while watched.',
  'The Lost/Tumble': 'Cross the fight without offering a blow.',
  'The Lost/Light Fingers': 'Take, palm, or plant something small, unnoticed.',
  'The Lost/Lay Low': 'Go to ground where the law and the curious lose you.',

  // ── Occult ────────────────────────────────────────────────────────────
  'Occult/Third Eye': 'See what is dim, and what is unseen.',
  'Occult/Dark Blessing': 'The favour of the dead on the living; Saves improve.',
  'Occult/Spirit Guide': 'A quiet counsellor; a Reroll outside combat.',
  'Occult/Wield Artefact': 'Understand Artefacts and turn their powers to use.',
  'Occult/Read Scrolls': 'Read a scroll’s spell; its Ranks let you cast it.',
  'Occult/Read Spellbooks': 'Read a spellbook’s spell; its Ranks let you cast it.',
  'Occult/Conduct Ritual': 'Lead a ritual properly, and better than the book alone.',

  // ── Witchcraft ────────────────────────────────────────────────────────
  'Witchcraft/Dictiones Atras Susurrare': 'Curse-builder: whisper a Malediction onto one target.',
  'Witchcraft/Dictiones Atras Clamare': 'Curse-builder: cry a Malediction over the whole burst.',
  'Witchcraft/Renunciation of Nicetus': 'A standing renunciation: better Defences; the Saintly Faith is closed to you.',
  'Witchcraft/Aversio Fontis': 'A standing renunciation: DR, for the price of clean water.',
  'Witchcraft/Votum Sinistrum': 'A standing renunciation: a daily Reroll, everything left-handed.',
  'Witchcraft/Bind Spirit': 'Bind a shade to fetch, carry, and watch.',

  // ── The Outside ───────────────────────────────────────────────────────
  'The Outside/Eldritch Blast': 'Raw Eldritch damage; Temp HP does not stop it.',
  'The Outside/Unraveling Gaze': 'Meet its eyes and it comes apart: Confusion.',
  'The Outside/Pandemonium': 'Confusion across an area.',
  'The Outside/Impossible Visage': 'You are wrong to look at; attacks on you falter.',
  'The Outside/Conversant with the Outside': 'A standing vow of the far shore: Wisdom hardens; something is given up.',
  'The Outside/Observer of the Outside': 'A standing vow of watching: Intelligence hardens; something is given up.',
  'The Outside/Traveller': 'A standing vow of the road between: Constitution hardens; something is given up.',
  'The Outside/Wield Orb': 'Understand Orbs and turn their powers to use.',

  // ── Guile ─────────────────────────────────────────────────────────────
  'Guile/Misdirection': '“Look there.” The mark is open to you.',
  'Guile/Cutting Remark': 'A jibe that gets under the skin and stays there.',
  'Guile/Bluster': 'Bravado that pries a Defence open.',
  'Guile/Confidence': 'The front that keeps you standing: Temp HP.',
  'Guile/Swindle': 'Part a mark from a little money.',
  'Guile/Parley': 'Talk your way to a small concession.',
  'Guile/Contionem habere': 'A speech that braces your company against a named foe.',

  // ── Assassination ─────────────────────────────────────────────────────
  'Assassination/Study the Mark': 'Watch the mark first; the work lands harder after.',
  'Assassination/Death Blow': 'The finisher, for a mark already open.',
  'Assassination/Envenom': 'Apply a prepared poison to your weapon and deliver it.',
  'Assassination/Anatomist’s Cut': 'A cut to nerve or tendon; a Defence gives way.',
  'Assassination/Garrote': 'The cord: held, silenced, and worse to follow.',
  'Assassination/Pointed Inquiry': 'Ask the right people the right way about your quarry.',
  'Assassination/Clean Kill': 'No alarm, no body, no questions.',

  // ── Elder Magic ───────────────────────────────────────────────────────
  'Elder Magic/Wield Artefact': 'Understand Artefacts and turn their powers to use.',
  'Elder Magic/Whispers from the Doomed': 'Voices the mind cannot bear: Psychic damage.',
  'Elder Magic/Memory of Celestia': 'A vision that dazzles the senses and spoils the aim.',
  'Elder Magic/Figments of Forgotten Places': 'Phantom ground; the target moves where you will it.',
  'Elder Magic/Edict for the Thralls': 'A command from an older order; the target obeys or lashes out.',
  'Elder Magic/Pall of Doubt': 'A settled dread that weakens a Defence.',
  'Elder Magic/Psychometry': 'Handle an object and read where it has been.',
  'Elder Magic/Lessons from Dark Places': 'What the ruins taught you, applied to the next hazard.',

  // ── Harvest ───────────────────────────────────────────────────────────
  'Harvest/Provender': 'The land feeds the company, and your craft besides.',
  'Harvest/Simples': 'Homely draughts against poison and disease.',
  'Harvest/Hedge-Wise': 'Hedgerow and ditch are yours; rough ground is not.',
  'Harvest/Countryman’s Welcome': 'Country folk take you for their own.',
  'Harvest/Beast-Wise': 'A hand for animals.',
  'Harvest/Eola-Gesta': 'The village grapevine, wherever the village is.',

  // ── Husbandry ─────────────────────────────────────────────────────────
  'Husbandry/Shepherd’s Dog': 'The dog: a working companion with its own card.',
  'Husbandry/Worry': 'The dog grips and hangs on; the target is slowed.',
  'Husbandry/The Dog Watches': 'The camp sleeps whole; the dog does not.',
  'Husbandry/Turn the Wolf': 'The dog breaks a charge where it stands.',
  'Husbandry/Ward the Fold': 'The dog drives an attacker off an ally.',
  'Husbandry/Drive Them': 'The dog moves an enemy where you want it.',
  'Husbandry/Ninety and Nine': 'You always know the count, and what is missing.',

  // ── Botany ────────────────────────────────────────────────────────────
  'Botany/Envenom': 'Apply a prepared poison to your weapon and deliver it.',
  'Botany/Research': 'Work the sources; answers come with a bonus, given time.',
  'Botany/Recall': 'Dredge up the relevant fact at the relevant moment.',
  'Botany/Brew Poison': 'Brew a known recipe into a usable dose.',
  'Botany/Vitriol': 'Thrown acid that keeps eating.',
  'Botany/Stupefying Fumes': 'A stinking cloud that dulls everyone in it.',
  'Botany/Laudanum': 'A dose that quiets pain without curing its cause.',

  // ── Old Magic ─────────────────────────────────────────────────────────
  'Old Magic/The Old Custom': 'Address the spirits of a place in the First Tongue.',
  'Old Magic/Dream Beneath the Yew Bough': 'Tended sleep under the old signs mends better.',
  'Old Magic/The Warning': 'The spirits mislike them; they feel it and flinch.',
  'Old Magic/Favour of the Fauna': 'Speak with a beast, as far as its wits go.',
  'Old Magic/Threshold Ward': 'A charm on a doorway that tells you what crosses.',
  'Old Magic/Drymann’s Token': 'A carried charm against ill influence.',
};

/** Look up the brief for a card. */
export function briefFor(category: string, ability: string): string | undefined {
  return ABILITY_BRIEFS[`${category}/${ability}`];
}
