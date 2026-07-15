// The Saintly Canon of Avilund — data for the cross-linked catalogue.
// Tiers: Primi (lived & died in the Archipelago), Secundi (born in the
// Archipelago, lived in Avilund), Coaevi (first native-born), Minores (the
// countless lesser saints). Each upper tier keeps the same eleven offices.

export type Tier = 'Primi' | 'Secundi' | 'Coaevi' | 'Minores';

export type Office =
  | 'Arms' | 'Mercy' | 'Letters' | 'Craft' | 'Trade' | 'Harvest'
  | 'Passage' | 'Hearth' | 'Death' | 'Throne' | 'The Lost' | 'Misfortune';

export interface Saint {
  slug: string;
  name: string;
  tier: Tier;
  office: Office | (string & {}); // one of the eleven offices for the upper tiers; free-text patronage for Minores
  fundator?: boolean;   // founder of a sect of the Church
  meaning?: string;     // for the invented names
  noAutoLink?: boolean; // skip auto cross-linking (ambiguous common/personal names)
  blurb: string;
}

export const TIER_ORDER: Tier[] = ['Primi', 'Secundi', 'Coaevi', 'Minores'];

export const TIER_BLURBS: Record<Tier, string> = {
  Primi: 'The First Saints, who lived and died upon the Archipelago and never in life set foot in Avilund. By the present age the most are all but forgotten; only the three Fundatores keep a living devotion.',
  Secundi: 'The Second Saints, born upon the Archipelago but living their lives in Avilund — the saints of the Crossing and the settlement. Their sects hold the Centre of the continent.',
  Coaevi: 'The Coevals, the first saints born in Avilund — of eastern blood but not of Avitus’s line, contemporaries of the Secundi. Their sects hold the rough North.',
  Minores: 'The Lesser Saints — countless, of every origin, who wrought some obscure and holy deed and keep, at most, a local following.',
};

export const OFFICE_ORDER: Office[] = [
  'Arms', 'Mercy', 'Letters', 'Craft', 'Trade', 'Harvest',
  'Passage', 'Hearth', 'Death', 'Throne', 'The Lost',
];

