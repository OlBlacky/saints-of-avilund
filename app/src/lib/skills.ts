// The Skills of Avilund — the data behind the Skills reference page.
//
// Each skill renders as an expandable panel (alphabetical) on /system/skills/,
// with an explanation of how it works and a highlighted box of the Actions it
// enables. `attrs` lists the attribute(s) you may roll it with; `field` marks a
// speciality skill (taken in a named field). `note` is an optional extra line
// (a prerequisite, a cross-reference). DRAFT CONTENT — to be revised by the
// designer; only Heal carries finalised, canon rules so far.

export interface SkillAction {
  name: string;   // the thing you do
  rule: string;   // the specific in-game rule — highlighted on the page
}

export interface Skill {
  name: string;
  attrs: string;        // e.g. "Str" or "Dex, Wis"
  field?: string;       // e.g. "speciality" or "faith" — shown as a tag
  how: string;          // how the skill works
  note?: string;        // optional extra line (prerequisite, cross-ref)
  actions: SkillAction[];
}

// Authored in alphabetical order; the page also sorts on render to be safe.
export const SKILLS: Skill[] = [
  {
    name: 'Acrobatics',
    attrs: 'Dex',
    how: 'Balance, tumble, and keep your feet where the footing is treacherous or enemies bar the way.',
    actions: [
      { name: 'Tumble', rule: 'Move through a space an enemy threatens without granting an opportunity strike: Acrobatics vs the foe’s Dexterity Offense.' },
      { name: 'Slip Past', rule: 'Move through an enemy’s own square — under the arm, between the legs, over the back: Acrobatics vs the foe’s Dexterity Offense. You may not end your move there.' },
      { name: 'Balance', rule: 'Cross a narrow or unstable surface: Acrobatics vs a DC set by the width and conditions; a bad failure means a fall.' },
      { name: 'Break a Fall', rule: 'On a successful check, ignore the first 10′ when reckoning falling damage.' },
    ],
  },
  {
    name: 'Appraise',
    attrs: 'Int',
    how: 'Judge the worth, authenticity, and quality of goods, art, and craftsmanship.',
    actions: [
      { name: 'Value', rule: 'Estimate an item’s fair price: Appraise vs a GM DC — the rarer or finer the piece, the harder.' },
      { name: 'Detect a Fake', rule: 'Spot a counterfeit or altered good: Appraise opposed by the faker’s Forgery (or vs a GM DC).' },
    ],
  },
  {
    name: 'Arcana',
    attrs: 'Int',
    note: 'Prerequisite: Language (Elder Arcana).',
    how: 'The scholar’s reading of magic — its traditions, enchanted things, and arcane phenomena.',
    actions: [
      { name: 'Identify Magic', rule: 'Read an unknown magical thing’s tradition, level, and function: Arcana vs the object’s DC. (See the Identify ability for the deeper read.)' },
      { name: 'Recall Arcane Lore', rule: 'A Knowledge check on a tradition, item, or arcane event: Arcana vs a GM DC.' },
      { name: 'Identify a Spell', rule: 'Name a spell as it is cast, or from its lingering effect: Arcana vs the spell’s DC.' },
      { name: 'Read an Effect', rule: 'Work out how to interact with or disrupt an ongoing magical effect: an Arcana check.' },
    ],
  },
  {
    name: 'Athletics',
    attrs: 'Str',
    how: 'Climbing, jumping, swimming, and raw physical exertion.',
    actions: [
      { name: 'Climb', rule: 'Scale a surface: Athletics vs a DC by the surface; failing by 5 or more means a fall.' },
      { name: 'Swim', rule: 'Move through water or current: Athletics vs a DC by the conditions.' },
      { name: 'Jump', rule: 'Clear a gap or height: an Athletics check sets how far you leap.' },
    ],
  },
  {
    name: 'Bluff',
    attrs: 'Cha',
    how: 'Lie convincingly, feint, and pass off the implausible as true.',
    actions: [
      { name: 'Deceive', rule: 'Make a lie believed: Bluff opposed by the listener’s Sense Motive.' },
      { name: 'Feint', rule: 'In combat, as a Standard action: Bluff vs the target’s Sense Motive; on a success it is Off Guard against your next attack.' },
      { name: 'Create a Diversion', rule: 'Bluff vs Sense Motive to draw eyes away, letting an ally Hide or slip past.' },
    ],
  },
  {
    name: 'Commerce',
    attrs: 'Cha, Int, Wis',
    how: 'Buying, selling, and reading markets — haggling and the flow of trade.',
    actions: [
      { name: 'Haggle', rule: 'Improve a price: Commerce opposed by the trader’s Commerce; success shifts the price a step in your favour.' },
      { name: 'Read the Market', rule: 'Gauge supply, demand, and a fair rate in a locale: Commerce vs a GM DC.' },
    ],
  },
  {
    name: 'Concentration',
    attrs: 'Con',
    how: 'Hold mental focus through pain, distraction, or duress.',
    actions: [
      { name: 'Maintain Focus', rule: 'Keep a delicate task or effect going when hit or jostled: Concentration vs a DC set by the disruption (e.g. the damage taken).' },
      { name: 'Steady Nerves', rule: 'Resist being shaken off a careful action under threat: Concentration vs a GM DC.' },
    ],
  },
  {
    name: 'Craft',
    attrs: 'Int, Wis, Dex',
    field: 'speciality',
    how: 'Make and repair things in a chosen trade — Craft: Poison, Craft: Weaponsmith, and the like. Each speciality is taken separately.',
    actions: [
      { name: 'Craft an Item', rule: 'Make or repair within your speciality: Craft vs the item’s Craft DC, over the required time and materials (see the recipe).' },
      { name: 'Judge Workmanship', rule: 'Assess the quality of work in your field: Craft vs a GM DC.' },
    ],
  },
  {
    name: 'Decipher Script',
    attrs: 'Int',
    how: 'Puzzle out unknown tongues, ciphers, and damaged or coded writing.',
    actions: [
      { name: 'Decipher', rule: 'Get the gist of an unfamiliar script: Decipher Script vs a GM DC by the text’s obscurity.' },
      { name: 'Crack a Cipher', rule: 'Break a coded message: Decipher Script vs the cipher’s DC — slow, painstaking work.' },
    ],
  },
  {
    name: 'Diplomacy',
    attrs: 'Cha',
    how: 'Negotiate, mediate, and shift attitudes by reason and grace.',
    actions: [
      { name: 'Persuade', rule: 'Improve an NPC’s Attitude one step: Diplomacy vs a DC by their starting Attitude. Never sways a Hostile NPC in the moment.' },
      { name: 'Negotiate', rule: 'Broker terms between parties: Diplomacy vs a GM DC.' },
    ],
  },
  {
    name: 'Disguise',
    attrs: 'Cha',
    how: 'Alter your appearance to pass as another person or sort of person.',
    actions: [
      { name: 'Disguise Self', rule: 'Assume a false look: set a Disguise result; onlookers oppose with Perception to see through it.' },
      { name: 'Impersonate', rule: 'Pass as a specific person: Disguise, at a penalty before those who know them well.' },
    ],
  },
  {
    name: 'Dungeoneering',
    attrs: 'Int, Wis',
    how: 'Lore and craft of the deep places — navigating, and sensing the hazards underground.',
    actions: [
      { name: 'Navigate Underground', rule: 'Keep your bearings below ground: Dungeoneering vs a GM DC.' },
      { name: 'Sense Hazard', rule: 'Read a cave-in risk, foul air, or dungeon trap-sign: Dungeoneering vs a GM DC.' },
      { name: 'Recall Depths Lore', rule: 'A Knowledge check on underground creatures and features.' },
    ],
  },
  {
    name: 'Endurance',
    attrs: 'Con',
    how: 'Resist fatigue, hunger, weather, and prolonged hardship.',
    actions: [
      { name: 'Endure Hardship', rule: 'Resist exhaustion from forced marches, heat, cold, or thirst: Endurance vs a DC by the strain.' },
      { name: 'Push On', rule: 'Extend your physical limits past the safe point: Endurance vs a rising DC each interval.' },
    ],
  },
  {
    name: 'Escape Artist',
    attrs: 'Dex, Wis',
    how: 'Slip bonds, grapples, and tight spaces.',
    actions: [
      { name: 'Escape Bonds', rule: 'Wriggle free of ropes or manacles: Escape Artist vs the binder’s Use Rope (or the restraint’s DC).' },
      { name: 'Break a Grapple', rule: 'Slip a hold: Escape Artist vs the grappler’s relevant Offense.' },
      { name: 'Squeeze Through', rule: 'Pass a gap almost too tight: Escape Artist vs a GM DC.' },
    ],
  },
  {
    name: 'Forgery',
    attrs: 'Int',
    how: 'Produce convincing false documents, seals, and signatures.',
    actions: [
      { name: 'Forge a Document', rule: 'Create a false paper: set a Forgery result; an examiner opposes with Forgery or Appraise to detect it.' },
      { name: 'Copy a Hand or Seal', rule: 'Reproduce a signature or seal: Forgery vs a GM DC.' },
    ],
  },
  {
    name: 'Gather Information',
    attrs: 'Cha',
    how: 'Work a town for rumours, contacts, and intelligence.',
    actions: [
      { name: 'Gather Rumours', rule: 'Spend hours among the locals to learn what’s whispered: Gather Information vs a GM DC.' },
      { name: 'Find a Contact', rule: 'Locate someone who knows or sells what you need: a Gather Information check.' },
    ],
  },
  {
    name: 'Geography',
    attrs: 'Int, Wis',
    how: 'Maps, terrain, borders, and the lay of distant lands.',
    actions: [
      { name: 'Recall Geography', rule: 'A Knowledge check on lands, routes, settlements, and terrain vs a GM DC.' },
      { name: 'Plot a Route', rule: 'Work out the best path across known country: a Geography check.' },
    ],
  },
  {
    name: 'Handle Animal',
    attrs: 'Cha, Wis',
    how: 'Train, calm, and direct animals.',
    actions: [
      { name: 'Calm or Control', rule: 'Steady a frightened or hostile beast: Handle Animal vs a DC by the animal.' },
      { name: 'Train', rule: 'Teach an animal a task over time: Handle Animal vs the trick’s DC.' },
      { name: 'Push', rule: 'In play, goad a trained animal to act: Handle Animal as a Move action.' },
    ],
  },
  {
    name: 'Heal',
    attrs: 'Wis, Int',
    note: 'The Physician and the Friar carry far stronger versions of all three. (See Combat for the dying and Wounded rules these treat.)',
    how: 'Treat wounds, illness, poison, and the dying with the consumable Supplies of a Healer’s Kit. Anyone trained in Heal can do three things with no special ability:',
    actions: [
      { name: 'Diagnose', rule: 'Read an affliction: what poison or disease, and how grave.' },
      { name: 'Stabilize', rule: 'Steady a dying creature: a Heal check at DC 10 + how far below 0 HP they are.' },
      { name: 'Tend Wounded', rule: '4 hours’ care per patient, DC 11; on a success, spend 1 Supply from a Healer’s Kit and the patient recovers +1 HP over the day’s baseline.' },
    ],
  },
  {
    name: 'History',
    attrs: 'Int, Wis',
    how: 'Events, figures, dynasties, and the deep past.',
    actions: [
      { name: 'Recall History', rule: 'A Knowledge check on past events, people, and the age of the Saints vs a GM DC.' },
    ],
  },
  {
    name: 'Intimidate',
    attrs: 'Str, Cha',
    how: 'Bend others by threat — a raised fist (Strength) or a cold word (Charisma).',
    actions: [
      { name: 'Coerce', rule: 'Force compliance or an answer: Intimidate vs the target’s Sense Motive (or a GM DC).' },
      { name: 'Demoralize', rule: 'In combat, as a Standard action: Intimidate vs the foe’s resolve; on a success it is Shaken — −1 to attacks (Fear) — until it saves.' },
    ],
  },
  {
    name: 'Local Knowledge',
    attrs: 'Int, Wis',
    how: 'The people, powers, and happenings of a particular place.',
    actions: [
      { name: 'Recall Local Lore', rule: 'A Knowledge check on a settlement’s figures, factions, and current events vs a GM DC.' },
    ],
  },
  {
    name: 'Nature',
    attrs: 'Int, Wis',
    how: 'Plants, animals, weather, and herb-craft.',
    actions: [
      { name: 'Recall Nature Lore', rule: 'A Knowledge check on wildlife, plants, and natural phenomena.' },
      { name: 'Identify a Plant or Herb', rule: 'Recognise a herb, fungus, or natural hazard: Nature vs a GM DC.' },
      { name: 'Predict Weather', rule: 'Read the coming weather: a Nature check.' },
    ],
  },
  {
    name: 'Nobility & Etiquette',
    attrs: 'Int, Cha',
    how: 'Court customs, heraldry, titles, and protocol.',
    actions: [
      { name: 'Recall Heraldry & Lineage', rule: 'A Knowledge check on houses, titles, and coats of arms.' },
      { name: 'Observe Etiquette', rule: 'Navigate a formal setting without offence: Nobility & Etiquette vs a GM DC.' },
    ],
  },
  {
    name: 'Perception',
    attrs: 'Wis',
    how: 'Notice details, spot the hidden, and sense danger.',
    actions: [
      { name: 'Notice', rule: 'Spot a hidden creature or thing: Perception opposed by Stealth (or vs a GM DC).' },
      { name: 'Sense Danger', rule: 'Catch the sign of an ambush or subtle threat: a Perception check sets your awareness.' },
    ],
  },
  {
    name: 'Perform',
    attrs: 'Cha',
    field: 'speciality',
    how: 'Entertain in a chosen art — music, oratory, dance. Each speciality is taken separately.',
    actions: [
      { name: 'Perform', rule: 'Move or please an audience: Perform vs a DC by the crowd; earns coin, favour, or a distraction.' },
    ],
  },
  {
    name: 'Profession',
    attrs: 'Wis, Int',
    field: 'speciality',
    how: 'Ply a learned vocation — Profession: Sailor, Scribe, Apothecary, and so on. Each is taken separately.',
    actions: [
      { name: 'Practise Your Profession', rule: 'Earn a living or apply vocational know-how: Profession vs a GM DC.' },
    ],
  },
  {
    name: 'Religion',
    attrs: 'Int, Wis',
    field: 'faith',
    how: 'Theology, rites, and lore of a named faith — Religion (Saintly Faith), Religion (Black Faith), and others. Each faith is taken separately.',
    actions: [
      { name: 'Recall Religious Lore', rule: 'A Knowledge check on the named faith’s doctrine, saints, and rites.' },
      { name: 'Identify the Sacred or Profane', rule: 'Recognise a rite, relic, or heresy of the faith: Religion vs a GM DC.' },
    ],
  },
  {
    name: 'Ride',
    attrs: 'Dex, Wis',
    how: 'Control a mount in all conditions, in and out of the saddle.',
    actions: [
      { name: 'Control Mount', rule: 'Keep a spooked or hard-pressed mount under control: Ride vs a DC.' },
      { name: 'Fight from the Saddle', rule: 'Stay mounted and effective in a melee: a Ride check; a fall on a bad miss.' },
      { name: 'Fast Mount or Dismount', rule: 'Get on or off in a hurry: Ride as a Free action on a success.' },
    ],
  },
  {
    name: 'Rituals',
    attrs: 'Int',
    how: 'Perform rituals — making the Ritual Leader’s Casting-DC roll — and the lore of how rituals work.',
    actions: [
      { name: 'Lead a Ritual', rule: 'Make the ritual’s Casting-DC check (usually Int): Rituals vs the ritual’s DC, with the materials and participants it requires. (See Magic.)' },
      { name: 'Recall Ritual Lore', rule: 'A Knowledge check on known rituals and their requirements.' },
    ],
  },
  {
    name: 'Search',
    attrs: 'Int, Wis',
    how: 'Methodically find hidden things — traps, compartments, and clues.',
    actions: [
      { name: 'Search an Area', rule: 'Examine a space for the hidden: Search vs a GM DC (or vs the hider’s result); it takes time per area.' },
      { name: 'Find a Trap', rule: 'Locate a mechanical or magical trap’s trigger: Search vs the trap’s DC.' },
    ],
  },
  {
    name: 'Sense Motive',
    attrs: 'Wis',
    how: 'Read intent, catch lies, and gauge a person.',
    actions: [
      { name: 'Detect a Lie', rule: 'Sense deceit: Sense Motive opposed by Bluff.' },
      { name: 'Read Intentions', rule: 'Gauge mood or hidden motive: Sense Motive vs a GM DC.' },
      { name: 'Sense Influence', rule: 'Notice someone acting under enchantment or duress: Sense Motive vs a DC.' },
    ],
  },
  {
    name: 'Sleight of Hand',
    attrs: 'Dex',
    how: 'Delicate manual work and misdirection — palming, lifting, and planting.',
    actions: [
      { name: 'Pick a Pocket', rule: 'Lift or plant a small object unseen: Sleight of Hand opposed by Perception.' },
      { name: 'Conceal', rule: 'Hide a small object on your person: Sleight of Hand vs Perception or Search.' },
    ],
  },
  {
    name: 'Stealth',
    attrs: 'Dex, Wis',
    how: 'Move unseen and unheard, and stay hidden.',
    actions: [
      { name: 'Hide', rule: 'As a Move action, Stealth opposed by onlookers’ Perception; success means you are unseen.' },
      { name: 'Sneak', rule: 'Move quietly past, or up on, a target: Stealth vs Perception.' },
      { name: 'Ambush', rule: 'Stay hidden to strike first: a won Stealth grants the surprise.' },
    ],
  },
  {
    name: 'Survival',
    attrs: 'Con, Wis',
    how: 'Track, forage, navigate, and endure the wild.',
    actions: [
      { name: 'Track', rule: 'Follow a trail: Survival vs a DC by its age and the ground.' },
      { name: 'Forage', rule: 'Find food, water, and shelter: a Survival check per day.' },
      { name: 'Navigate the Wilds', rule: 'Hold a course across open country: Survival vs a GM DC.' },
    ],
  },
  {
    name: 'The Planes',
    attrs: 'Int',
    how: 'Planar cosmology and the entities beyond — the Abyss and the realms that touch the world.',
    actions: [
      { name: 'Recall Planar Lore', rule: 'A Knowledge check on the planes and the beings (demons, spirits) bound to them vs a GM DC.' },
      { name: 'Identify the Extraplanar', rule: 'Recognise a being’s plane and nature: The Planes vs a DC.' },
    ],
  },
  {
    name: 'Thievery',
    attrs: 'Dex',
    how: 'Pick locks and disable mechanical devices.',
    actions: [
      { name: 'Pick a Lock', rule: 'Open a lock without the key: Thievery vs the lock’s DC; thieves’ tools required.' },
      { name: 'Disable a Device', rule: 'Disarm a trap or jam a mechanism: Thievery vs the device’s DC.' },
    ],
  },
  {
    name: 'Trade',
    attrs: 'Str, Dex, Con',
    field: 'speciality',
    how: 'Work a physical job for coin — Trade: Porter, Teamster, Smith’s labour. Each is taken separately.',
    actions: [
      { name: 'Ply a Trade', rule: 'Do the physical work of your trade: Trade vs a GM DC; earns a day’s wage.' },
    ],
  },
  {
    name: 'Use Rope',
    attrs: 'Dex, Wis',
    how: 'Knots, restraints, and rope as a tool.',
    actions: [
      { name: 'Bind', rule: 'Tie a captive: your Use Rope sets the DC their Escape Artist must beat.' },
      { name: 'Secure a Line', rule: 'Rig rope for a climb or rescue: Use Rope vs a GM DC.' },
    ],
  },
];