export const SAINTS: Saint[] = [
  // ── Sancti Primi ─────────────────────────────────────────────
  {
    slug: 'avitus', name: 'Avitus', tier: 'Primi', office: 'Throne', fundator: true,
    blurb: 'The First Saint, whose mortal name was Riven. Cast out for a crime he did not commit, he transcended this world in his final battle with his brother Gaul, and alone of mortal men was bidden to rule in Heaven. Patron of fatherhood and of authority itself; the wellspring from whom every later saint draws grace. The Empire bears his name, and the Scion rules in his line from the Imperial Ecclesiarchy of Valdenwail.',
  },
  {
    slug: 'severinius', name: 'Severinius', tier: 'Primi', office: 'Letters', fundator: true,
    blurb: 'Sever, son of Avitus and Ruth, hidden in the Great Wood by Mairin and raised to manhood there. The first Scion, who returned to rule his clan, set down the Church’s governance, and composed the Canon of Saint Avitus. Patron of tradition, of letters, and of the administrators and middling ranks who keep the world in order. His Bishopric lies in the South.',
  },
  {
    slug: 'mairin', name: 'Mairin', tier: 'Primi', office: 'Harvest', fundator: true,
    blurb: 'The seeress and maidservant who foresaw the slaughter, exchanged her own child for Sever, and bore him into the Wood. A mother-figure to the common people; patron of agriculture, of families and children, and of prognostication. Her canon is vast and well-ordered; her Bishopric anchors the southern heartland.',
  },
  {
    slug: 'caspar', name: 'Caspar', tier: 'Primi', office: 'Mercy',
    blurb: 'The old tribal priest of the clan’s pagan rites, who opposed the new Faith to his death and was sainted nonetheless for the iron of his convictions. The southern canons remember him as keeper of the healing-craft and the lore of herbs, for the priest was ever also the healer. A shadowed, hermit-haunted cult, and a controversial one.',
  },
  {
    slug: 'pelagius', name: 'Pelagius', tier: 'Primi', office: 'Craft', meaning: 'Of the sea',
    blurb: 'The master shipwright of the Archipelago, whose vessels first dared the open water, and whose craft the Secundus Barnabas would inherit. Little worshipped now, but honoured wherever a keel is laid.',
  },
  {
    slug: 'viator', name: 'Viator', tier: 'Primi', office: 'Trade', meaning: 'The voyager',
    blurb: 'The saint of the first sea-trade, whose ships carried goods between the scattered islands and bound the Archipelago into one people before the Crossing.',
  },
  {
    slug: 'conrad', name: 'Conrad', tier: 'Primi', office: 'Arms', meaning: 'Brave counsel',
    blurb: 'The foundational warrior-defender of the clan in its earliest and most perilous days — the shield raised against the dark of the Archipelago. His name survives chiefly in the old battle-liturgies.',
  },
  {
    slug: 'ida', name: 'Ida', tier: 'Primi', office: 'Passage',
    blurb: 'The angel dispatched by Avitus from Heaven to bear his word to Severinius, and condemned to die on Earth for the errand; she wedded Severinius and mothered Dunstan and Sebald. Patron of messengers and of all who travel. The schoolmen still dispute whether she was truly a saint at all — yet this account numbers her among the Primi without apology.',
  },
  {
    slug: 'ruth', name: 'Ruth', tier: 'Primi', office: 'Hearth',
    blurb: 'Wife of Avitus, murdered by Gaul as Muriel was murdered. Struck from the Pantheon by the numerologists and named interdicto fides, yet her worship would never die among the women of the Empire. Restored here to her rightful office: patron of the household, the marriage-bond, and the grieving wife.',
  },
  {
    slug: 'tarsis', name: 'Tarsis', tier: 'Primi', office: 'Death',
    blurb: 'The undertaker of the Archipelago, keeper of the rites of burial and the peace of the dead. His priests speak the words over the fallen and tend the graves; it was a priest of Tarsis, the Coaevus Cuthman, who would one day lay the last of the Elders to rest.',
  },
  {
    slug: 'muriel', name: 'Muriel', tier: 'Primi', office: 'The Lost',
    blurb: 'Sister of Avitus, outraged and murdered by their brother Gaul, dead at twelve years. The archetype of the innocent wronged; patron of the violated, the murdered, and the children who die before their time. Her following is small and almost wholly female — and it is whispered that a hidden order of nuns keeps her name, hunting the murderer and the ravisher to their deaths.',
  },

  // ── Sancti Secundi ───────────────────────────────────────────
  {
    slug: 'sebald', name: 'Sebald', tier: 'Secundi', office: 'Throne', fundator: true,
    blurb: 'Younger son of Severinius and Ida, half-angel and long-lived; the second Scion. He founded the great castle of Valdenwail and, conquering and assimilating the neighbouring clans, is reckoned the true builder of the Empire. Patron of nobility, of primogeniture, and of the right of inheritance. The Peakes of St. Sebald stand north of Waldheim.',
  },
  {
    slug: 'ignatius', name: 'Ignatius', tier: 'Secundi', office: 'Letters', fundator: true,
    blurb: 'The elder of the three Colleagues of Waldheim, who gathered his younger fellows and stole into the Elders’ doomed city to wrest their knowledge from them in the last hour before its fall. Patron of knowledge, academia, explorers, and cartographers. His Bishopric lies in the Centre, and his Society still excavates the ruins of Waldheim.',
  },
  {
    slug: 'dunstan', name: 'Dunstan', tier: 'Secundi', office: 'Arms', fundator: true,
    blurb: 'Eldest son of Severinius and Ida, half-angel, fierce in war and gifted in the forge. Patron of soldiers, craftsmen, athletes, and the artillery; his is a crusading and innovating sect, credited (though some doubt it) with the invention of gunpowder. The Cathedral of St. Dunstan stands at Lysander, and the Republic of Dunstanmoore bears his name.',
  },
  {
    slug: 'alodia', name: 'Alodia', tier: 'Secundi', office: 'Mercy',
    blurb: 'Patron of healers and herbalists. She carried the herb-craft of old Caspar out of the priesthood and into the hands of the village healers, that the settlers of a new land might be tended.',
  },
  {
    slug: 'barnabas', name: 'Barnabas', tier: 'Secundi', office: 'Craft',
    blurb: 'A native of the Archipelago, friend of Dunstan and Sebald, and captain of the legendary vessel Bram’Cairn. Patron of sailors and shipwrights. He, like Ruth, was once cast out of the Pantheon by the arithmetic of the numerologists, and is here restored.',
  },
  {
    slug: 'aquila', name: 'Aquila', tier: 'Secundi', office: 'Trade', meaning: 'The eagle',
    blurb: 'Patron of merchants — the sharp-eyed trader who built the markets of the settled continent and bound its towns in commerce.',
  },
  {
    slug: 'eligius', name: 'Eligius', tier: 'Secundi', office: 'Harvest',
    blurb: 'Patron of farmers, ranchers, and the labour of the field. His is the practical husbandry that broke the soil of Avilund and fed the growing colonies.',
  },
  {
    slug: 'gabrielle', name: 'Gabrielle', tier: 'Secundi', office: 'Passage',
    blurb: 'Patron of messengers and couriers; the mortal echo of the angel Ida’s heavenly errand, whose runners and heralds held the scattered settlements of the Crossing together.',
  },
  {
    slug: 'adelle', name: 'Adelle', tier: 'Secundi', office: 'Hearth',
    blurb: 'Patron of lovers. Where Ruth keeps the marriage-bond and the grieving wife, Adelle keeps the warmth of courtship and the joy of the settled hearth.',
  },
  {
    slug: 'killian', name: 'Killian', tier: 'Secundi', office: 'Death',
    blurb: 'Patron of the hunters of the undead. In a haunted land where the dead would not lie quiet, his was no gravedigger’s office but a soldier’s: to put down what rose from the barrows of the Elder dead.',
  },
  {
    slug: 'stanis', name: 'Stanis', tier: 'Secundi', office: 'The Lost',
    blurb: 'Patron of martyrs — of those who suffered and died for the Faith in the age of its spreading, when the Word was carried among the Ferals and the unconverted at the cost of blood.',
  },

  // ── Sancti Coaevi ────────────────────────────────────────────
  {
    slug: 'ulric', name: 'Ulric', tier: 'Coaevi', office: 'Arms', fundator: true,
    blurb: 'The very type of the hero: wholly mortal, friend and rival of the half-angel Dunstan, raised to sainthood by a long train of legendary deeds. Patron of personal glory, of ambition, and of the questing knight — and, in our own commercial age, of the merchant-houses, whose young men now seek their glory on the battlefields of trade and finance. The Peakes of St. Ulric crown the North.',
  },
  {
    slug: 'gratus', name: 'Gratus', tier: 'Coaevi', office: 'Mercy', fundator: true,
    blurb: 'One of the three Colleagues of Waldheim; patron of medicine and the physician’s art, which he is said to have learned in part from the dying Elders. His is a great and respected canon throughout the Empire.',
  },
  {
    slug: 'irenaeus', name: 'Irenaeus', tier: 'Coaevi', office: 'The Lost', fundator: true,
    blurb: 'Patron of the lost, the strayed, and the forsaken. His shrine, the place called St. Irenaeus, would in a later age be the site of a famous and terrible massacre — a fate that only deepened the devotion of those who name him in their darkest hours.',
  },
  {
    slug: 'anselm', name: 'Anselm', tier: 'Coaevi', office: 'Letters',
    blurb: 'The younger of Ignatius’s two Colleagues; patron of the New Magic, the lawful art wrested from the Elders before their fall. From his canon descends much of what the Empire knows of the disciplined working of power.',
  },
  {
    slug: 'bernward', name: 'Bernward', tier: 'Coaevi', office: 'Craft',
    blurb: 'Patron of architects and engineers. Where Pelagius and Barnabas raised ships, Bernward raised walls and bridges and the first great works of stone in the new land.',
  },
  {
    slug: 'oswin', name: 'Oswin', tier: 'Coaevi', office: 'Trade', meaning: 'God-friend',
    blurb: 'Ulric’s quartermaster, who kept the coin, the provender, and the supply of the hero’s war-band. From his humble office descends, in time, the whole commercial strand of Ulric’s cult; the ledger was always carried at the warrior’s side.',
  },
  {
    slug: 'judith', name: 'Judith', tier: 'Coaevi', office: 'Harvest',
    blurb: 'Wife of Sebald, and the agricultural saint of the conquering temper. Where Mairin honours cultivation as the furthering of life, Judith honours it as the triumph of Man over Nature. Patron of farmers, of women in their own right, and of the breeders of beasts; her following is strong and rural.',
  },
  {
    slug: 'colman', name: 'Colman', tier: 'Coaevi', office: 'Passage',
    blurb: 'Patron of rangers and trackers; the saint of the wilderness ways and the northern marches, where the road gives out and only the woodsman’s craft will serve.',
  },
  {
    slug: 'agatha', name: 'Agatha', tier: 'Coaevi', office: 'Hearth',
    blurb: 'Patron of women in childbirth and of the bearing of children. Hers is the office of the new generations, the native-born sons and daughters of a land that was no longer foreign to them.',
  },
  {
    slug: 'cuthman', name: 'Cuthman', tier: 'Coaevi', office: 'Death', meaning: 'Known man',
    blurb: 'Once a priest of Saint Tarsis who served among the Colleagues at Waldheim, and who with his own hands buried the last of the Elders when their city fell. Afterward he laid down the scholar’s robe and followed Ulric to war, tending the dead of the war-band. “The famous man,” his name signifies — and yet, by the cruel irony of the ages, he is now among the most forgotten of his order.',
  },
  {
    slug: 'leopold', name: 'Leopold', tier: 'Coaevi', office: 'Throne',
    blurb: 'Patron of nobles, aristocrats, and royalty; the saint of the settled aristocracy that rose once the conquering was done and the great houses took their lands and titles.',
  },

  // ── Sancti Minores ───────────────────────────────────────────
  {
    slug: 'caanan', name: 'Caanan', tier: 'Minores', office: 'Misfortune',
    blurb: 'Once numbered among the early saints, Caanan has no canon, no order, and no known follower; his name is invoked only by the common man when misfortune strikes, and the schoolmen are divided whether he be a saint at all or a Hellion in saint’s clothing. He is rightly the patron of the very thing he has become: the Forgotten — and stands first among the countless Sancti Minores.',
  },

  // ── Further Sancti Minores (named in primary sources) ─────────
  {
    slug: 'kez', name: 'Kez', tier: 'Minores', office: 'Law & Justice',
    blurb: 'Called "Kez the Damann." One of Beaumont’s Later Saints — patron of police, law, and justice, and of the Ferals who forsake the dark for the Faith. His canon stands close to the work of the Inquisition.',
  },
  {
    slug: 'florian', name: 'Florian', tier: 'Minores', office: 'Art & Lovers',
    blurb: 'One of Beaumont’s Later Saints — patron of art, sculpture, and lovers; the saint of beauty wrought by mortal hands.',
  },
  {
    slug: 'cardigan', name: 'Cardigan', tier: 'Minores', office: 'Patron of the Republic of Waldheim',
    blurb: 'The regional patron of the Republic of Waldheim and all its Saintly people. He holds no writ from the Scion and little wealth or influence beyond the Republic, yet his shrines stand everywhere within it, and all civil proceedings are commended to his guidance.',
  },
  {
    slug: 'serra', name: 'Serra', tier: 'Minores', office: 'Healing',
    blurb: 'Known chiefly through her relic, the Hand of Saint Serra, which is said to cure many diseases. The Hand was carried into the Western Theatre during the Fourth Crusade and never returned; the High Clergy of St. Ulric remain its Custodians.',
  },
  {
    slug: 'kerrigan', name: 'Kerrigan', tier: 'Minores', office: 'The Inquisition',
    blurb: 'The saint whose canon produced Inquisitor-Cardinal Hanzig Van Tassel, author of Adnihilo Inter Nos. His followers number among the hunters of demons and the watchers for possession.',
  },
  {
    slug: 'theobald', name: 'Theobald', tier: 'Minores', office: 'A canon of loose writ',
    blurb: 'A saint whose Canon was granted only a loose Writ by the Scion — named in the records of the faith’s many canons, but little else of him is now remembered.',
  },
  {
    slug: 'lorrigan', name: 'Lorrigan', tier: 'Minores', office: 'Escape & deliverance',
    blurb: 'Invoked by those who would escape confinement, for it is said that Saint Lorrigan made a living escape from his own unfounded grave.',
  },
  {
    slug: 'oledan', name: 'Oledan', tier: 'Minores', office: 'An obscure feast',
    blurb: 'An obscure saint of the Valdenwail, known to outsiders only by his Feast — on which day the Scion’s seat admits no visitors. Brother Stephan Dunmorrow first learned the name while shut out in the rain.',
  },
  {
    slug: 'belarus', name: 'Belarus', tier: 'Minores', office: 'An obscure feast',
    blurb: 'An obscure saint of the Valdenwail, venerated on the day of the Consumption of St. Belarus — one of the many holy days on which the Scion will receive no guest.',
  },
  {
    slug: 'donovan', name: 'Donovan', tier: 'Minores', office: 'An obscure feast',
    blurb: 'An obscure saint of the Valdenwail, venerated on the day of the Immolation of St. Donovan.',
  },
  {
    slug: 'gideon', name: 'Gideon', tier: 'Minores', office: 'A saint of the City of Avitus', noAutoLink: true,
    blurb: 'A saint honoured in the City of Avitus, where a district and an annexed town bear his name. The Scion’s own physician and most trusted advisor — Doctor Gideon, who alone speaks for the Valdenwail at Conclave — is named for him.',
  },
  {
    slug: 'pitt', name: 'Pitt', tier: 'Minores', office: 'A saint of the City of Avitus', noAutoLink: true,
    blurb: 'Saint Pitt’s Town, now a transient quarter of stockyards and barracks, is named for him — a waystation where the crusading orders gather before the long march to Lysander.',
  },
  {
    slug: 'william', name: 'William', tier: 'Minores', office: 'An obscure feast', noAutoLink: true,
    blurb: 'An obscure saint of the Valdenwail, venerated on the day of the Crucifixion of St. William.',
  },
  {
    slug: 'troy', name: 'Troy', tier: 'Minores', office: 'A saint of the Republic', noAutoLink: true,
    blurb: 'A saint of the Republic of Waldheim; the county and seat of St. Troy-on-the-Moor bears his name.',
  },

  // ── Saints of the Bishopric of St. Ignatius ──────────────────
  {
    slug: 'cyprian', name: 'Cyprian', tier: 'Minores', office: 'Grammar & the Preserved Word',
    blurb: 'A follower of St. Ignatius who, in the first years of the Repurgo, devised a wholly new alphabet and tongue — the Cyprian hand — into which the Bishopric’s scholars copied their books, hiding a library’s worth of learning in a script the burners could not read. For it he was put to death by an inquisitor in 1233; three-and-thirty years on, the Bishopric sainted the man its own age had killed. In the mountains of St. Ignatius his veneration runs as deep as the founder’s own, and every grammar school in the Bishopric is kept by the clergy of his canon, who teach the Cyprian letters to this day.',
  },
  {
    slug: 'carpathius', name: 'Carpathius', tier: 'Minores', office: 'Founder of St. Carpathi',
    blurb: 'The founder-saint of St. Carpathi, a hermit who climbed into the high valleys of the Bishopric of St. Ignatius some five centuries ago and gathered the first settlement about him. When a clan of Ferals came down from the peaks upon the young town, Carpathius fell defending it, and the folk held the ground he died on. Much of his remains lie in his shrine in the town that bears his name, and a single family, who trace their blood to him, have led St. Carpathi ever since.',
  },
];

export function saintsByTier(tier: Tier): Saint[] {
  return SAINTS.filter((s) => s.tier === tier);
}

export function getSaint(slug: string): Saint | undefined {
  return SAINTS.find((s) => s.slug === slug);
}

// Order an upper tier's saints by the canonical office sequence.
export function orderedByOffice(tier: Tier): Saint[] {
  return saintsByTier(tier).sort(
    (a, b) => OFFICE_ORDER.indexOf(a.office) - OFFICE_ORDER.indexOf(b.office)
  );
}

export const FUNDATORES = SAINTS.filter((s) => s.fundator);
