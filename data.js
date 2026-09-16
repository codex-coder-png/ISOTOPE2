/* ============ ISOTOPE · data.js — elements, real molecules, mastery, enemies ============ */
'use strict';
window.DATA = {};
(function () {
  const CATS = [
    {
      n: 'Alkali Metal', h: 12, dmg: 13, rate: 1.5, ps: 330, kb: 140, cost: 1.15, style: 'boom', tox: 1, react: 5,
      blurb: 'Volatile shots detonate on impact.', act: { name: 'Blast', ic: '💥', cd: 6, desc: 'Massive detonation around you.' }
    },
    {
      n: 'Alkaline Earth', h: 36, dmg: 22, rate: .85, ps: 300, kb: 280, cost: 1.1, style: 'heavy', tox: 0, react: 3,
      blurb: 'Dense slugs with crushing knockback.', act: { name: 'Seismic Slam', ic: '⛰', cd: 7, desc: 'AoE shockwave that hurls enemies back.' }
    },
    {
      n: 'Transition Metal', h: 212, dmg: 10, rate: 2.2, ps: 380, kb: 90, cost: 1.0, style: 'metal', tox: 0, react: 2,
      blurb: 'Rapid-fire metallic shards.', act: { name: 'Blade Storm', ic: '🗡', cd: 5, desc: 'Radial fan of piercing shards.' }
    },
    {
      n: 'Post-Transition', h: 168, dmg: 18, rate: 1.1, ps: 285, kb: 230, cost: 1.1, style: 'dense', tox: 1, react: 2,
      blurb: 'Heavy rounds that shove enemies back.', act: { name: 'Heavy Crush', ic: '⬇', cd: 7, desc: 'Fires a colossal piercing slug.' }
    },
    {
      n: 'Metalloid', h: 90, dmg: 12, rate: 1.6, ps: 340, kb: 100, cost: 1.2, style: 'phase', tox: 1, react: 3,
      blurb: 'Warping bolts · +1 pierce.', act: { name: 'Phase Shift', ic: '➤', cd: 5, desc: 'Teleport through foes, damaging them.' }
    },
    {
      n: 'Reactive Nonmetal', h: 196, dmg: 11, rate: 1.9, ps: 420, kb: 80, cost: 1.0, style: 'pure', tox: 0, react: 4,
      blurb: 'Clean fast bolts · +8% crit.', act: { name: 'Pure Beam', ic: '☄', cd: 6, desc: 'Sweeping piercing beam burst.' }
    },
    {
      n: 'Halogen', h: 120, dmg: 11, rate: 1.7, ps: 360, kb: 80, cost: 1.25, style: 'corrode', tox: 5, react: 5,
      blurb: 'Corrosive poison on hit.', act: { name: 'Toxic Bloom', ic: '☠', cd: 7, desc: 'Erupts a large poison field.' }
    },
    {
      n: 'Noble Gas', h: 306, dmg: 9, rate: 2.4, ps: 460, kb: 30, cost: 1.3, style: 'inert', tox: 0, react: 0,
      blurb: 'Untouched beams · +2 pierce.', act: { name: 'Inert Field', ic: '◈', cd: 9, desc: 'Brief invulnerability pulse.' }
    },
    {
      n: 'Lanthanide', h: 268, dmg: 12, rate: 1.6, ps: 350, kb: 90, cost: 1.35, style: 'magnet', tox: 0, react: 2,
      blurb: 'Shots subtly seek targets.', act: { name: 'Magnetic Pull', ic: '🧲', cd: 7, desc: 'Drags all enemies inward and crushes.' }
    },
    {
      n: 'Actinide', h: 72, dmg: 15, rate: 1.4, ps: 340, kb: 100, cost: 1.5, style: 'rad', tox: 4, react: 4,
      blurb: 'Radioactive aura scorches nearby foes.', act: { name: 'Meltdown', ic: '☢', cd: 8, desc: 'Sustained radiation nova burst.' }
    },
    {
      n: 'Superheavy · Unstable', h: 336, dmg: 16, rate: 1.5, ps: 360, kb: 110, cost: 1.7, style: 'chaos', tox: 3, react: 5,
      blurb: 'Unpredictable critical surges.', act: { name: 'Collapse', ic: '⬤', cd: 9, desc: 'Forms a collapsing gravity singularity.' }
    }];

  const EDATA = `1|H|Hydrogen|5|1|1
2|He|Helium|7|18|1
3|Li|Lithium|0|1|2
4|Be|Beryllium|1|2|2
5|B|Boron|4|13|2
6|C|Carbon|5|14|2
7|N|Nitrogen|5|15|2
8|O|Oxygen|5|16|2
9|F|Fluorine|6|17|2
10|Ne|Neon|7|18|2
11|Na|Sodium|0|1|3
12|Mg|Magnesium|1|2|3
13|Al|Aluminium|3|13|3
14|Si|Silicon|4|14|3
15|P|Phosphorus|5|15|3
16|S|Sulfur|5|16|3
17|Cl|Chlorine|6|17|3
18|Ar|Argon|7|18|3
19|K|Potassium|0|1|4
20|Ca|Calcium|1|2|4
21|Sc|Scandium|2|3|4
22|Ti|Titanium|2|4|4
23|V|Vanadium|2|5|4
24|Cr|Chromium|2|6|4
25|Mn|Manganese|2|7|4
26|Fe|Iron|2|8|4
27|Co|Cobalt|2|9|4
28|Ni|Nickel|2|10|4
29|Cu|Copper|2|11|4
30|Zn|Zinc|2|12|4
31|Ga|Gallium|3|13|4
32|Ge|Germanium|4|14|4
33|As|Arsenic|4|15|4
34|Se|Selenium|5|16|4
35|Br|Bromine|6|17|4
36|Kr|Krypton|7|18|4
37|Rb|Rubidium|0|1|5
38|Sr|Strontium|1|2|5
39|Y|Yttrium|2|3|5
40|Zr|Zirconium|2|4|5
41|Nb|Niobium|2|5|5
42|Mo|Molybdenum|2|6|5
43|Tc|Technetium|2|7|5
44|Ru|Ruthenium|2|8|5
45|Rh|Rhodium|2|9|5
46|Pd|Palladium|2|10|5
47|Ag|Silver|2|11|5
48|Cd|Cadmium|2|12|5
49|In|Indium|3|13|5
50|Sn|Tin|3|14|5
51|Sb|Antimony|4|15|5
52|Te|Tellurium|4|16|5
53|I|Iodine|6|17|5
54|Xe|Xenon|7|18|5
55|Cs|Caesium|0|1|6
56|Ba|Barium|1|2|6
57|La|Lanthanum|8|3|8
58|Ce|Cerium|8|4|8
59|Pr|Praseodymium|8|5|8
60|Nd|Neodymium|8|6|8
61|Pm|Promethium|8|7|8
62|Sm|Samarium|8|8|8
63|Eu|Europium|8|9|8
64|Gd|Gadolinium|8|10|8
65|Tb|Terbium|8|11|8
66|Dy|Dysprosium|8|12|8
67|Ho|Holmium|8|13|8
68|Er|Erbium|8|14|8
69|Tm|Thulium|8|15|8
70|Yb|Ytterbium|8|16|8
71|Lu|Lutetium|8|17|8
72|Hf|Hafnium|2|4|6
73|Ta|Tantalum|2|5|6
74|W|Tungsten|2|6|6
75|Re|Rhenium|2|7|6
76|Os|Osmium|2|8|6
77|Ir|Iridium|2|9|6
78|Pt|Platinum|2|10|6
79|Au|Gold|2|11|6
80|Hg|Mercury|2|12|6
81|Tl|Thallium|3|13|6
82|Pb|Lead|3|14|6
83|Bi|Bismuth|3|15|6
84|Po|Polonium|3|16|6
85|At|Astatine|6|17|6
86|Rn|Radon|7|18|6
87|Fr|Francium|0|1|7
88|Ra|Radium|1|2|7
89|Ac|Actinium|9|3|9
90|Th|Thorium|9|4|9
91|Pa|Protactinium|9|5|9
92|U|Uranium|9|6|9
93|Np|Neptunium|9|7|9
94|Pu|Plutonium|9|8|9
95|Am|Americium|9|9|9
96|Cm|Curium|9|10|9
97|Bk|Berkelium|9|11|9
98|Cf|Californium|9|12|9
99|Es|Einsteinium|9|13|9
100|Fm|Fermium|9|14|9
101|Md|Mendelevium|9|15|9
102|No|Nobelium|9|16|9
103|Lr|Lawrencium|9|17|9
104|Rf|Rutherfordium|2|4|7
105|Db|Dubnium|2|5|7
106|Sg|Seaborgium|2|6|7
107|Bh|Bohrium|2|7|7
108|Hs|Hassium|2|8|7
109|Mt|Meitnerium|10|9|7
110|Ds|Darmstadtium|10|10|7
111|Rg|Roentgenium|10|11|7
112|Cn|Copernicium|2|12|7
113|Nh|Nihonium|10|13|7
114|Fl|Flerovium|10|14|7
115|Mc|Moscovium|10|15|7
116|Lv|Livermorium|10|16|7
117|Ts|Tennessine|10|17|7
118|Og|Oganesson|10|18|7`;
  const ELEMS = {};
  EDATA.split('\n').forEach(l => {
    const [n, sym, name, cat, g, row] = l.split('|');
    const e = { id: 'e' + n, n: +n, sym, name, cat: +cat, g: +g, row: +row };
    e.hue = CATS[e.cat].h + ((e.n * 13) % 18 - 9);
    e.cost = e.n === 1 || e.n === 6 || e.n === 8 ? 0 : Math.max(25, Math.round((30 + e.n * 2.3) * CATS[e.cat].cost / 5) * 5);
    ELEMS[e.id] = e
  });

  const ELEMENT_FACTS = { "H": "The lightest element and the most abundant element in the universe.", "He": "A noble gas with the lowest boiling point of any element.", "Li": "The lightest metal and a key ingredient in many rechargeable batteries.", "Be": "A very light, stiff metal used in aerospace and precision equipment.", "B": "A metalloid that helps make heat-resistant glass and strong materials.", "C": "The basis of organic chemistry and the element found in diamond and graphite.", "N": "Makes up about 78% of Earth’s atmosphere by volume.", "O": "A highly reactive gas essential to aerobic respiration and combustion.", "F": "The most electronegative and reactive of the halogens.", "Ne": "A noble gas famous for its bright orange-red glow in signs.", "Na": "A soft alkali metal that reacts vigorously with water.", "Mg": "A lightweight metal that burns with an intense white light.", "Al": "A lightweight, corrosion-resistant metal used extensively in transportation.", "Si": "A semiconductor central to computer chips and modern electronics.", "P": "Essential to DNA, RNA and cellular energy molecules such as ATP.", "S": "A yellow nonmetal used in sulfuric acid, fertilizers and many industrial processes.", "Cl": "A reactive halogen widely used to disinfect water and make PVC.", "Ar": "An inert noble gas used where a nonreactive atmosphere is needed.", "K": "An alkali metal important for nerve and muscle function in living organisms.", "Ca": "A major structural component of bones, teeth and many mineral compounds.", "Sc": "A relatively rare metal used in specialized alloys and lighting.", "Ti": "A strong, light, corrosion-resistant metal used in aerospace and implants.", "V": "A transition metal commonly used to strengthen steel alloys.", "Cr": "Gives stainless steel much of its corrosion resistance.", "Mn": "An important alloying element and a trace nutrient for organisms.", "Fe": "The main metal in steel and the key atom in the oxygen-carrying protein hemoglobin.", "Co": "A transition metal used in magnets, superalloys and battery materials.", "Ni": "A corrosion-resistant metal commonly used in stainless steel and plating.", "Cu": "An excellent electrical conductor used extensively in wiring.", "Zn": "An essential trace element and a common protective coating for steel.", "Ga": "A metal that melts near room temperature and can liquefy in your hand.", "Ge": "A metalloid used in semiconductors, fiber-optic systems and infrared optics.", "As": "A toxic metalloid whose compounds have been used in both industry and pigments.", "Se": "A trace nutrient and a semiconductor used in specialized electronics.", "Br": "A reddish-brown halogen that is liquid at room temperature.", "Kr": "A noble gas used in specialized lighting and some lasers.", "Rb": "A soft alkali metal that reacts readily with water and air.", "Sr": "A metal whose compounds are famous for producing a red color in fireworks.", "Y": "A rare-earth metal used in phosphors, ceramics and some lasers.", "Zr": "A corrosion-resistant metal widely used in nuclear-reactor components.", "Nb": "A metal used to strengthen steel and to make superconducting alloys.", "Mo": "A high-melting metal that helps steel retain strength at high temperature.", "Tc": "The first element produced artificially and notable for having no stable isotopes.", "Ru": "A hard platinum-group metal used in catalysts and electronic contacts.", "Rh": "A rare platinum-group metal prized for catalytic converters and reflective coatings.", "Pd": "A platinum-group metal widely used as a catalyst and in electronics.", "Ag": "The best electrical conductor of all elements.", "Cd": "A soft toxic metal historically used in pigments, plating and batteries.", "In": "A soft metal whose compounds are important in transparent conductive coatings.", "Sn": "A soft metal used to coat steel and in many solder alloys.", "Sb": "A brittle metalloid used in flame retardants and metal alloys.", "Te": "A brittle metalloid used in thermoelectric and semiconductor materials.", "I": "A halogen whose compounds are important in biology, medicine and chemistry.", "Xe": "A heavy noble gas used in powerful lamps, ion thrusters and anesthesia research.", "Cs": "An extremely reactive alkali metal used in highly precise atomic clocks.", "Ba": "A dense alkaline-earth metal whose compounds are used in imaging and industry.", "La": "A rare-earth metal used in camera lenses and specialty glass.", "Ce": "The most abundant rare-earth element and a major catalyst component.", "Pr": "A rare-earth metal used in magnets, specialized glass and alloys.", "Nd": "A rare-earth element famous for producing very strong permanent magnets.", "Pm": "A radioactive rare-earth element with no stable isotopes.", "Sm": "A rare-earth element used in strong magnets and neutron-absorbing materials.", "Eu": "A rare-earth element especially important for red and blue phosphors.", "Gd": "A rare-earth element with strong magnetic properties used in some medical imaging agents.", "Tb": "A rare-earth element used in green phosphors and magnetostrictive materials.", "Dy": "A rare-earth element added to magnets to help them perform at high temperature.", "Ho": "A rare-earth element with exceptionally strong magnetic properties.", "Er": "A rare-earth element widely used in fiber-optic amplifiers.", "Tm": "The least abundant naturally occurring lanthanide and a source for portable X-ray devices.", "Yb": "A soft rare-earth metal used in some specialty alloys and atomic-clock research.", "Lu": "The densest and hardest of the lanthanides, used in specialized catalysts and detectors.", "Hf": "A corrosion-resistant metal used in high-temperature alloys and nuclear control materials.", "Ta": "A highly corrosion-resistant metal used in electronics and surgical implants.", "W": "The element with the highest melting point of all pure metals.", "Re": "One of the rarest naturally occurring elements and extremely resistant to heat.", "Os": "One of the densest naturally occurring elements.", "Ir": "An exceptionally corrosion-resistant metal used in high-temperature and spark-plug alloys.", "Pt": "A valuable platinum-group metal and an important industrial catalyst.", "Au": "A highly unreactive metal that resists corrosion and tarnishing.", "Hg": "The only metallic element that is liquid at standard room temperature.", "Tl": "A very toxic, soft metal that was historically used in some specialized applications.", "Pb": "A dense, soft metal historically used in radiation shielding, batteries and construction.", "Bi": "A very heavy metal with unusually low toxicity compared with many neighboring heavy metals.", "Po": "A highly radioactive element discovered by Marie Curie and Pierre Curie.", "At": "One of the rarest naturally occurring elements and highly radioactive.", "Rn": "A radioactive noble gas that can accumulate indoors from uranium-bearing rocks and soil.", "Fr": "An extremely rare and highly radioactive alkali metal.", "Ra": "A radioactive alkaline-earth metal whose decay produces radon.", "Ac": "A radioactive actinide that gives the actinide series its name.", "Th": "A naturally occurring radioactive metal considered for some nuclear-fuel cycles.", "Pa": "A rare radioactive actinide occurring naturally in uranium ores.", "U": "A heavy radioactive element best known for its role in nuclear fuel.", "Np": "The first transuranium element and a radioactive actinide.", "Pu": "A radioactive actinide used in nuclear technology and research.", "Am": "A synthetic radioactive element widely used in ionization-type smoke detectors.", "Cm": "A synthetic radioactive element named after Marie and Pierre Curie.", "Bk": "A synthetic actinide named after Berkeley, California.", "Cf": "A synthetic element used as an intense neutron source in specialized applications.", "Es": "A synthetic actinide first identified in debris from a thermonuclear test.", "Fm": "A synthetic actinide produced in extremely small quantities.", "Md": "A synthetic element named for Dmitri Mendeleev.", "No": "A synthetic element named after Alfred Nobel.", "Lr": "A synthetic actinide named after physicist Ernest Lawrence.", "Rf": "A synthetic superheavy element named after Ernest Rutherford.", "Db": "A synthetic element named after the city of Dubna.", "Sg": "A synthetic element named after Glenn T. Seaborg.", "Bh": "A synthetic superheavy element named after Niels Bohr.", "Hs": "A synthetic element named after the German state of Hesse.", "Mt": "A synthetic superheavy element named after Lise Meitner.", "Ds": "A synthetic element named after Darmstadt, Germany.", "Rg": "A synthetic element named after Wilhelm Röntgen.", "Cn": "A synthetic element named after astronomer Nicolaus Copernicus.", "Nh": "A synthetic element named for Japan, Nihon.", "Fl": "A synthetic superheavy element named after the Flerov Laboratory of Nuclear Reactions.", "Mc": "A synthetic element named after the Moscow Oblast.", "Lv": "A synthetic element named after Lawrence Livermore National Laboratory.", "Ts": "A synthetic halogen named after the U.S. state of Tennessee.", "Og": "A synthetic superheavy noble gas named after physicist Yuri Oganessian." };
  // Every selectable isotope gets a personal signature, rather than inheriting
  // one generic category skill. Fusions use the same system with their formula
  // as the seed, so they receive their own named active as well.
  const SIGNATURES = [
    ['pulse', 'Ion Pulse', '✦', 'Detonates a focused ion shockwave.'],
    ['lance', 'Spectral Lance', '➤', 'Fires a long piercing elemental lance.'],
    ['orbit', 'Electron Crown', '◉', 'Launches a rotating ring of charged particles.'],
    ['veil', 'Phase Veil', '◇', 'Blink forward and become briefly untouchable.'],
    ['storm', 'Arc Storm', 'ϟ', 'Chains electricity through the nearest hostiles.'],
    ['bloom', 'Catalyst Bloom', '✹', 'Creates a lingering reactive field.'],
    ['anchor', 'Mass Anchor', '⬣', 'Pins nearby enemies and crushes them inward.'],
    ['ward', 'Noble Ward', '◈', 'Shields allies and clears incoming pressure.'],
    ['flare', 'Photon Flare', '☀', 'Emits a blinding burst that stuns hostiles.'],
    ['drill', 'Crystal Drill', '◆', 'Releases a spread of armor-piercing shards.'],
    ['tide', 'Molecular Tide', '≈', 'Expands a rolling wave that slows foes.'],
    ['nova', 'Decay Nova', '☢', 'Releases three delayed radioactive detonations.']
  ];
  function sigHash(s) { return [...String(s)].reduce((v, c) => (v * 31 + c.charCodeAt(0)) >>> 0, 7) }
  function signatureFor(el) {
    const seed = el.mol ? sigHash(el.token || el.f || el.name) : el.n;
    const base = SIGNATURES[seed % SIGNATURES.length];
    const label = el.mol ? (el.f || el.name) : el.sym;
    return { key: base[0], name: label + ' ' + base[1], ic: base[2], cd: Math.max(4.5, 8 - (seed % 4) * .55), desc: base[3] };
  }
  const CUSTOM_ABILITIES = { "1": { "name": "Hydrogen Burst", "desc": "Fires extremely light projectiles that accelerate over distance. Hold fire to compress hydrogen and release a massive explosive shot." }, "2": { "name": "Float", "desc": "Your character becomes extremely light, allowing them to float over hazards and recoil dramatically from shots. Secondary ability launches helium balloons that pull enemies upward." }, "3": { "name": "Reactive Dash", "desc": "Dashing leaves behind lithium particles. Enemies touching them trigger a violent reaction and explosion." }, "4": { "name": "Lightweight Armor", "desc": "Extremely high movement speed and armor penetration. Your bullets become tiny, fast projectiles that pierce enemies." }, "5": { "name": "Crystal Field", "desc": "Creates crystalline structures that block bullets. Shooting your own crystals causes them to fracture into razor-sharp shards." }, "6": { "name": "Allotropy", "desc": "Switch between Diamond (armor/tank), Graphite (electric conduction), and Carbon Dust (stealth)." }, "7": { "name": "Cryogenic Fog", "desc": "Releases nitrogen vapor that rapidly cools an area, slowing enemies and eventually freezing them." }, "8": { "name": "Combustion", "desc": "Doesn't directly do huge damage; instead, massively amplifies nearby fire/explosions. Creates oxygen zones that make other attacks stronger." }, "9": { "name": "Corrosion", "desc": "Extremely aggressive projectiles that eat through enemy armor. Damage increases against already-damaged targets." }, "10": { "name": "Neon Sign", "desc": "Creates glowing laser barriers. Enemies crossing them take repeated damage. Different colors can correspond to different effects." }, "11": { "name": "Water Reaction", "desc": "Throw sodium pellets that explode when they contact water. Your ability can create temporary water pools specifically to combo with them." }, "12": { "name": "Flashburn", "desc": "Fires extremely bright magnesium flares that blind enemies and illuminate the entire map." }, "13": { "name": "Metal Storm", "desc": "Rapid-fire lightweight metal shards. Huge magazine, extremely fast reload." }, "14": { "name": "Circuit", "desc": "Place conductive nodes that create electrical pathways between each other. Build your own traps around the map." }, "15": { "name": "White Flame", "desc": "Shots leave persistent burning trails. Enemies killed by fire leave additional flames behind." }, "16": { "name": "Sulfur Cloud", "desc": "Creates a yellow toxic cloud that damages enemies over time and obscures vision." }, "17": { "name": "Gas Burst", "desc": "Releases poisonous gas that spreads outward and lingers. Wind/environmental mechanics can move the cloud." }, "18": { "name": "Inert Zone", "desc": "Creates an area where elemental reactions are disabled. Fire can't spread, electricity can't chain, etc." }, "19": { "name": "Overreaction", "desc": "Extremely unstable rapid-fire weapon. Every few shots randomly causes a small explosive reaction." }, "20": { "name": "Bone Wall", "desc": "Summons calcium structures resembling giant skeletal walls. They absorb damage and can be shattered into projectiles." }, "21": { "name": "Reinforcement", "desc": "Temporarily strengthens every object you interact with: cover, traps, projectiles, etc." }, "22": { "name": "Titan Frame", "desc": "Massive damage resistance while maintaining decent speed. Ultimate gives temporary near-unstoppable movement." }, "23": { "name": "Battery Shot", "desc": "Attacks store energy instead of immediately releasing it. Shoot again to discharge all stored energy." }, "24": { "name": "Chromium Coat", "desc": "Reflective armor has a chance to bounce enemy projectiles back toward attackers." }, "25": { "name": "Catalyst", "desc": "Makes nearby elemental effects happen faster and increases reaction speed." }, "26": { "name": "Magnetism", "desc": "Pulls metal projectiles, enemies with metal armor, and dropped objects toward you. Can create a giant magnetic vortex." }, "27": { "name": "Radiant Core", "desc": "Generates an energy core that slowly charges. When full, it releases a powerful beam." }, "28": { "name": "Magnetic Shield", "desc": "Creates a magnetic barrier that deflects certain projectiles." }, "29": { "name": "Conductor", "desc": "Your bullets can jump between enemies. The more connected enemies there are, the stronger the chain becomes." }, "30": { "name": "Sacrificial Plating", "desc": "Damage first consumes a protective zinc layer. When destroyed, it releases a healing burst." }, "31": { "name": "Meltdown", "desc": "Your weapon literally melts into liquid when overheated, temporarily changing its attack pattern." }, "32": { "name": "Semiconductor", "desc": "Toggle between Conductive and Insulating states to control whether your attacks interact with electricity." }, "33": { "name": "Poison Bullet", "desc": "Weak direct damage but devastating poison stacking." }, "34": { "name": "Photoreaction", "desc": "Gets stronger while standing in bright areas. Dark areas make it weaker but increase stealth." }, "35": { "name": "Liquid Hazard", "desc": "Throws bouncing pools of corrosive liquid that remain on the ground." }, "36": { "name": "Flash Lance", "desc": "Fires concentrated beams of light that briefly reveal invisible enemies." }, "37": { "name": "Hyperreactive", "desc": "Every hit builds instability. At maximum instability, your next shot causes a massive chain reaction." }, "38": { "name": "Red Flare", "desc": "Creates brilliant red flares that mark enemies. Marked enemies take increasing damage from all attacks." }, "39": { "name": "Phosphor Drone", "desc": "Summons glowing drones that illuminate enemies and fire tiny energy shots." }, "40": { "name": "Heat Shield", "desc": "Becomes stronger as your surroundings become hotter. Fire attacks actually charge your defenses." }, "41": { "name": "Superconductor", "desc": "Temporarily removes energy loss from your weapons, giving absurdly efficient attacks." }, "42": { "name": "Heatproof", "desc": "Your weapon becomes stronger the longer it fires continuously." }, "43": { "name": "Unstable Shot", "desc": "Every projectile has a chance to decay into another random projectile type." }, "44": { "name": "Catalytic Mark", "desc": "Mark an enemy so all elemental reactions happen dramatically faster on it." }, "45": { "name": "Mirror Armor", "desc": "Reflects a percentage of incoming damage back toward attackers." }, "46": { "name": "Hydrogen Storage", "desc": "Absorbs hydrogen attacks and stores them. Release the stored energy as a giant blast." }, "47": { "name": "Silver Rain", "desc": "Extremely fast projectiles with high precision. Ultimate creates a storm of silver bullets." }, "48": { "name": "Toxic Battery", "desc": "Stores energy from damage taken and converts it into poisonous projectiles." }, "49": { "name": "Liquid Metal", "desc": "Creates flowing metal that snakes around obstacles toward enemies." }, "50": { "name": "Tin Soldier", "desc": "Summons tiny autonomous soldiers that fight alongside you." }, "51": { "name": "Brittle Burst", "desc": "Creates fragile crystal bombs that explode into dozens of shards." }, "52": { "name": "Contamination", "desc": "Infects enemies; killing an infected enemy spreads the effect." }, "53": { "name": "Vapor Mark", "desc": "Creates purple vapor that marks enemies and reveals their health through walls." }, "54": { "name": "Xenon Flash", "desc": "Enormous flash that blinds enemies and briefly freezes weaker enemies." }, "55": { "name": "Time Reaction", "desc": "Extremely unstable. Your shots become faster and stronger every second until they trigger a massive reaction." }, "56": { "name": "Gravity Shell", "desc": "Creates heavy projectiles that bend enemy movement toward their impact points." }, "57": { "name": "Element Shift", "desc": "Temporarily copies the basic property of a nearby elemental attack." }, "58": { "name": "Spark Stone", "desc": "Creates friction sparks when moving, leaving damaging trails behind you." }, "59": { "name": "Magnetic Swarm", "desc": "Fires several small magnetic projectiles that curve toward enemies." }, "60": { "name": "Ultimate Magnet", "desc": "Creates an enormous magnetic field that pulls enemies, weapons, and projectiles toward a central point." }, "61": { "name": "Decay Beacon", "desc": "Place a radioactive beacon that continuously damages everything around it." }, "62": { "name": "Magnetic Mine", "desc": "Mines attract nearby enemies before detonating." }, "63": { "name": "Red Phosphor", "desc": "Marks enemies with glowing red symbols, making them visible through walls." }, "64": { "name": "Magnetic Armor", "desc": "Magnetic fields reduce incoming projectile damage." }, "65": { "name": "Green Pulse", "desc": "Emits periodic pulses that disable enemy abilities." }, "66": { "name": "Extreme Magnet", "desc": "Creates an extremely powerful but tiny magnetic field that violently drags enemies together." }, "67": { "name": "Magnetic Lance", "desc": "Charges a straight-line attack that ignores most enemy armor." }, "68": { "name": "Fiber Beam", "desc": "Fires extremely thin, precise laser threads." }, "69": { "name": "Rare Shot", "desc": "Extremely slow-firing weapon with enormous single-target damage." }, "70": { "name": "Atomic Pulse", "desc": "Charge your weapon by standing still; movement cancels the charge but allows rapid repositioning." }, "71": { "name": "Precision Core", "desc": "Crit chance and weak-point damage increase dramatically." }, "72": { "name": "Energy Reserve", "desc": "Stores incoming energy and releases it when your health becomes low." }, "73": { "name": "Unbreakable", "desc": "Creates temporary armor that cannot be destroyed, but greatly slows movement." }, "74": { "name": "Heavy Shell", "desc": "Fires incredibly slow, gigantic projectiles with massive impact force." }, "75": { "name": "Overheat Mastery", "desc": "Your weapon gets stronger at extreme heat instead of overheating normally." }, "76": { "name": "Density", "desc": "Become extremely heavy. You can't be knocked back and your attacks create shockwaves." }, "77": { "name": "Meteorite", "desc": "Calls down extremely dense impact strikes from above." }, "78": { "name": "Catalyst", "desc": "Greatly amplifies status effects without directly increasing base damage." }, "79": { "name": "Midas", "desc": "Enemies you kill drop gold. Gold can temporarily increase damage, speed, or health." }, "80": { "name": "Liquid Body", "desc": "Become a flowing liquid that can slip through small gaps and split into multiple droplets." }, "81": { "name": "Delayed Poison", "desc": "Damage doesn't happen immediately; instead, enemies accumulate lethal poison that triggers simultaneously." }, "82": { "name": "Lead Barrier", "desc": "Extremely effective radiation shielding. Creates a heavy wall that blocks radiation and projectiles." }, "83": { "name": "Crystal Growth", "desc": "Creates beautiful stepped crystals that continuously grow outward and damage enemies." }, "84": { "name": "Radiation Touch", "desc": "Enemies you hit become radioactive and damage other enemies nearby." }, "85": { "name": "Decay Curse", "desc": "Extremely powerful radioactive curse with a short duration." }, "86": { "name": "Invisible Gas", "desc": "Creates an invisible toxic zone. Enemies don't know they're inside until damage begins." }, "87": { "name": "Critical Reaction", "desc": "One of the most unstable elements: every attack has an escalating chance to cause a gigantic reaction." }, "88": { "name": "Radiant Aura", "desc": "Constantly emits radiation around you. The longer enemies stay nearby, the more damage they take." }, "89": { "name": "Radiation Core", "desc": "Slowly generates radioactive energy, allowing you to fire increasingly powerful radiation blasts." }, "90": { "name": "Decay Cannon", "desc": "Slow but extremely powerful shots that leave radiation zones behind." }, "91": { "name": "Decay Chain", "desc": "Every hit cycles through multiple radioactive effects before reaching its final form." }, "92": { "name": "Fission", "desc": "Shots split into smaller projectiles when hitting enemies. Those split again on subsequent hits." }, "93": { "name": "Deep Radiation", "desc": "Projectiles pass through walls but lose damage with distance." }, "94": { "name": "Critical Mass", "desc": "Collect energy from kills. Reach critical mass to trigger a gigantic explosion." }, "95": { "name": "Smoke Detector", "desc": "Creates invisible detection zones that reveal enemies through walls." }, "96": { "name": "Heat Ray", "desc": "Emits constant radiation that becomes stronger while aimed at the same enemy." }, "97": { "name": "Decay Bomb", "desc": "Throw a bomb that slowly decays before violently detonating." }, "98": { "name": "Neutron Burst", "desc": "Fires extremely powerful neutron-like blasts that pass through multiple enemies." }, "99": { "name": "Brainwave", "desc": "Temporarily slows enemy AI and causes enemies to behave erratically." }, "100": { "name": "Atomic Collapse", "desc": "Fires unstable particles that collapse into explosions after traveling a certain distance." }, "101": { "name": "Chain Reaction", "desc": "Every kill increases your damage until you stop killing enemies." }, "102": { "name": "Noble Decay", "desc": "Creates an area where enemies slowly lose their buffs and abilities." }, "103": { "name": "Particle Lance", "desc": "Fires an extremely narrow beam with almost no spread." }, "104": { "name": "Heavy Particle", "desc": "Slow projectiles that massively knock enemies backward." }, "105": { "name": "Split Decay", "desc": "Projectiles randomly split into different trajectories after hitting something." }, "106": { "name": "Decay Reactor", "desc": "Place a reactor that continuously produces increasingly powerful radiation pulses." }, "107": { "name": "Impact Frame", "desc": "Your attacks become stronger based on how fast you're moving." }, "108": { "name": "Dense Core", "desc": "Creates extremely dense gravitational projectiles." }, "109": { "name": "Unknown Reaction", "desc": "Every shot has a randomly selected effect from a controlled pool." }, "110": { "name": "Ultra-Dense Shot", "desc": "Fires tiny projectiles that deal enormous damage but have extremely slow fire rates." }, "111": { "name": "X-Ray Vision", "desc": "See enemies, items, traps, and weak points through walls." }, "112": { "name": "Phase Shift", "desc": "Briefly become intangible and pass through enemies/projectiles." }, "113": { "name": "Decay Mark", "desc": "Mark enemies; after enough hits, their mark detonates and spreads to nearby targets." }, "114": { "name": "Superheavy Shot", "desc": "Extremely heavy bullets barely get affected by knockback, explosions, or enemy abilities." }, "115": { "name": "Unstable Core", "desc": "Your health slowly converts into ammunition/energy, making it a high-risk glass-cannon element." }, "116": { "name": "Radioactive Sludge", "desc": "Fires sticky projectiles that remain attached to enemies and continuously damage them." }, "117": { "name": "Reactive Poison", "desc": "Combines poison with highly reactive explosions when poisoned enemies are hit again." }, "118": { "name": "Atomic Singularity", "desc": "Ultimate creates a temporary miniature gravitational field that pulls enemies and projectiles inward before collapsing in a massive explosion." } };
  Object.values(ELEMS).forEach(e => {
    const sig = signatureFor(e), custom = CUSTOM_ABILITIES[String(e.n)];
    e.act = custom ? { ...sig, name: custom.name, desc: custom.desc } : sig;
  });

  /* ---- REAL molecules & reactions (all are genuine chemistry) ---- */
  function M(token, f, name, hue, mods, trait, desc, rx) {
    const m = { token, f, name, hue, mods, trait, desc, rx, mol: true };
    m.act = signatureFor(m); return m
  }
  const MOLDEF = {
    'H+H+O': M('H2O', 'H₂O', 'Water', 203, { rate: 1.1, hp: 1.2 }, 'hydrate', 'Regen 1.5 HP/s · hits chill.', '2H + O → H₂O'),
    'H+O': M('OH', '•OH', 'Hydroxyl Radical', 185, { dmg: 1.35, hp: .85 }, 'none', 'Savage oxidizer, fragile vessel.', 'H + O → •OH'),
    'O+O': M('O3', 'O₃', 'Ozone', 265, { rate: 1.15, ps: 1.1 }, 'chain', 'Hits arc lightning.', 'O + O → O₃'),
    'C+O': M('CO', 'CO', 'Carbon Monoxide', 222, { dmg: 1.1 }, 'toxic', 'Lingering poison.', 'C + O → CO'),
    'C+O+O': M('CO2', 'CO₂', 'Carbon Dioxide', 210, { dmg: 1.1, kb: 1.3, rate: .95 }, 'chill', 'Blasts freeze enemies.', 'C + O₂ → CO₂'),
    'C+N': M('CN', 'CN', 'Cyanide Radical', 130, { dmg: 1.25, rate: 1.05, hp: .9 }, 'toxic', 'Lethal biotoxin.', 'C + N → CN•'),
    'Cl+Na': M('NaCl', 'NaCl', 'Halite', 195, { dmg: 1.1, kb: 1.25, crit: 18 }, 'none', '+18% crit, heavy knockback.', 'Na + Cl → NaCl'),
    'Cl+H': M('HCl', 'HCl', 'Hydrochloric Acid', 95, { dmg: 1.1 }, 'acid', 'Marks foes: +35% dmg taken.', 'H + Cl → HCl'),
    'H+H+H+N': M('NH3', 'NH₃', 'Ammonia', 175, { rate: 1.1 }, 'vital', 'Heal 2 HP per kill.', 'N + 3H → NH₃'),
    'Fe+O': M('FeO', 'FeO', 'Wüstite', 18, { hp: 1.3, kb: 1.5, rate: .9 }, 'armor', '25% damage reduction.', 'Fe + O → FeO'),
    'O+O+S': M('SO2', 'SO₂', 'Sulfur Dioxide', 65, { dmg: 1.05 }, 'cloud', 'Leaves acid clouds.', 'S + O₂ → SO₂'),
    'N+O': M('NO', 'NO', 'Nitric Oxide', 230, { spd: 1.2, rate: 1.15 }, 'none', 'Move & fire faster.', 'N + O → NO'),
    'N+N+O': M('N2O', 'N₂O', 'Nitrous Oxide', 295, { rate: 1.1, crit: 15 }, 'giggle', '+15% crit; foes stagger.', '2N + O → N₂O'),
    'H+H+S': M('H2S', 'H₂S', 'Hydrogen Sulfide', 75, { dmg: 1.15 }, 'miasma', 'Poison and slow.', '2H + S → H₂S'),
    'C+C+H+H': M('C2H2', 'C₂H₂', 'Acetylene', 32, { dmg: 1.25 }, 'boom', 'Shots detonate.', '2C + 2H → C₂H₂'),
    'C+Fe': M('Steel', 'Fe·C', 'STEEL', 215, { hp: 1.35, dmg: 1.1, kb: 1.3, rate: .95 }, 'armor', 'Tough forged alloy.', 'Fe + C → steel'),
    'Cu+Sn': M('Bronze', 'Cu·Sn', 'BRONZE', 38, { rate: 1.25, dmg: 1.05 }, 'none', 'Relentless fire rate.', 'Cu + Sn → bronze'),
    'Cu+Zn': M('Brass', 'Cu·Zn', 'BRASS', 48, { rate: 1.1, pierce: 1 }, 'none', 'Rounds pierce +1.', 'Cu + Zn → brass'),
    'O+O+Si': M('SiO2', 'SiO₂', 'Quartz', 315, { ps: 1.2, pierce: 2, crit: 10 }, 'none', '+2 pierce, +10% crit.', 'Si + O₂ → SiO₂'),
    'Mg+O': M('MgO', 'MgO', 'Magnesia', 55, { hp: 1.1 }, 'flash', 'Flash stuns foes.', 'Mg + O → MgO'),
    'Cl+K': M('KCl', 'KCl', 'Sylvite', 280, { dmg: 1.2 }, 'none', 'Violet flame force.', 'K + Cl → KCl'),
    'H+Na+O': M('NaOH', 'NaOH', 'Caustic Soda', 120, { dmg: 1.2 }, 'acid', 'Severe acid marking.', 'Na+O+H → NaOH'),
    'Ca+O': M('CaO', 'CaO', 'Quicklime', 25, { dmg: 1.1 }, 'burn', 'Ignites enemies.', 'Ca + O → CaO'),
    'H+H+O+O': M('H2O2', 'H₂O₂', 'Hydrogen Peroxide', 190, { dmg: 1.15, rate: 1.05 }, 'boom', 'Volatile detonations.', '2H+2O → H₂O₂'),
    'Ag+Au': M('Electrum', 'Au·Ag', 'ELECTRUM', 48, { dmg: 1.1, crit: 5 }, 'lucky', '+40% coin drops.', 'Au + Ag → electrum'),
    'C+H+H+H+H': M('CH4', 'CH₄', 'Methane', 210, { dmg: 1.1, rate: 1.05 }, 'boom', 'Flammable: explodes.', 'C + 4H → CH₄'),
    'C+H+N': M('HCN', 'HCN', 'Hydrogen Cyanide', 130, { dmg: 1.3, hp: .9 }, 'toxic', 'Deadly toxin.', 'H+C+N → HCN'),
    'C+H+H+O': M('CH2O', 'CH₂O', 'Formaldehyde', 180, { rate: 1.1 }, 'toxic', 'Preservative poison.', 'C+2H+O → CH₂O'),
    'N+O+O': M('NO2', 'NO₂', 'Nitrogen Dioxide', 30, { dmg: 1.15 }, 'miasma', 'Toxic brown gas.', 'N + O₂ → NO₂'),
    'O+O+O+S': M('SO3', 'SO₃', 'Sulfur Trioxide', 60, { dmg: 1.15 }, 'acid', 'Acid anhydride.', 'S + 3O → SO₃'),
    'Cu+O': M('CuO', 'CuO', 'Tenorite', 20, { dmg: 1.1, kb: 1.2 }, 'burn', 'Hot copper oxide.', 'Cu + O → CuO'),
    'O+Zn': M('ZnO', 'ZnO', 'Zinc Oxide', 200, { hp: 1.15 }, 'armor', 'Protective oxide.', 'Zn + O → ZnO'),
    'Ag+Ag+S': M('Ag2S', 'Ag₂S', 'Acanthite', 240, { dmg: 1.1 }, 'toxic', 'Silver tarnish.', '2Ag + S → Ag₂S'),
    'O+Pb': M('PbO', 'PbO', 'Massicot', 45, { dmg: 1.2, kb: 1.3, rate: .9 }, 'armor', 'Heavy lead oxide.', 'Pb + O → PbO'),
    'Na+Na+O': M('Na2O', 'Na₂O', 'Sodium Oxide', 58, { dmg: 1.1 }, 'acid', 'Reactive base oxide.', '2Na + O → Na₂O'),
    'K+K+O': M('K2O', 'K₂O', 'Potash', 40, { dmg: 1.1, rate: 1.05 }, 'burn', 'Caustic potash.', '2K + O → K₂O'),
    'Ca+Cl+Cl': M('CaCl2', 'CaCl₂', 'Calcium Chloride', 190, { rate: 1.1 }, 'chill', 'De-icing chill.', 'Ca + 2Cl → CaCl₂'),
    'Cl+Cl+Mg': M('MgCl2', 'MgCl₂', 'Magnesium Chloride', 185, { rate: 1.05 }, 'chill', 'Bittern salts.', 'Mg + 2Cl → MgCl₂'),
    'F+Na': M('NaF', 'NaF', 'Sodium Fluoride', 160, { dmg: 1.1, crit: 8 }, 'none', 'Enamel-hard edge.', 'Na + F → NaF'),
    'F+K': M('KF', 'KF', 'Potassium Fluoride', 155, { dmg: 1.1 }, 'toxic', 'Corrosive fluoride.', 'K + F → KF'),
    'F+Li': M('LiF', 'LiF', 'Lithium Fluoride', 150, { ps: 1.15 }, 'none', 'Optical crystal.', 'Li + F → LiF'),
    'Ag+Cl': M('AgCl', 'AgCl', 'Chlorargyrite', 230, { dmg: 1.1, crit: 6 }, 'flash', 'Photographic flash.', 'Ag + Cl → AgCl'),
    'Ag+N+O+O+O': M('AgNO3', 'AgNO₃', 'Silver Nitrate', 225, { dmg: 1.2, crit: 8 }, 'acid', 'Caustic lunar salt.', 'Ag+N+3O → AgNO₃'),
    'K+N+O+O+O': M('KNO3', 'KNO₃', 'Saltpeter', 35, { dmg: 1.15, rate: 1.1 }, 'burn', 'Oxidizer of gunpowder.', 'K+N+3O → KNO₃'),
    'As+Ga': M('GaAs', 'GaAs', 'Gallium Arsenide', 300, { rate: 1.2, ps: 1.1 }, 'battery', 'Semiconductor speed.', 'Ga + As → GaAs'),
    'In+P': M('InP', 'InP', 'Indium Phosphide', 290, { rate: 1.15, ps: 1.15 }, 'battery', 'Photonic crystal.', 'In + P → InP'),
    'Cd+Te': M('CdTe', 'CdTe', 'Cadmium Telluride', 310, { dmg: 1.1, rate: 1.1 }, 'battery', 'Solar-cell lattice.', 'Cd + Te → CdTe'),
    'Al+Al+O+O+O': M('Al2O3', 'Al₂O₃', 'Sapphire', 220, { hp: 1.25, armor: 1 }, 'armor', 'Corundum: 25% DR.', '2Al+3O → Al₂O₃'),
    'Fe+Fe+O+O+O': M('Fe2O3', 'Fe₂O₃', 'Hematite', 10, { dmg: 1.1, kb: 1.3 }, 'burn', 'Red iron oxide.', '2Fe+3O → Fe₂O₃'),
    'C+Si': M('SiC', 'SiC', 'Carborundum', 140, { dmg: 1.2, kb: 1.2, pierce: 1 }, 'none', 'Abrasive-hard edges.', 'Si + C → SiC'),
    'Ni+Ti': M('NiTi', 'NiTi', 'Nitinol', 205, { rate: 1.1, hp: 1.15 }, 'vital', 'Shape-memory: self-repair.', 'Ni + Ti → NiTi'),
    'Cu+Ni': M('CuNi', 'Cu·Ni', 'Cupronickel', 198, { rate: 1.15, dmg: 1.05 }, 'none', 'Coin-metal alloy.', 'Cu + Ni → cupronickel'),
    'Ag+Cu': M('Sterling', 'Ag·Cu', 'STERLING', 210, { rate: 1.2, crit: 10 }, 'none', '925 silver: fast & keen.', 'Ag + Cu → sterling'),
    'Cu+Au': M('RoseGold', 'Au·Cu', 'ROSE GOLD', 15, { crit: 12, dmg: 1.1 }, 'lucky', 'Ornate & precise.', 'Au + Cu → rose gold'),
    'Ni+Au': M('WhiteGold', 'Au·Ni', 'WHITE GOLD', 50, { crit: 10, dmg: 1.15 }, 'lucky', 'Pale gold alloy.', 'Au + Ni → white gold'),
    'Pb+Sn': M('Solder', 'Sn·Pb', 'SOLDER', 225, { rate: 1.15, kb: .8 }, 'none', 'Low-melt binder.', 'Sn + Pb → solder'),
    'Cu+Sb+Sn': M('Pewter', 'Sn·Cu·Sb', 'PEWTER', 218, { hp: 1.15, kb: 1.2 }, 'none', 'Soft heavy alloy.', 'Sn+Cu+Sb → pewter'),
    'Ca+C+O+O+O': M('CaCO3', 'CaCO₃', 'Calcite', 195, { hp: 1.2 }, 'armor', 'Limestone armor.', 'Ca+C+3O → CaCO₃'),
    'H+N+O+O+O': M('HNO3', 'HNO₃', 'Nitric Acid', 30, { dmg: 1.25 }, 'corrosive', 'Aqua fortis: melts armor.', 'H+N+3O → HNO₃'),
    'O+O+Ti': M('TiO2', 'TiO₂', 'Titanium White', 15, { dmg: 1.1, crit: 6 }, 'none', 'Brilliant white pigment.', 'Ti + O₂ → TiO₂')
  };
  /* second-order real reactions (compound + compound/element) */
  const T2 = {
    'H2O+O': 'H+H+O+O',                       /* H2O + O → H2O2 */
    'CO2+H2O': 'H2CO3',
    'HCl+NH3': 'NH4Cl',
    'H2O+NaCl': 'Brine',
    'H2O+SO2': 'H2SO3',
    'H2O+SO3': 'H2SO4',
    'CaO+H2O': 'CaOH2',
    'CO2+CaO': 'CaCO3',
    'CO2+NaOH': 'NaHCO3',
    'CO2+Na2O': 'Na2CO3',
    'CuO+SO3': 'CuSO4',
    'MgO+SO3': 'MgSO4',
    'CaO+SO3': 'CaSO4',
    'Al+Al+Fe2O3': 'Thermite',
    'Cr+Steel': 'Stainless',
    'HNO3+NH3': 'NH4NO3',
    'C+KNO3+S': 'BlackPowder'
  };
  Object.assign(MOLDEF, {
    'CO2+H2O': M('H2CO3', 'H₂CO₃', 'Carbonic Acid', 205, { rate: 1.1 }, 'fizz', 'Bubbles trap foes.', 'CO₂+H₂O → H₂CO₃'),
    'HCl+NH3': M('NH4Cl', 'NH₄Cl', 'Sal Ammoniac', 220, { hp: 1.1 }, 'smoke', '25% phase through damage.', 'HCl+NH₃ → NH₄Cl'),
    'H2O+NaCl': M('Brine', 'H₂O·NaCl', 'BRINE', 200, { rate: 1.05 }, 'conduct', 'Chains lightning & chills.', 'NaCl in H₂O'),
    'H2O+SO2': M('H2SO3', 'H₂SO₃', 'Sulfurous Acid', 62, { dmg: 1.15 }, 'corrosive', 'Acid rain.', 'SO₂+H₂O → H₂SO₃'),
    'H2O+SO3': M('H2SO4', 'H₂SO₄', 'SULFURIC ACID', 55, { dmg: 1.35 }, 'corrosive', 'The king of acids.', 'SO₃+H₂O → H₂SO₄'),
    'CaO+H2O': M('CaOH2', 'Ca(OH)₂', 'Slaked Lime', 40, { hp: 1.2 }, 'vital', 'Healing alkaline.', 'CaO+H₂O → Ca(OH)₂'),
    'CO2+NaOH': M('NaHCO3', 'NaHCO₃', 'Baking Soda', 180, { hp: 1.15 }, 'fizz', 'Neutralizing fizz.', 'NaOH+CO₂ → NaHCO₃'),
    'CO2+Na2O': M('Na2CO3', 'Na₂CO₃', 'Washing Soda', 175, { rate: 1.1 }, 'none', 'Cleaning alkali.', 'Na₂O+CO₂ → Na₂CO₃'),
    'CuO+SO3': M('CuSO4', 'CuSO₄', 'Copper Sulfate', 215, { dmg: 1.2 }, 'toxic', 'Blue vitriol.', 'CuO+SO₃ → CuSO₄'),
    'MgO+SO3': M('MgSO4', 'MgSO₄', 'Epsom Salt', 190, { hp: 1.2 }, 'vital', 'Soothing soak.', 'MgO+SO₃ → MgSO₄'),
    'CaO+SO3': M('CaSO4', 'CaSO₄', 'Gypsum', 185, { hp: 1.15, armor: .5 }, 'armor', 'Plaster shield.', 'CaO+SO₃ → CaSO₄'),
    'Al+Al+Fe2O3': M('Thermite', 'Fe₂O₃·Al', 'THERMITE', 18, { dmg: 1.5 }, 'blast', 'Exothermic fury: huge blasts.', 'Fe₂O₃+2Al → thermite'),
    'Cr+Steel': M('Stainless', 'Fe·Cr·C', 'STAINLESS', 212, { hp: 1.3, armor: 1 }, 'armor', 'Corrosion-proof.', 'steel+Cr → stainless'),
    'HNO3+NH3': M('NH4NO3', 'NH₄NO₃', 'Ammonium Nitrate', 32, { dmg: 1.3 }, 'blast', 'Fertilizer… and explosive.', 'NH₃+HNO₃ → NH₄NO₃'),
    'C+KNO3+S': M('BlackPowder', 'KNO₃·C·S', 'BLACK POWDER', 30, { dmg: 1.4 }, 'blast', 'Gunpowder: boom.', 'KNO₃+C+S → powder')
  });
  /* ---- TWO UNIQUE SIGNATURE CHOICES PER ELEMENT / COMPOUND ----
     These are separate from the element's main `act` ability.  The names,
     ids, and descriptions are generated from the exact isotope/compound so
     every selectable signature is unique. */
  const SIG_CHOICE_STYLES = [
    ['Rift', 'Rift Drive', 'Blink in a violent line and leave a reactive afterimage behind you.'],
    ['Prism', 'Prism Volley', 'Split a focused burst into a fan of element-tinted lances.'],
    ['Surge', 'Reaction Surge', 'Overcharge your next attacks and release a secondary shockwave on impact.'],
    ['Grav', 'Gravity Snare', 'Create a short-lived gravity knot that drags nearby targets toward its center.'],
    ['Bloom', 'Catalyst Bloom', 'Plant a reactive field that pulses outward several times.'],
    ['Aegis', 'Aegis Shell', 'Raise a temporary barrier and convert part of absorbed damage into energy.'],
    ['Drift', 'Phase Drift', 'Slide through danger while briefly ignoring collision and incoming damage.'],
    ['Nova', 'Nova Trigger', 'Prime the area around you, then detonate it after a short delay.'],
    ['Lattice', 'Lattice Cage', 'Build a geometric cage around the nearest target that restricts movement.'],
    ['Pulse', 'Resonance Pulse', 'Send a circular resonance wave that interrupts nearby enemies.'],
    ['Shard', 'Shard Cascade', 'Launch a dense cluster of shards that fans outward before returning inward.'],
    ['Vortex', 'Reaction Vortex', 'Spin up a localized vortex that bends hostile projectiles toward its center.'],
    ['Flash', 'Flash Vector', 'Dash toward your aim direction and burst with a blinding elemental flash.'],
    ['Anchor', 'Mass Anchor', 'Anchor yourself in place, gaining knockback resistance and a powerful counterburst.'],
    ['Comet', 'Comet Drop', 'Call a compact impact strike onto the location under your aim.'],
    ['Echo', 'Reactive Echo', 'Repeat a reduced copy of your most recent attack from a delayed position.'],
    ['Torrent', 'Molecular Torrent', 'Send a rolling stream forward that pushes enemies and leaves a temporary hazard.'],
    ['Crown', 'Atomic Crown', 'Surround yourself with rotating charges that strike the nearest hostile.'],
    ['Spike', 'Elemental Spike', 'Raise a sudden piercing spike at the targeted location.'],
    ['Mirror', 'Reaction Mirror', 'Create a reflective pane that returns the next hostile projectile it catches.'],
    ['Bloomfire', 'Catalytic Wildfire', 'Ignite a spreading reaction around the target, rewarding clustered enemies.'],
    ['Coil', 'Charged Coil', 'Store a charge while active and release it as a focused electric-style discharge.'],
    ['Tether', 'Molecular Tether', 'Connect to the nearest target, slowing it and pulling you toward each other.'],
    ['Ruin', 'Ruin Mark', 'Mark the nearest target; your next hit consumes the mark for bonus damage.'],
    ['Halo', 'Reactive Halo', 'Emit a defensive ring that damages nearby enemies and restores a small shield.'],
    ['Drill', 'Phase Drill', 'Fire a narrow drill-like wave that ignores part of enemy defenses.'],
    ['Mist', 'Reactive Mist', 'Release a dense mist that obscures the arena and weakens enemies inside it.'],
    ['Crescent', 'Atomic Crescent', 'Sweep a wide crescent through the area in front of you.'],
    ['Beacon', 'Catalyst Beacon', 'Place a beacon that buffs nearby allies and periodically pulses at enemies.'],
    ['Crash', 'Reaction Crash', 'Teleport a short distance and detonate at both the origin and destination.'],
    ['Spiral', 'Molecular Spiral', 'Launch a spiraling projectile whose orbit expands before collapsing.'],
    ['Cleave', 'Elemental Cleave', 'Deliver a heavy close-range arc that knocks targets away.']
  ];
  function choiceHash(s) { return [...String(s)].reduce((v, c) => (v * 33 + c.charCodeAt(0)) >>> 0, 2166136261) >>> 0; }
  function makeSignatureChoices(el) {
    const seed = choiceHash(el.id || el.f || el.name);
    const label = el.mol ? (el.f || el.name) : el.name;
    const sym = el.mol ? (el.token || el.f) : el.sym;
    const out = [];
    for (let slot = 0; slot < 2; slot++) {
      const a = SIG_CHOICE_STYLES[(seed + slot * 17) % SIG_CHOICE_STYLES.length];
      const id = 'sig_' + String(el.id || el.f || el.name).replace(/[^a-z0-9]+/gi, '_') + '_' + slot;
      out.push({
        id, key: a[0].toLowerCase(), slot, ic: a[0][0],
        name: sym + ' ' + a[1] + ' ' + (slot === 0 ? 'I' : 'II'),
        desc: label + ' focuses this signature on ' + a[2].replace(/\.$/, '') + '.',
        unique: true,
        power: 1 + ((seed + slot) % 5) * .08
      });
    }
    return out;
  }

  Object.values(MOLDEF).forEach(m => { m.signatures = makeSignatureChoices(m); });

  /* ---- CUSTOM FUSION ABILITIES — every combinable compound gets its own unique active ---- */
  const MOL_CUSTOM_ABILITIES = {
    /* ── Simple oxides & water family ─────────────────────────────────────── */
    'H2O': {
      name: 'Hydro Surge',
      ic: '💧',
      desc: 'Releases a pressurized burst of water in all directions. Enemies hit are drenched and slowed 40% for 3 s; drenched foes take 30% extra damage from your next hit.'
    },
    'OH': {
      name: 'Radical Oxidation',
      ic: '⚗',
      desc: 'Launch a volatile hydroxyl bolt that strips enemy armor on contact. Armor-stripped foes take 50% increased damage from all sources for 4 s, but the bolt deals 15% less direct damage than normal.'
    },
    'O3': {
      name: 'Ozone Arc',
      ic: '⚡',
      desc: 'Generate a crackling ozone shell that zaps every nearby enemy once per second for 4 s. Each zap chains to an additional target within range, dealing 60% of the original hit.'
    },
    'CO': {
      name: 'Hemoglobin Bind',
      ic: '🫁',
      desc: 'Flood the arena with invisible carbon monoxide. Enemies inside slowly lose up to 25% of their max HP over 5 s and have their movement speed reduced by 20%. The cloud persists until you leave the zone or the timer expires.'
    },
    'CO2': {
      name: 'Dry-Ice Cannon',
      ic: '❄',
      desc: 'Fire a pressurized CO₂ canister that flash-freezes on impact, encasing enemies in solid frost for 2.5 s. Frozen enemies shatter for bonus damage when hit by any attack during the freeze.'
    },
    'CN': {
      name: 'Cyanide Cascade',
      ic: '☠',
      desc: 'Inject a lethal cyanide marker into the nearest enemy. If the enemy dies within 6 s, the marker detonates in a toxic cloud that spreads to all enemies within 180 px and applies a deep poison stack.'
    },
    /* ── Hydrogen halides & halogens ───────────────────────────────────────── */
    'NaCl': {
      name: 'Salt Barrage',
      ic: '🧂',
      desc: 'Crystallize a wall of salt shards that fires a sweeping 120° spread of piercing ionic rounds. Each shard reduces enemy movement speed by 15% on hit, stacking up to 3 times for a total of 45% slow.'
    },
    'HCl': {
      name: 'Acid Etch',
      ic: '🧪',
      desc: 'Spray a jet of hydrochloric acid that permanently strips one layer of armor from every enemy it touches. Stripped enemies leak a corrosive trail that damages any foe passing through it.'
    },
    'NH3': {
      name: 'Ammonia Purge',
      ic: '💨',
      desc: 'Release an ammonia pressure wave that pushes all enemies away from you and neutralizes any active poison/acid ground effects. Allies (or yourself in co-op) gain 2 HP regeneration per second for 5 s after the purge.'
    },
    /* ── Iron & mineral oxides ─────────────────────────────────────────────── */
    'FeO': {
      name: 'Iron Bastion',
      ic: '🛡',
      desc: 'Forge a temporary iron-oxide barrier directly in front of you that absorbs up to 80 damage. While the barrier stands, your fire rate increases by 20%. When the barrier breaks it explodes in a shower of shrapnel.'
    },
    'SO2': {
      name: 'Sulfur Smog',
      ic: '🌫',
      desc: 'Blanket a wide area in sulfur dioxide smog that reduces enemy sight range and accuracy. Enemies inside the smog deal 25% less damage. The cloud lingers for 6 s and ignites into a brief fire burst if hit by any explosion.'
    },
    'NO': {
      name: 'Nitric Boost',
      ic: '💨',
      desc: 'Inhale nitric oxide for a 3-second burst of superhuman reaction speed: your movement speed triples and your fire rate doubles. After the boost ends you are briefly winded, reducing fire rate by 30% for 1 s.'
    },
    'N2O': {
      name: 'Laughing Gas Cloud',
      ic: '😵',
      desc: 'Deploy a euphoric nitrous oxide cloud that causes nearby enemies to stagger and jerk erratically for 4 s, drastically reducing their accuracy and making them wander. You also gain a 15% crit bonus while inside your own cloud.'
    },
    'H2S': {
      name: 'Rotten Miasma',
      ic: '🤢',
      desc: 'Detonate a noxious hydrogen sulfide bomb that poisons every enemy in a large radius. Poisoned foes leave a damaging trail behind them as they walk. The effect also briefly stuns enemies with the lowest current HP.'
    },
    'C2H2': {
      name: 'Oxy-Acetylene Torch',
      ic: '🔥',
      desc: 'Ignite a sustained acetylene flame in a narrow cone in front of you. The flame deals rapid tick damage and can cut through enemy shield layers. Holding the ability continuously increases the flame\'s damage by 15% every second up to 3 stacks.'
    },
    /* ── Alloys ────────────────────────────────────────────────────────────── */
    'Steel': {
      name: 'Forged Onslaught',
      ic: '⚔',
      desc: 'Encase yourself in carbon-steel armor and charge forward, dealing heavy contact damage to all enemies in your path. The charge leaves a trail of steel shards that deal lingering damage to enemies crossing them.'
    },
    'Bronze': {
      name: 'Bronze Volley',
      ic: '🏹',
      desc: 'Fire a relentless 20-round bronze salvo in rapid succession at the nearest enemy cluster. Each round ricochets off one surface or enemy for a second hit dealing 50% of the original damage.'
    },
    'Brass': {
      name: 'Casing Burst',
      ic: '💥',
      desc: 'Eject a dense cluster of brass casings that expand outward in a 360° burst. Each casing pierces one extra enemy. Casings that miss embed in walls and can be triggered as shrapnel mines by moving near them.'
    },
    /* ── Silicates & ceramics ──────────────────────────────────────────────── */
    'SiO2': {
      name: 'Quartz Prism',
      ic: '💎',
      desc: 'Conjure a rotating quartz prism above you that refracts your next 5 projectiles, splitting each into 3 beams at different angles. The prism itself can absorb one incoming projectile per rotation cycle.'
    },
    'MgO': {
      name: 'Flash Grenade',
      ic: '💡',
      desc: 'Hurl a magnesia flare that detonates in a blinding white burst, stunning all enemies in the blast radius for 2 s. Enemies recovering from the stun take 35% increased damage for 2 s afterward.'
    },
    'KCl': {
      name: 'Violet Flame Strike',
      ic: '🔮',
      desc: 'Detonate potassium chloride into a brilliant violet flame column. Enemies hit by the column are set ablaze with a distinctive purple fire that deals extra damage to shielded enemies and strips half their armor.'
    },
    'NaOH': {
      name: 'Caustic Spray',
      ic: '⚗',
      desc: 'Spray caustic soda in a cone, severely melting through enemy defenses. Each enemy hit suffers the "Marked" debuff: for 5 s every attack against that enemy deals +40% bonus damage. Multiple hits on the same enemy refresh the duration.'
    },
    'CaO': {
      name: 'Quicklime Ignition',
      ic: '🌋',
      desc: 'Scatter quicklime powder across a wide area. The powder reacts violently with any liquid on the ground (water pools, acid pools) and with enemy blood on contact, erupting in a ring of searing flame.'
    },
    'H2O2': {
      name: 'Peroxide Detonator',
      ic: '💥',
      desc: 'Inject a hydrogen peroxide charge into a nearby enemy or surface. After 1.5 s the charge decomposes explosively, dealing massive AoE damage. Enemies hit by the explosion are flung backward and leave a flammable oxygen slick behind.'
    },
    /* ── Precious metal alloys ─────────────────────────────────────────────── */
    'Electrum': {
      name: 'Fortune\'s Arc',
      ic: '✨',
      desc: 'Channel electrum resonance to shoot a dazzling golden arc that homes in on the richest-HP enemy in range. Enemies killed by the arc drop double coins. The arc bounces up to 4 times between targets.'
    },
    'CH4': {
      name: 'Methane Ignition',
      ic: '🔥',
      desc: 'Vent a cloud of methane around you and ignite it. The flash explosion deals 120 base damage to all nearby enemies and knocks them back hard. For 3 s afterward any further explosion in the arena deals 25% bonus damage.'
    },
    'HCN': {
      name: 'Prussic Plague',
      ic: '☠',
      desc: 'Coat your next 3 projectiles in hydrogen cyanide. Each poisoned hit reduces the target\'s max HP by 5% permanently for the encounter and applies a deadly poison stack. If the target dies under this effect, the poison spreads to nearby enemies.'
    },
    'CH2O': {
      name: 'Formalin Preserve',
      ic: '🫙',
      desc: 'Spray formaldehyde mist that partially "preserves" enemies, locking their HP in place for 3 s — they cannot die but they also cannot heal. At the end of the effect, all preserved damage is applied simultaneously.'
    },
    'NO2': {
      name: 'Brown Haze Barrage',
      ic: '🟤',
      desc: 'Launch 5 nitrogen dioxide canisters in a fan pattern. Each canister releases a brown toxic cloud on impact. Enemies inside multiple overlapping clouds take exponentially increased damage per stack of cloud they stand in.'
    },
    'SO3': {
      name: 'Acid Anhydride Rain',
      ic: '🌧',
      desc: 'Call down a rain of sulfur trioxide that combines with ambient moisture to form instant sulfuric acid on contact with enemies. Enemies dissolve from the outside in: armor is stripped first, then HP is attacked at double rate.'
    },
    'CuO': {
      name: 'Copper Conflagration',
      ic: '🟤',
      desc: 'Ignite copper oxide and fire a blazing copper-green bolt. The bolt deals fire damage in a 4-hit burst on impact and leaves a smoldering crater that deals burn damage to any enemy passing through it for 4 s.'
    },
    'ZnO': {
      name: 'Zinc Aegis',
      ic: '🛡',
      desc: 'Coat yourself in protective zinc oxide. Absorb the next 4 hits with no damage, and each absorbed hit charges a counter-bolt. Release the stored energy by firing: the bolt deals 40 damage × number of stored hits.'
    },
    'Ag2S': {
      name: 'Tarnish Cloud',
      ic: '🌑',
      desc: 'Shatter silver sulfide crystals into a toxic black cloud. Enemies in the cloud are poisoned AND have their bullet count reduced (ranged enemies fire fewer projectiles). The cloud also partially blinds enemies, reducing their detection range by 50%.'
    },
    'PbO': {
      name: 'Lead Curtain',
      ic: '🪨',
      desc: 'Raise a wall of lead oxide plates directly in your path that blocks enemy projectiles for 4 s. Any projectile stopped by the curtain is absorbed and reloaded into your weapon as bonus ammunition at 60% of the original damage.'
    },
    'Na2O': {
      name: 'Sodium Eruption',
      ic: '💥',
      desc: 'Hurl sodium oxide at a water pool or any wet enemy to trigger a violent alkaline eruption. Even without water, the impact creates a caustic splash that marks all nearby enemies, increasing their damage taken by 25% for 4 s.'
    },
    'K2O': {
      name: 'Caustic Potash Bomb',
      ic: '🟡',
      desc: 'Throw a potassium oxide charge that dissolves into a rapidly expanding caustic pool on impact. Enemies crossing the pool take acid damage per tile traversed. The pool also reacts with any existing fire effects to produce an eruption of superheated steam.'
    },
    'CaCl2': {
      name: 'De-Ice Shock',
      ic: '❄',
      desc: 'Scatter calcium chloride ice-melt crystals that super-chill any water or ice in the arena and slow all enemies by 30% for 5 s. Enemies already frozen by any source shatter instantly for triple damage when hit during this effect.'
    },
    'MgCl2': {
      name: 'Bittern Brine Burst',
      ic: '🌊',
      desc: 'Release a wave of magnesium chloride brine that conducts electricity between any two targets it touches. Chain lightning immediately arcs between all drenched enemies, dealing 40 damage per chain with no falloff for the first 3 hops.'
    },
    'NaF': {
      name: 'Enamel Lance',
      ic: '🦷',
      desc: 'Compress sodium fluoride into an impossibly hard lance and fire it through the entire enemy formation. The lance does not slow down on piercing — it maintains full damage through 6 enemies and then detonates at maximum range in a fluoride shrapnel burst.'
    },
    'KF': {
      name: 'Fluoride Corrosion',
      ic: '☠',
      desc: 'Saturate a target area with potassium fluoride. Enemies in the area immediately lose all armor and take 15% of their maximum HP as direct damage. The corrosion lingers for 3 s, continuing to strip any armor regenerated during that window.'
    },
    'LiF': {
      name: 'Crystal Optics Beam',
      ic: '🔮',
      desc: 'Focus ambient energy through a lithium fluoride crystal to fire a pencil-thin, ultra-high-speed laser that passes through all enemies without damage falloff. The beam charges for 0.5 s then fires instantaneously across the full arena width.'
    },
    'AgCl': {
      name: 'Photographic Flash',
      ic: '📸',
      desc: 'Expose silver chloride to intense light and trigger a blinding photographic flash. All enemies within a huge radius are blinded for 3 s and have a "Developed" mark applied. Your next attack against any marked enemy is guaranteed to critically hit.'
    },
    'AgNO3': {
      name: 'Lunar Caustic Brand',
      ic: '🌙',
      desc: 'Brand a single enemy with silver nitrate. The brand triggers a violent chemical burn on that enemy over 5 s, dealing 8% of their max HP per second. If the branded enemy contacts another enemy, the brand instantly spreads.'
    },
    'KNO3': {
      name: 'Saltpeter Ignition',
      ic: '🔥',
      desc: 'Prime the ground with saltpeter. The next explosion, bullet impact, or fire effect in the primed zone detonates the saltpeter, tripling the explosion\'s damage and radius. You can prime up to 3 zones simultaneously.'
    },
    /* ── Semiconductors & photovoltaics ────────────────────────────────────── */
    'GaAs': {
      name: 'Semiconductor Surge',
      ic: '⚡',
      desc: 'Discharge a gallium arsenide pulse that overloads enemy electronics and shields. Shielded enemies instantly lose their shields and take 50 bonus damage. All enemies in range have their fire rate halved for 3 s as internal systems are disrupted.'
    },
    'InP': {
      name: 'Photonic Lattice',
      ic: '💠',
      desc: 'Construct an indium phosphide photonic cage around the targeted position. Any enemy entering the cage is bombarded by rapid laser pulses. The cage also enhances your own projectile speed by 30% while you stand adjacent to it.'
    },
    'CdTe': {
      name: 'Solar Flare Shot',
      ic: '☀',
      desc: 'Convert stored cadmium telluride photovoltaic energy into a brilliant solar bolt. The bolt grows stronger the longer it has been since your last shot — a fully charged 5-second wait deals 4× the base damage in a wide burst.'
    },
    /* ── Corundum, hematite, carborundum ──────────────────────────────────── */
    'Al2O3': {
      name: 'Sapphire Ward',
      ic: '💎',
      desc: 'Raise a corundum barrier around yourself that provides 9 AL-9 damage reduction. Every projectile that fails to penetrate the ward reflects back at its shooter at full velocity. The ward shatters after absorbing 120 total damage.'
    },
    'Fe2O3': {
      name: 'Hematite Shrapnel',
      ic: '🔴',
      desc: 'Load a shell of crystallized iron oxide and fire it as a massive fragmentation round. On impact it explodes into 18 hematite shards that fan outward, each dealing moderate damage. Shards embed in the ground and can be stepped on as ground hazards.'
    },
    'SiC': {
      name: 'Carborundum Grind',
      ic: '🔘',
      desc: 'Coat your projectiles in silicon carbide grit for 5 s. Every projectile now grinds through enemy armor, reducing it by 15 per hit on top of normal damage. Fully-armored enemies (like tanks) take 60% bonus damage from this effect.'
    },
    /* ── Shape-memory & coinage alloys ────────────────────────────────────── */
    'NiTi': {
      name: 'Shape Memory Snap',
      ic: '🔁',
      desc: 'Fire a nitinol wire projectile that wraps around the nearest enemy and then snaps back to its memorized shape, pulling the enemy toward you. At the end of the pull, the wire ruptures and deals burst damage based on how far the enemy was dragged.'
    },
    'CuNi': {
      name: 'Coin Shrapnel',
      ic: '🪙',
      desc: 'Detonate a bundle of cupronickel coins in all directions. Each coin deals moderate damage and has a 20% chance to land face-up, granting you a coin pickup. Coins that hit enemies bounce once to strike an additional target.'
    },
    'Sterling': {
      name: 'Silver Storm',
      ic: '⚡',
      desc: 'Fire a rapid 10-round burst of 925-sterling silver bullets at maximum speed. Each bullet has a 25% increased critical chance. Every 5th bullet in the burst is a guaranteed critical strike that deals 200% damage.'
    },
    'RoseGold': {
      name: 'Gilded Pierce',
      ic: '🌹',
      desc: 'Fire a single rose-gold round that is guaranteed to critically hit and pierce through every enemy it contacts. Each pierced enemy takes 12% more damage than the previous one hit by the same bullet (compounding per target).'
    },
    'WhiteGold': {
      name: 'Pale Gold Volley',
      ic: '⭐',
      desc: 'Unleash a precise 5-shot white-gold burst where each round homes in on a different enemy. Rounds that hit the same target as a previous shot deal 30% bonus damage. If all 5 hit the same target, the final round detonates for 3× its base damage.'
    },
    'Solder': {
      name: 'Fuse and Flow',
      ic: '🔗',
      desc: 'Splatter molten solder across a group of enemies. The solder cools rapidly, binding adjacent enemies together — if one bonded enemy takes damage, 40% of it propagates to all others in the bond group. The bond lasts 4 s.'
    },
    'Pewter': {
      name: 'Soft Metal Barrage',
      ic: '🪨',
      desc: 'Load up a bulk-fire pewter cannon and discharge 30 slow heavy rounds over 3 s. Each round deals low-but-reliable damage and has massive knockback. Enemies pinned against a wall or other enemies take an additional 50% collision damage.'
    },
    /* ── Calcium compounds ─────────────────────────────────────────────────── */
    'CaCO3': {
      name: 'Limestone Rampart',
      ic: '🏰',
      desc: 'Raise a limestone wall at your aimed location that absorbs enemy fire for 5 s. The wall slowly crumbles into CaO dust that reacts with any water in the arena. When the wall falls it collapses into the enemy with lethal kinetic force.'
    },
    'HNO3': {
      name: 'Aqua Fortis Dissolve',
      ic: '🧪',
      desc: 'Spray nitric acid that instantly dissolves enemy armor and applies a stacking "Corroded" debuff. At 3 stacks of Corroded, an enemy\'s defenses collapse entirely — they become immune to knockback resistance and their HP cap is reduced by 20% for the fight.'
    },
    'TiO2': {
      name: 'Titanium White Blaze',
      ic: '⬜',
      desc: 'Fire a brilliant white titanium dioxide energy bolt that blinds enemies on impact and leaves a reflective white field on the ground. Your projectiles passing through the white field gain +6% crit chance and +10% speed for each tile traveled through it.'
    },
    /* ── T2 reactions (compound + compound/element) ─────────────────────────── */
    'H2CO3': {
      name: 'Carbonation Implosion',
      ic: '🫧',
      desc: 'Implode a pocket of carbonic acid gas, creating a violent inward shockwave that pulls all nearby enemies toward the center point and deals heavy damage. Enemies at the center take double damage from the concentrated pressure.'
    },
    'NH4Cl': {
      name: 'Sal Ammoniac Veil',
      ic: '🌫',
      desc: 'Detonate a sal ammoniac smoke grenade that creates a thick chemical fog. Enemies in the fog phase partially out of reality, reducing their effective HP by 25%. Your own projectiles pass through the fog unimpeded and deal a bonus 15% damage to fogged enemies.'
    },
    'Brine': {
      name: 'Electrolyte Surge',
      ic: '🌊',
      desc: 'Flood an area with electrically-conductive brine. Any lightning or electrical attack in that area automatically chain-hits every enemy standing in the brine. The brine also chills enemies, reducing their movement speed by 25% for the duration.'
    },
    'H2SO3': {
      name: 'Acid Rain Strike',
      ic: '🌧',
      desc: 'Call down a localized acid rain storm that deals 12 damage per second to all enemies in a wide zone. Enemies standing in the rain have their armor shredded at 5% per second. The rain lasts 5 s and leaves a corrosive puddle for 3 s after it ends.'
    },
    'H2SO4': {
      name: 'King of Acids',
      ic: '👑',
      desc: 'Unleash the most corrosive acid in chemistry in a torrent that melts through all armor instantly and deals heavy ongoing damage. Enemies reduced to 0 armor are "dissolved," taking 100% of remaining damage directly to HP without any mitigation. Lasts 4 s.'
    },
    'CaOH2': {
      name: 'Slaked Lime Restoration',
      ic: '💚',
      desc: 'Spray slaked lime solution over yourself and nearby allies. Instantly heals 40 HP and neutralizes all active poison, acid, and burn debuffs. Over the next 5 s, regenerate an additional 25 HP. Also creates a brief alkaline zone that neutralizes enemy acid attacks.'
    },
    'NaHCO3': {
      name: 'Fizzing Neutralizer',
      ic: '🫧',
      desc: 'Throw a baking soda canister that erupts in a fizzing neutralization reaction. All acid/corrosive effects in the blast zone are immediately cancelled. Enemies in the blast are knocked back by CO₂ pressure and stunned for 1.5 s.'
    },
    'Na2CO3': {
      name: 'Washing Soda Cleanse',
      ic: '🧼',
      desc: 'Release a washing soda alkaline wave that scrubs negative status effects from you (and allies in co-op) while simultaneously applying "Stripped" to all enemies in range — removing their elemental resistances for 5 s. Your next 3 projectiles deal +20% damage.'
    },
    'CuSO4': {
      name: 'Blue Vitriol Spike',
      ic: '🔵',
      desc: 'Crystallize copper sulfate into sharp blue crystals and fire them in a wide spray. Enemies hit are poisoned AND slowed. Any water present in the arena causes the crystals to dissolve rapidly, spreading the poison effect to a 200 px radius around each impact.'
    },
    'MgSO4': {
      name: 'Epsom Soothe',
      ic: '✨',
      desc: 'Absorb a dose of magnesium sulfate to trigger muscle relaxation: your movement speed increases by 20% and all incoming knockback is halved for 5 s. Each enemy you damage during this window also has their fire rate reduced by 15%.'
    },
    'CaSO4': {
      name: 'Gypsum Set',
      ic: '⬜',
      desc: 'Plaster a layer of gypsum over yourself that rapidly hardens into full-coverage armor. For 4 s you absorb the next 100 damage for free and become immune to knockback. When the plaster shatters it fires calcium shards in all directions.'
    },
    'Thermite': {
      name: 'Thermite Inferno',
      ic: '🌋',
      desc: 'Mix aluminum and iron oxide into a thermite charge and ignite it. The reaction creates a 2,500°C molten iron stream that cuts through every enemy in a straight line, melts through shields, and leaves a 3-second pool of liquid iron that deals 80 damage/sec.'
    },
    'Stainless': {
      name: 'Stainless Juggernaut',
      ic: '⚙',
      desc: 'Encase yourself in chromium-steel stainless armor for 6 s. During this time you are immune to all corrosive/acid/rust effects, take 40% reduced damage, and your contact damage triples. Enemies you collide with are pushed aside and staggered.'
    },
    'NH4NO3': {
      name: 'Fertilizer Detonation',
      ic: '💥',
      desc: 'Plant an ammonium nitrate charge that looks deceptively like a mundane object. After 2 s, it detonates in a massive explosion dealing 200 damage in a 300 px radius. The explosion generates a thick cloud of nitrogen oxide that persists for 5 s and deals 20 damage/sec.'
    },
    'BlackPowder': {
      name: 'Gunpowder Fusillade',
      ic: '💣',
      desc: 'Load a black-powder cannon and unleash a thunderous volley of 8 explosive shells in a spread pattern. Each shell detonates on impact in a 120 px radius. The combined smoke from all detonations fills the arena, reducing enemy visibility for 4 s.'
    }
  };

  /* Apply custom abilities to every molecule that has one keyed by token */
  Object.values(MOLDEF).forEach(m => {
    const custom = MOL_CUSTOM_ABILITIES[m.token];
    if (custom) {
      m.act.name = custom.name;
      m.act.desc = custom.desc;
      if (custom.ic) m.act.ic = custom.ic;
    }
  });

  const RECIPES = {}; Object.keys(MOLDEF).forEach(k => { if (!T2[k]) RECIPES[k] = k });
  Object.keys(T2).forEach(k => RECIPES[k] = T2[k]);

  /* ---- Mastery tree node templates (12 per element, flavored) ---- */
  const MNODES = [
    { key: 'power', t: 'Core Power', d: 'damage', per: 12, max: 3, ic: '⚡' },
    { key: 'rate', t: 'Rapid Decay', d: 'fire rate', per: 9, max: 3, ic: '♻' },
    { key: 'emission', t: 'Particle Emission', d: '+1 projectile', per: 1, max: 2, ic: '⋔' },
    { key: 'pen', t: 'Deep Penetration', d: '+1 pierce', per: 1, max: 2, ic: '➤' },
    { key: 'crit', t: 'Critical Mass', d: 'crit chance', per: 6, max: 3, ic: '✧' },
    { key: 'over', t: 'Overload', d: 'crit damage', per: 35, max: 3, ic: '✹' },
    { key: 'guide', t: 'Guided Isotopes', d: 'homing', per: .05, max: 2, ic: '⌖' },
    { key: 'arc', t: 'Arc Discharge', d: 'chain lightning', per: 1, max: 2, ic: '≋' },
    { key: 'toxin', t: 'Contamination', d: 'poison on hit', per: 1, max: 2, ic: '☠' },
    { key: 'exotherm', t: 'Exothermic Reaction', d: 'burn on hit', per: 1, max: 2, ic: '♨' },
    { key: 'zero', t: 'Absolute Zero', d: 'slow on hit', per: 1, max: 2, ic: '❄' },
    { key: 'detonate', t: 'Volatile Detonation', d: 'AoE on hit', per: 1, max: 2, ic: '💥' }];
  const mxCost = (idx, rank) => Math.round((80 + idx * 20) * Math.pow(2.1, rank));

  /* ---- Enemies ---- */
  const ETYPES = {
    mote: { hp: 14, spd: 125, r: 11, dmg: 10, coin: 1, xp: 1, hue: 350, shape: 'dot', desc: 'Basic chaser.' },
    wisp: { hp: 10, spd: 195, r: 9, dmg: 8, coin: 1, xp: 1, hue: 30, shape: 'diamond', desc: 'Erratic fast flanker.' },
    brute: { hp: 62, spd: 58, r: 20, dmg: 18, coin: 3, xp: 3, hue: 0, shape: 'square', desc: 'Slow tank.' },
    spitter: { hp: 24, spd: 82, r: 12, dmg: 12, coin: 2, xp: 2, hue: 280, shape: 'tri', desc: 'Ranged spitter.' },
    splitter: { hp: 34, spd: 95, r: 15, dmg: 12, coin: 2, xp: 2, hue: 130, shape: 'dot', desc: 'Splits on death.' },
    bomber: { hp: 20, spd: 150, r: 13, dmg: 20, coin: 2, xp: 2, hue: 20, shape: 'bomb', desc: 'Detonates on death.' },
    healer: { hp: 30, spd: 70, r: 13, dmg: 8, coin: 3, xp: 3, hue: 140, shape: 'cross', desc: 'Heals nearby foes.' },
    tank: { hp: 120, spd: 40, r: 24, dmg: 22, coin: 5, xp: 5, hue: 260, shape: 'square', desc: 'Armored: 50% DR.' },
    swarm: { hp: 5, spd: 230, r: 6, dmg: 5, coin: 1, xp: 1, hue: 45, shape: 'dot', desc: 'Tiny fast swarm.' },
    orbiter: { hp: 26, spd: 110, r: 12, dmg: 12, coin: 2, xp: 2, hue: 300, shape: 'ring', desc: 'Circles you, fires inward.' },
    sniper: { hp: 22, spd: 60, r: 12, dmg: 24, coin: 3, xp: 3, hue: 200, shape: 'tri', desc: 'Charged high-damage bolt.' },
    shielder: { hp: 40, spd: 85, r: 14, dmg: 14, coin: 3, xp: 3, hue: 180, shape: 'shield', desc: 'Front shield: hit from behind.' },
    ghost: { hp: 18, spd: 140, r: 11, dmg: 10, coin: 2, xp: 2, hue: 255, shape: 'diamond', desc: 'Phases in and out — briefly immune.' },
    charger: { hp: 46, spd: 68, r: 16, dmg: 18, coin: 3, xp: 3, hue: 10, shape: 'tri', desc: 'Winds up, then charges at you.' },
    vampire: { hp: 34, spd: 100, r: 13, dmg: 12, coin: 2, xp: 3, hue: 340, shape: 'cross', desc: 'Heals itself when it hits you.' },
    mirror: { hp: 28, spd: 90, r: 13, dmg: 10, coin: 2, xp: 2, hue: 190, shape: 'ring', desc: 'Occasionally reflects your shots.' },
    juggler: { hp: 30, spd: 78, r: 14, dmg: 10, coin: 2, xp: 2, hue: 70, shape: 'tri', desc: 'Flings a 3-shot spread.' },
    crusher: { hp: 160, spd: 34, r: 27, dmg: 26, coin: 6, xp: 6, hue: 15, shape: 'square', desc: 'Massive: shoves you on contact.' },
    seeder: { hp: 26, spd: 74, r: 13, dmg: 8, coin: 2, xp: 2, hue: 100, shape: 'diamond', desc: 'Periodically spawns swarmlings.' },
    phantomblade: { hp: 16, spd: 235, r: 9, dmg: 20, coin: 2, xp: 2, hue: 0, shape: 'tri', desc: 'Glass-cannon speed striker.' },
    anchor: { hp: 72, spd: 46, r: 18, dmg: 12, coin: 3, xp: 3, hue: 230, shape: 'square', desc: 'Radiates a slowing field.' },
    stalker: { hp: 20, spd: 165, r: 10, dmg: 14, coin: 2, xp: 2, hue: 280, shape: 'dot', desc: 'Nearly invisible until close.' },
    spark: { hp: 8, spd: 285, r: 5, dmg: 6, coin: 1, xp: 1, hue: 52, shape: 'dot', desc: 'Tiny electric skirmisher.' },
    basalt: { hp: 220, spd: 26, r: 29, dmg: 30, coin: 7, xp: 7, hue: 18, shape: 'square', desc: 'Volcanic walking fortress.' },
    glider: { hp: 18, spd: 185, r: 10, dmg: 11, coin: 2, xp: 2, hue: 195, shape: 'diamond', desc: 'Drifts in wide sine arcs.' },
    pylon: { hp: 58, spd: 52, r: 17, dmg: 15, coin: 4, xp: 4, hue: 275, shape: 'cross', desc: 'Stationary-looking reactor pylon.' },
    shardling: { hp: 12, spd: 170, r: 8, dmg: 9, coin: 1, xp: 1, hue: 168, shape: 'diamond', desc: 'Crystal fragment hunter.' },
    boulder: { hp: 95, spd: 72, r: 21, dmg: 20, coin: 5, xp: 5, hue: 40, shape: 'dot', desc: 'Dense rolling mineral mass.' },
    flareling: { hp: 16, spd: 205, r: 9, dmg: 15, coin: 2, xp: 2, hue: 10, shape: 'bomb', desc: 'Incandescent suicide runner.' },
    drifter: { hp: 38, spd: 105, r: 14, dmg: 13, coin: 3, xp: 3, hue: 220, shape: 'ring', desc: 'Buoyant inert-gas floater.' },
    coil: { hp: 44, spd: 92, r: 15, dmg: 16, coin: 3, xp: 3, hue: 115, shape: 'ring', desc: 'Tight spiraling constrictor.' },
    prism: { hp: 36, spd: 125, r: 14, dmg: 14, coin: 3, xp: 3, hue: 305, shape: 'diamond', desc: 'Refractive diamond duelist.' },
    crawler: { hp: 52, spd: 88, r: 16, dmg: 17, coin: 3, xp: 3, hue: 88, shape: 'cross', desc: 'Low-profile chemical crawler.' },
    drone: { hp: 28, spd: 148, r: 12, dmg: 13, coin: 3, xp: 3, hue: 205, shape: 'tri', desc: 'Synthetic hunter drone.' },
    sentinel: { hp: 80, spd: 62, r: 19, dmg: 19, coin: 5, xp: 5, hue: 235, shape: 'shield', desc: 'Slow lattice sentry.' },
    ripple: { hp: 22, spd: 152, r: 11, dmg: 12, coin: 2, xp: 2, hue: 190, shape: 'ring', desc: 'Liquid-wave pursuer.' },
    cinder: { hp: 25, spd: 175, r: 11, dmg: 16, coin: 2, xp: 2, hue: 28, shape: 'dot', desc: 'Burning ash cloud.' },
    mole: { hp: 68, spd: 64, r: 18, dmg: 21, coin: 4, xp: 4, hue: 50, shape: 'tri', desc: 'Tunneling geometric miner.' },
    quanta: { hp: 14, spd: 250, r: 7, dmg: 10, coin: 2, xp: 2, hue: 330, shape: 'dot', desc: 'Unstable probability mote.' },
    reactor: { hp: 110, spd: 42, r: 24, dmg: 24, coin: 6, xp: 6, hue: 340, shape: 'hex', desc: 'Overheated core guardian.' },
    // The only five special enemy archetypes: each has a bespoke combat power.
    phaseweaver: { hp: 48, spd: 110, r: 15, dmg: 17, coin: 5, xp: 5, hue: 265, shape: 'diamond', special: 'blink', desc: 'SPECIAL: periodically warps behind a player.' },
    voltconductor: { hp: 54, spd: 76, r: 16, dmg: 16, coin: 5, xp: 5, hue: 55, shape: 'cross', special: 'arc', desc: 'SPECIAL: fires a branching lightning fan.' },
    biomass: { hp: 88, spd: 58, r: 21, dmg: 15, coin: 6, xp: 6, hue: 120, shape: 'dot', special: 'split', desc: 'SPECIAL: divides into swarm cells at low health.' },
    gravitywell: { hp: 130, spd: 35, r: 25, dmg: 20, coin: 7, xp: 7, hue: 280, shape: 'ring', special: 'pull', desc: 'SPECIAL: pulls nearby operators inward.' },
    mimicore: { hp: 66, spd: 96, r: 18, dmg: 19, coin: 6, xp: 6, hue: 180, shape: 'hex', special: 'mirror', desc: 'SPECIAL: copies and returns projectile patterns.' },
    glasslancer: {hp:42,spd:135,r:15,dmg:18,coin:4,xp:4,hue:210,shape:'diamond',desc:'Dashes in straight lanes and leaves brittle shards.',special:'lance'},
    emberdrone: {hp:34,spd:158,r:13,dmg:16,coin:3,xp:3,hue:18,shape:'tri',desc:'Launches delayed ember mines.',special:'embers'},
    frostbinder: {hp:72,spd:72,r:19,dmg:17,coin:5,xp:5,hue:195,shape:'ring',desc:'Projects a freezing field around itself.',special:'freeze'},
    echohound: {hp:58,spd:188,r:17,dmg:21,coin:5,xp:5,hue:320,shape:'cross',desc:'Repeats its approach with a damaging echo volley.',special:'echo'},
    ionserpent: {hp:76,spd:115,r:20,dmg:22,coin:5,xp:6,hue:80,shape:'tri',desc:'Sweeps a curving ionic wake.',special:'serpent'},
    voidsentry: {hp:120,spd:28,r:26,dmg:25,coin:7,xp:7,hue:260,shape:'ring',desc:'Creates periodic anti-projectile void zones.',special:'void'},
    stormbeacon: {hp:90,spd:48,r:22,dmg:23,coin:7,xp:7,hue:175,shape:'cross',desc:'Marks operators before calling lightning.',special:'storm'},
    nullmimic: {hp:95,spd:86,r:20,dmg:20,coin:7,xp:8,hue:275,shape:'hex',desc:'Temporarily disrupts player aim.',special:'invert'},
    crystalwarden: {hp:165,spd:38,r:28,dmg:30,coin:9,xp:9,hue:300,shape:'diamond',desc:'Grows crystal defenders while wounded.',special:'crystal'},
    plasmacrusher: {hp:145,spd:70,r:24,dmg:28,coin:8,xp:9,hue:338,shape:'square',desc:'Charges and detonates at close range.',special:'plasmacharge'},
    corroswirl: {hp:82,spd:92,r:21,dmg:24,coin:7,xp:8,hue:92,shape:'ring',desc:'Spins a corrosive storm that strips shields.',special:'corrode'},
    gravityknight: {hp:190,spd:52,r:27,dmg:32,coin:10,xp:10,hue:245,shape:'diamond',desc:'Teleports and leaves a brief gravity well.',special:'gravityblink'}
  };
  const BOSSDEFS = [
    { name: 'THE CHROMATIC WARDEN', hue: 336, shape: 'hex', pat: 'spiral', hpMul: 1 },
    { name: 'ISOTOPE PRIME', hue: 200, shape: 'hex', pat: 'burst', hpMul: .9 },
    { name: 'THE SLAG COLOSSUS', hue: 20, shape: 'square', pat: 'rings', hpMul: 1.3, spd: 30, charge: true },
    { name: 'HALOGEN TYRANT', hue: 120, shape: 'tri', pat: 'clouds', hpMul: 1 },
    { name: 'THE CRITICAL MASS', hue: 55, shape: 'hex', pat: 'spiral', hpMul: .85, fast: true },
    { name: 'ENTROPY ENGINE', hue: 260, shape: 'square', pat: 'cross', hpMul: 1.15 },
    { name: 'THE PHOSPHOR KING', hue: 60, shape: 'diamond', pat: 'summon', hpMul: 1 },
    { name: 'NEUTRON LICH', hue: 190, shape: 'diamond', pat: 'teleport', hpMul: .9 },
    { name: 'MAGMA SOVEREIGN', hue: 15, shape: 'square', pat: 'clouds', hpMul: 1.2, charge: true },
    { name: 'THE VACUUM SAINT', hue: 280, shape: 'ring', pat: 'pull', hpMul: 1.1 },
    { name: 'FERRIC WARBRINGER', hue: 25, shape: 'square', pat: 'summon', hpMul: 1.25, charge: true },
    { name: 'OMEGA DECAY', hue: 330, shape: 'hex', pat: 'omega', hpMul: 1.5 },
    { name: 'THE CRYSTAL REGENT', hue: 295, shape: 'diamond', pat: 'rings', hpMul: 1.05 },
    { name: 'KRYPTON MIRAGE', hue: 188, shape: 'ring', pat: 'teleport', hpMul: .95, fast: true },
    { name: 'THE ACID EMPEROR', hue: 95, shape: 'tri', pat: 'clouds', hpMul: 1.15 },
    { name: 'TUNGSTEN BEHEMOTH', hue: 38, shape: 'square', pat: 'cross', hpMul: 1.42, spd: 25, charge: true },
    { name: 'ELECTRON MAELSTROM', hue: 210, shape: 'ring', pat: 'pull', hpMul: 1.05 },
    { name: 'RADIANT ARCHON', hue: 58, shape: 'hex', pat: 'burst', hpMul: .88, fast: true },
    { name: 'THE BORON CITADEL', hue: 155, shape: 'square', pat: 'summon', hpMul: 1.35 },
    { name: 'MERCURY TEMPEST', hue: 230, shape: 'diamond', pat: 'spiral', hpMul: 1.02, fast: true },
    { name: 'SULFUR ORACLE', hue: 66, shape: 'tri', pat: 'clouds', hpMul: 1.08 },
    { name: 'DARK MATTER PROXY', hue: 278, shape: 'ring', pat: 'omega', hpMul: 1.28 },
    { name: 'THE CARBON MONOLITH', hue: 205, shape: 'square', pat: 'rings', hpMul: 1.38, charge: true },
    { name: 'ABSOLUTE ZERO', hue: 196, shape: 'diamond', pat: 'teleport', hpMul: 1.12 },
    { name: 'PLASMA VORTEX', hue: 295, shape: 'ring', pat: 'spiral', hpMul: 1.0, fast: true },
    { name: 'THE LITHIUM KING', hue: 350, shape: 'hex', pat: 'burst', hpMul: 0.92, charge: true },
    { name: 'CHROMIUM PHANTOM', hue: 145, shape: 'diamond', pat: 'teleport', hpMul: 1.05, fast: true },
    { name: 'COBALT DREADNOUGHT', hue: 220, shape: 'square', pat: 'rings', hpMul: 1.4, spd: 28, charge: true },
    { name: 'THE FERMIUM HERALD', hue: 268, shape: 'hex', pat: 'omega', hpMul: 1.22 },
    { name: 'SILICON GOLEM', hue: 175, shape: 'square', pat: 'cross', hpMul: 1.32 },
    { name: 'XENON TYRANT', hue: 188, shape: 'ring', pat: 'teleport', hpMul: 0.98, fast: true },
    { name: 'THE OSMIUM WALL', hue: 40, shape: 'square', pat: 'rings', hpMul: 1.55, spd: 20, charge: true },
    { name: 'RADON SPECTER', hue: 155, shape: 'ring', pat: 'clouds', hpMul: 1.08 },
    { name: 'PLUTONIUM LICH', hue: 308, shape: 'hex', pat: 'omega', hpMul: 1.45 },
    { name: 'GOLD SOVEREIGN', hue: 48, shape: 'diamond', pat: 'burst', hpMul: 1.0, fast: true },
    { name: 'BISMUTH ARCHON', hue: 285, shape: 'hex', pat: 'spiral', hpMul: 1.18 },
    { name: 'THE QUANTUM DEVOURER', hue: 312, shape: 'ring', pat: 'omega', hpMul: 1.34, fast: true },
    { name: 'CARBON FRACTURE', hue: 205, shape: 'diamond', pat: 'rings', hpMul: 1.27 },
    { name: 'THE ION EMPRESS', hue: 172, shape: 'tri', pat: 'cross', hpMul: 1.08, fast: true },
    { name: 'CHLORINE ABYSS', hue: 92, shape: 'hex', pat: 'clouds', hpMul: 1.21 },
    { name: 'THE NEUTRON FORGE', hue: 225, shape: 'square', pat: 'summon', hpMul: 1.4, spd: 24, charge: true },
    { name: 'RADIOACTIVE MIRROR', hue: 278, shape: 'ring', pat: 'teleport', hpMul: 1.16, fast: true },
    { name: 'THE SILICA WRAITH', hue: 168, shape: 'diamond', pat: 'spiral', hpMul: 1.12 },
    { name: 'FERROUS SINGULARITY', hue: 35, shape: 'square', pat: 'pull', hpMul: 1.5, spd: 22, charge: true },
    { name: 'THE PLASMA ARCHIVIST', hue: 300, shape: 'hex', pat: 'burst', hpMul: 1.06 },
    { name: 'VOID OF ZERO', hue: 250, shape: 'ring', pat: 'omega', hpMul: 1.58 },
    { name: 'THE ALCHEMICAL CROWN', hue: 55, shape: 'hex', pat: 'summon', hpMul: 1.32 }];
  const BOSSES = BOSSDEFS.map(b => b.name);
  const RELICS = [
    { id: 'core', ic: '⬢', n: 'Isotope Core', d: '+20% damage this run' },
    { id: 'coolant', ic: '❄', n: 'Coolant Rod', d: 'Regen 2 HP/s this run' },
    { id: 'lens', ic: '◉', n: 'Focusing Lens', d: '+1 projectile this run' },
    { id: 'battery', ic: '▯', n: 'Reactor Battery', d: '-30% cooldowns this run' },
    { id: 'magnet', ic: '🧲', n: 'Ferro-Magnet', d: '+60% pickup range' },
    { id: 'prism_core', ic: '◈', n: 'Prism Core', d: '+10% damage and +5% fire rate' },
    { id: 'phase_drive', ic: '⟐', n: 'Phase Drive', d: '+10% movement speed and -10% dash cooldown' },
    { id: 'ion_compass', ic: '⌖', n: 'Ion Compass', d: '+10% pickup range' },
    { id: 'golden_filter', ic: '◉', n: 'Golden Filter', d: '+12% coin gain and +5% pickup range' },
    { id: 'aegis_engine', ic: '⬢', n: 'Aegis Engine', d: '+25 maximum shield' },
    { id: 'inertial_dampener', ic: '⬡', n: 'Inertial Dampener', d: '+12% damage resistance' },
    { id: 'singularity_lens', ic: '◎', n: 'Singularity Lens', d: '+1 projectile' },
    { id: 'fission_emblem', ic: '✣', n: 'Fission Emblem', d: '+5% critical chance' },
    { id: 'corrosion_coil', ic: '🜁', n: 'Corrosion Coil', d: '+1 poison potency level' },
    { id: 'thermal_heart', ic: '☀', n: 'Thermal Heart', d: '+1 burn potency level' },
    { id: 'resonance_drum', ic: '◌', n: 'Resonance Drum', d: '+1 reaction area level' }];

  /* ---- helpers ---- */
  const MOLALIASES = {};
  Object.keys(MOLDEF).forEach(k => {
    const m = MOLDEF[k];
    MOLALIASES[k] = k;
    if (m.token) MOLALIASES[m.token] = k;
    if (m.f) MOLALIASES[m.f] = k;
    if (m.name) MOLALIASES[m.name] = k;
  });
  function canonicalId(id) {
    if (id == null) return 'e1';
    id = String(id).trim();
    if (ELEMS[id]) return id;
    if (MOLDEF[id]) return id;
    if (MOLALIASES[id]) return MOLALIASES[id];
    /* MOLDEF is extended later in this file by the real-compound/catalogue
       passes, so the early alias table cannot be the only resolver. */
    const target=id.toLowerCase();
    for (const k of Object.keys(MOLDEF||{})) {
      const m=MOLDEF[k]; if(!m) continue;
      if(String(k).toLowerCase()===target || String(m.token||'').toLowerCase()===target || String(m.f||'').toLowerCase()===target || String(m.name||'').toLowerCase()===target) return k;
    }
    return 'e1';
  }
  function EL(id) {
    const key = canonicalId(id);
    if (key.startsWith('e')) return ELEMS[key];
    return { ...MOLDEF[key], id: key };
  }
  function isOwned(id) {
    const key = canonicalId(id);
    return key.startsWith('e') ? SAVE.unlocked.includes(key) : SAVE.mols.includes(key);
  }
  function baseCombat(el) {
    if (el.mol) {
      const m = el.mods || {};
      return {
        dmg: 14 * (m.dmg || 1), rate: 1.7 * (m.rate || 1), ps: 380 * (m.ps || 1), kb: 120 * (m.kb || 1),
        hp: 115 * (m.hp || 1), spd: 255 * (m.spd || 1), crit: 8 + (m.crit || 0), pierce: m.pierce || 0,
        armor: (m.armor || 0) * .25, style: 'mol'
      };
    }
    const c = CATS[el.cat], k = 1 + el.n * .004;
    const s = {
      dmg: c.dmg * k, rate: c.rate * (1 + el.n * .0008), ps: c.ps, kb: c.kb, hp: 100 + Math.min(60, el.n * .5),
      spd: 250, crit: 6, pierce: 0, armor: 0, style: c.style
    };
    if (c.style === 'pure') s.crit += 8; if (c.style === 'inert') s.pierce += 2; if (c.style === 'phase') s.pierce += 1;
    return s
  }
  function elemStatsDisplay(el) {
    const c = baseCombat(el), cat = el.mol ? null : CATS[el.cat];
    return [['DMG', c.dmg / 46], ['RATE', c.rate / 3], ['VEL', c.ps / 560], ['TOUGH', c.hp / 180],
    ['CRIT', c.crit / 60], ['PIERCE', (c.pierce + 1) / 5],
    ['TOXIC', (cat ? cat.tox : 2) / 5], ['REACT', (cat ? cat.react : 3) / 5]]
  }


  Object.values(ELEMS).forEach(e => { e.signatures = makeSignatureChoices(e); });

  Object.assign(DATA, { ELEMENT_FACTS, CATS, SIG_CHOICE_STYLES, makeSignatureChoices, ELEMS, MOLDEF, RECIPES, MNODES, mxCost, ETYPES, BOSSDEFS, BOSSES, RELICS, EL, canonicalId, isOwned, baseCombat, elemStatsDisplay });


  /* ISO_ABILITY_3CHOICE_DATA */
  (function () {
    function cleanCustom() {
      var out = {};
      Object.keys(CUSTOM_ABILITIES).forEach(function (k) {
        var nk = String(k).trim(), src = CUSTOM_ABILITIES[k] || {}, o = {};
        Object.keys(src).forEach(function (f) { o[String(f).trim()] = String(src[f]).trim(); });
        out[nk] = o;
      });
      return out;
    }
    var CLEAN = (typeof CUSTOM_ABILITIES !== 'undefined') ? cleanCustom() : {};
    function buildChoices(el) {
      var sigs = el.signatures || (typeof makeSignatureChoices === 'function' ? makeSignatureChoices(el) : []);
      var base = el.act || (typeof signatureFor === 'function' ? signatureFor(el) : { name: 'Reaction', desc: 'Elemental reaction.', ic: '✦', cd: 6, key: 'pulse' });
      var c = CLEAN[String(el.n)];
      var main = {
        id: 'main_' + (el.id || el.token || el.name), key: 'main_' + (el.n || el.token || el.name), slot: 0, ic: '⚛',
        name: (c && c.name) || base.name || (el.sym + ' Core'), desc: (c && c.desc) || base.desc || 'Core elemental reaction.', power: 1.06, main: true
      };
      var s1 = Object.assign({}, sigs[0] || {}, { slot: 1, main: false });
      var s2 = Object.assign({}, sigs[1] || {}, { slot: 2, main: false });
      el.act = main; el.choices = [main, s1, s2]; el.signatures = el.choices;
    }
    if (typeof ELEMS !== 'undefined') Object.values(ELEMS).forEach(buildChoices);
    if (typeof MOLDEF !== 'undefined') Object.values(MOLDEF).forEach(function (m) { if (m.mol) buildChoices(m); });
  })();

  /* ISO_MEGA_DATA */
  (function () {
    if (window.__ISO_MEGA_DATA__) return; window.__ISO_MEGA_DATA__ = true;
    var NEW = [
      ['C+H+H+H+H+O', 'CH4O', 'Methanol', 205, { rate: 1.1 }, 'toxic', 'Wood spirit: volatile solvent.', 'C+4H+O'],
      ['C+C+H+H+H+H+O', 'C2H6O', 'Ethanol', 30, { rate: 1.15, dmg: 1.05 }, 'burn', 'Fermented fuel: ignites shots.', '2C+6H+O'],
      ['C+C+H+H+H+H+O+O', 'C2H4O2', 'Acetic Acid', 60, { dmg: 1.2 }, 'acid', 'Vinegar: corrodes armor.', '2C+4H+2O'],
      ['H+H+O+O+O+O+S', 'H2SO4', 'Sulfuric Acid', 50, { dmg: 1.35 }, 'corrosive', 'King of acids: melts everything.', '2H+S+4O'],
      ['H+H+H+O+O+O+O+P', 'H3PO4', 'Phosphoric Acid', 90, { dmg: 1.15, rate: 1.05 }, 'acid', 'Rust remover: acidic bite.', '3H+P+4O'],
      ['K+Mn+O+O+O+O', 'KMnO4', 'Permanganate', 285, { dmg: 1.25 }, 'burn', 'Purple oxidizer: fierce burns.', 'K+Mn+4O'],
      ['H+Na+C+O+O+O', 'NaHCO3', 'Bicarbonate', 190, { hp: 1.15 }, 'vital', 'Baking soda: soothing buffer.', 'H+Na+C+3O'],
      ['C+H+H+H+H+N+N+O', 'CH4N2O', 'Urea', 170, { hp: 1.1, rate: 1.05 }, 'vital', 'Nitrogen carrier: steady regen.', 'C+4H+2N+O'],
      ['H+H+H+H+N+N+O+O+O', 'N2H4O3', 'Ammonium Nitrate', 35, { dmg: 1.3 }, 'blast', 'Fertilizer explosive: huge blasts.', '4H+2N+3O'],
      ['C+C+H+H+H+H+H+H+O+S', 'C2H6OS', 'DMSO', 300, { rate: 1.15 }, 'phase', 'Solvent that slips through membranes.', '2C+6H+O+S'],
      ['C+C+H+H+H+H+H+N+O+O', 'C2H5NO2', 'Glycine', 270, { dmg: 0.2 }, 'charm', 'Neurotransmitter: shots turn foes.', '2C+5H+N+2O']
    ];
    NEW.forEach(function (row) {
      var k = row[0];
      if (MOLDEF[k]) return;
      var m = M(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]);
      MOLDEF[k] = m;
      RECIPES[k] = k;
      m.signatures = makeSignatureChoices(m);
      var s = m.signatures;
      var main = Object.assign({}, m.act, { id: 'main_' + (m.token || k), slot: 0, main: true, power: 1.06 });
      m.act = main;
      m.choices = [main, Object.assign({}, s[0], { slot: 1, main: false }), Object.assign({}, s[1], { slot: 2, main: false })];
      m.signatures = m.choices;
    });
  })();

  /* ISO_GLYC_DATA */
  (function () {
    if (window.__ISO_GLYC__) return; window.__ISO_GLYC__ = true;
    var key = 'C+C+H+H+H+H+H+N+O+O';
    if (typeof MOLDEF !== 'undefined' && !MOLDEF[key]) {
      MOLDEF[key] = M('Glycine', 'C2H5NO2', 'Glycine', 140, { hp: 1.1, dmg: 1.05 }, 'vital', 'Amino acid: life itself fights beside you.', '2C+5H+N+2O');
      RECIPES[key] = key;
    }
    var m = MOLDEF[key];
    if (m && !m.choices) {
      m.signatures = makeSignatureChoices(m);
      var s = m.signatures;
      var main = { id: 'main_glycine', key: 'main_glycine', slot: 0, ic: 'â¬¢', name: 'Amino Summon', desc: 'Summon a random allied creature at FULL health. It decays 5 HP per second.', power: 1.06, main: true };
      m.act = main;
      m.choices = [main, Object.assign({}, s[0], { slot: 1, main: false }), Object.assign({}, s[1], { slot: 2, main: false })];
      m.signatures = m.choices;
    }
  })();
})();
/* ISO_REAL_COMPOUND_OVERHAUL_V2
   Real-compound-only synthesis. No generated-fusion fallback.
   Each catalogued compound receives exactly 3 selectable semantic abilities.
*/
(function () {
  if (window.__ISO_REAL_COMPOUND_OVERHAUL_V2__) return;
  window.__ISO_REAL_COMPOUND_OVERHAUL_V2__ = true;
  if (!window.DATA || !DATA.MOLDEF || !DATA.RECIPES) return;
  const mol = DATA.MOLDEF, recipes = DATA.RECIPES;

  const MODE_BANK = [
    ['Orbit', 'Molecular Orbit', 'Spawn 6 charged motes that revolve around you for 7 seconds; each mote fires only when a hostile enters its sector.', 'orbit'],
    ['Relay', 'Ally Relay', 'Send a temporary performance link to every allied operator: +30% damage, +20% fire rate, and +12 shield for 6 seconds.', 'ally'],
    ['Aftershock', 'Delayed Aftershock', 'Prime a target area; 0.9 seconds later it erupts twice in a shrinking sequence of explosions.', 'aftershock'],
    ['Tether', 'Reactive Tether', 'Latch onto the nearest enemy for 4 seconds. Every 0.6 seconds the tether pulls them toward the anchor and deals a pulse of damage.', 'tether'],
    ['Halo', 'Guard Halo', 'Create 5 rotating defensive plates around yourself for 6 seconds. Each plate can destroy one incoming projectile before breaking.', 'guardHalo'],
    ['Catalyst', 'Catalyst Bloom', 'Plant a field at the cursor that repeatedly accelerates reactions: enemies inside are slowed and take increasing damage every pulse.', 'field'],
    ['Split', 'Forked Cascade', 'Launch one heavy shot that splits into three angled fragments on its first enemy hit, then fragments split again once.', 'split'],
    ['Phase', 'Phase Thread', 'Dash through the nearest hostile and leave a linear thread behind; crossing the thread damages enemies and slows them.', 'phase'],
    ['Siphon', 'Vital Siphon', 'Drain the nearest elite for a burst of damage and convert 35% of that damage into healing and shield.', 'siphon'],
    ['Rain', 'Orbital Rain', 'Mark five positions around the player. Meteors fall into those positions in order, never striking the same point twice.', 'rain'],
    ['Resonance', 'Resonance Lock', 'Mark the nearest three enemies. Their movement becomes synchronized for 3 seconds and each pulse mirrors damage between them.', 'resonance'],
    ['Beacon', 'Pulse Beacon', 'Deploy a beacon at the cursor for 8 seconds that emits alternating slow, shock, and damage pulses.', 'beacon'],
    ['Shatter', 'Shatter Mine', 'Place a mine that waits until an enemy is close, then launches a ring of fragments and a second inward implosion.', 'mine'],
    ['Swarm', 'Reactive Swarm', 'Summon four autonomous micro-drones that orbit their owner, then dive-bomb the nearest target when it approaches.', 'swarm'],
    ['Gravity', 'Mass Fold', 'Create a compact gravity fold that drags enemies toward a point for 2.5 seconds, then releases a knockback burst.', 'gravity'],
    ['Tempo', 'Combat Tempo', 'Enter a 7-second rhythm state: every third hit grants a brief shield and every fifth hit refreshes your firing speed.', 'tempo'],
    ['Prism', 'Prismatic Arc', 'Sweep three colored beams in different angles; each color applies a different status and none uses the same timing.', 'prism'],
    ['Echo', 'Delayed Echo', 'Record your next 0.8 seconds of movement. After 1 second a phantom repeats that movement while firing mirrored shots.', 'echo'],
    ['Mend', 'Molecular Mend', 'Restore 22% HP to yourself and 12% to your nearest ally, then grant both gradual regeneration for 5 seconds.', 'mend'],
    ['Rupture', 'Rupture Mark', 'Tag the closest enemy. Every hit adds a rupture stack; at 6 stacks the mark bursts and jumps to one nearby enemy.', 'rupture']
  ];

  function makeExec(mode, seed, isCreatine) {
    return function (p) {
      const x = p.x, y = p.y, mult = 1 + (seed % 5) * .08;
      if (isCreatine && mode === 'ally') {
        RUN.players.forEach(function (q) { q.puDamage = Math.max(q.puDamage || 1, 1.35); q.puRate = Math.max(q.puRate || 1, 1.22); q.puTimer = Math.max(q.puTimer || 0, 7); q.sh = Math.min((q._compoundShieldMax || 110) + 12, (q.sh || 0) + 12); q.compRecovery = 6; });
        ringFx(x, y, 140, 250); banner('SHARED ATP SURGE', 900); return;
      }
      switch (mode) {
        case 'orbit': RUN.compOrbits = RUN.compOrbits || []; RUN.compOrbits.push({ owner: p.id, x, y, t: 7, n: 6, seed, hue: RUN.hue }); break;
        case 'ally': RUN.players.forEach(q => { q.puDamage = Math.max(q.puDamage || 1, 1.3 * mult); q.puRate = Math.max(q.puRate || 1, 1.18 * mult); q.puTimer = Math.max(q.puTimer || 0, 6); q.sh = Math.min(ST.shieldMax, q.sh + 12); }); ringFx(x, y, 160, 260); break;
        case 'aftershock': for (let k = 0; k < 3; k++) setTimeout(() => { if (RUN) aoe(x + Math.cos(k * 2.1) * 70, y + Math.sin(k * 2.1) * 70, 95 - k * 15, ST.dmg * (1.15 + .2 * k) * mult, 28); }, 900 + k * 240); break;
        case 'tether': { const e = nearestEnemy(x, y); if (e) { e.compTether = { pid: p.id, t: 4, x, y, dmg: ST.dmg * .75 * mult }; } break; }
        case 'guardHalo': RUN.compGuards = RUN.compGuards || []; RUN.compGuards.push({ pid: p.id, n: 5, t: 6, charges: 5 }); break;
        case 'field': RUN.compFields = RUN.compFields || []; RUN.compFields.push({ x: clamp(mouse.x, 25, W - 25), y: clamp(mouse.y, 25, H - 25), r: 145, t: 6, seed }); break;
        case 'split': RUN.bullets.push({ x, y, vx: Math.cos(p.angle) * ST.ps * 1.55, vy: Math.sin(p.angle) * ST.ps * 1.55, dmg: ST.dmg * 2.4 * mult, r: 9, pierce: 1, hit: [], life: 1.5, owner: p.id, compoundSplit: true, splitN: 3 }); break;
        case 'phase': { const ox = x, oy = y; p.x = clamp(x + Math.cos(p.angle) * 210, 25, W - 25); p.y = clamp(y + Math.sin(p.angle) * 210, 25, H - 25); p.iframes = Math.max(p.iframes, 1.2); RUN.compThreads = RUN.compThreads || []; RUN.compThreads.push({ ax: ox, ay: oy, bx: p.x, by: p.y, t: 4 }); break; }
        case 'siphon': { const e = nearestEnemy(x, y); if (e) { const d = ST.dmg * 3.2 * mult; dmgEnemy(e, d); p.hp = Math.min(ST.hp, p.hp + d * .35); p.sh = Math.min(ST.shieldMax, p.sh + d * .2); ringFx(e.x, e.y, 300, 120); } break; }
        case 'rain': for (let k = 0; k < 5; k++)setTimeout(() => { if (RUN) { const a = k / 5 * TAU + seed * .001; aoe(clamp(x + Math.cos(a) * 170, 30, W - 30), clamp(y + Math.sin(a) * 170, 30, H - 30), 75, ST.dmg * (1.3 + .1 * k) * mult, 20); } }, k * 220); break;
        case 'resonance': { const es = RUN.enemies.filter(e => !e.dead).sort((a, b) => d2(a.x, a.y, x, y) - d2(b.x, b.y, x, y)).slice(0, 3); es.forEach(e => { e.compRes = 3; }); break; }
        case 'beacon': RUN.compBeacons = RUN.compBeacons || []; RUN.compBeacons.push({ x: clamp(mouse.x, 25, W - 25), y: clamp(mouse.y, 25, H - 25), t: 8, step: 0 }); break;
        case 'mine': RUN.compMines = RUN.compMines || []; RUN.compMines.push({ x: clamp(mouse.x, 25, W - 25), y: clamp(mouse.y, 25, H - 25), t: 8, owner: p.id }); ringFx(x, y, 60, 20); break;
        case 'swarm': RUN.compSwarm = RUN.compSwarm || []; for (let k = 0; k < 4; k++)RUN.compSwarm.push({ x, y, t: 7, owner: p.id, ang: k * TAU / 4, phase: k }); break;
        case 'gravity': RUN.wells.push({ x: clamp(mouse.x, 25, W - 25), y: clamp(mouse.y, 25, H - 25), r: 145, t: 2.6, lv: 4 }); setTimeout(() => { if (RUN) aoe(clamp(mouse.x, 25, W - 25), clamp(mouse.y, 25, H - 25), 165, ST.dmg * 2.2 * mult, 180); }, 2600); break;
        case 'tempo': p.puDamage = Math.max(p.puDamage || 1, 1.2 * mult); p.puRate = Math.max(p.puRate || 1, 1.35 * mult); p.puTimer = Math.max(p.puTimer || 0, 7); p.compTempo = 7; break;
        case 'prism': for (let k = 0; k < 3; k++) { const a = p.angle + (k - 1) * .22; RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * (1.3 + k * .15), vy: Math.sin(a) * ST.ps * (1.3 + k * .15), dmg: ST.dmg * (1.2 + k * .2) * mult, r: 5, pierce: 3 + k, hit: [], life: 1.2, owner: p.id, prism: k }); } break;
        case 'echo': RUN.compEcho = RUN.compEcho || []; RUN.compEcho.push({ x, y, a: p.angle, t: 1.1, owner: p.id }); break;
        case 'mend': p.hp = Math.min(ST.hp, p.hp + ST.hp * .22); p.sh = Math.min(ST.shieldMax, p.sh + (ST.shieldMax || 70) * .18); p.compRecovery = 5; const al = RUN.players.find(q => q.id !== p.id && !q.downed); if (al) { al.hp = Math.min(ST.hp, al.hp + ST.hp * .12); al.sh = Math.min(ST.shieldMax, al.sh + 10); al.compRecovery = 5; } ringFx(x, y, 120, 220); break;
        case 'rupture': { const e = nearestEnemy(x, y); if (e) { e.compRupture = { stacks: 0, t: 8 }; ringFx(e.x, e.y, 40, 70); } break; }
      }
    };
  }

  const REAL_COMPOUNDS = [
    { name: "Water", formula: "H2O" },
    { name: "Hydrogen Peroxide", formula: "H2O2" },
    { name: "Ammonia", formula: "NH3" },
    { name: "Methane", formula: "CH4" },
    { name: "Ethane", formula: "C2H6" },
    { name: "Propane", formula: "C3H8" },
    { name: "Butane", formula: "C4H10" },
    { name: "Ethene", formula: "C2H4" },
    { name: "Propene", formula: "C3H6" },
    { name: "Acetylene", formula: "C2H2" },
    { name: "Carbon Monoxide", formula: "CO" },
    { name: "Carbon Dioxide", formula: "CO2" },
    { name: "Nitric Oxide", formula: "NO" },
    { name: "Nitrogen Dioxide", formula: "NO2" },
    { name: "Nitrous Oxide", formula: "N2O" },
    { name: "Sulfur Dioxide", formula: "SO2" },
    { name: "Sulfur Trioxide", formula: "SO3" },
    { name: "Hydrogen Sulfide", formula: "H2S" },
    { name: "Hydrogen Chloride", formula: "HCl" },
    { name: "Hydrogen Fluoride", formula: "HF" },
    { name: "Hydrogen Bromide", formula: "HBr" },
    { name: "Hydrogen Iodide", formula: "HI" },
    { name: "Nitric Acid", formula: "HNO3" },
    { name: "Nitrous Acid", formula: "HNO2" },
    { name: "Sulfuric Acid", formula: "H2SO4" },
    { name: "Sulfurous Acid", formula: "H2SO3" },
    { name: "Phosphoric Acid", formula: "H3PO4" },
    { name: "Carbonic Acid", formula: "H2CO3" },
    { name: "Sodium Chloride", formula: "NaCl" },
    { name: "Potassium Chloride", formula: "KCl" },
    { name: "Calcium Chloride", formula: "CaCl2" },
    { name: "Magnesium Chloride", formula: "MgCl2" },
    { name: "Aluminum Chloride", formula: "AlCl3" },
    { name: "Iron(II) Chloride", formula: "FeCl2" },
    { name: "Iron(III) Chloride", formula: "FeCl3" },
    { name: "Copper(I) Chloride", formula: "CuCl" },
    { name: "Copper(II) Chloride", formula: "CuCl2" },
    { name: "Silver Chloride", formula: "AgCl" },
    { name: "Sodium Hydroxide", formula: "NaOH" },
    { name: "Potassium Hydroxide", formula: "KOH" },
    { name: "Calcium Hydroxide", formula: "CaO2H2" },
    { name: "Magnesium Hydroxide", formula: "MgO2H2" },
    { name: "Aluminum Hydroxide", formula: "AlO3H3" },
    { name: "Sodium Carbonate", formula: "Na2CO3" },
    { name: "Sodium Bicarbonate", formula: "NaHCO3" },
    { name: "Potassium Carbonate", formula: "K2CO3" },
    { name: "Calcium Carbonate", formula: "CaCO3" },
    { name: "Magnesium Carbonate", formula: "MgCO3" },
    { name: "Sodium Sulfate", formula: "Na2SO4" },
    { name: "Potassium Sulfate", formula: "K2SO4" },
    { name: "Calcium Sulfate", formula: "CaSO4" },
    { name: "Magnesium Sulfate", formula: "MgSO4" },
    { name: "Copper Sulfate", formula: "CuSO4" },
    { name: "Iron(II) Sulfate", formula: "FeSO4" },
    { name: "Iron(III) Sulfate", formula: "Fe2S3O12" },
    { name: "Zinc Sulfate", formula: "ZnSO4" },
    { name: "Sodium Nitrate", formula: "NaNO3" },
    { name: "Potassium Nitrate", formula: "KNO3" },
    { name: "Silver Nitrate", formula: "AgNO3" },
    { name: "Calcium Nitrate", formula: "CaN2O6" },
    { name: "Ammonium Nitrate", formula: "N2H4O3" },
    { name: "Sodium Phosphate", formula: "Na3PO4" },
    { name: "Calcium Phosphate", formula: "Ca3P2O8" },
    { name: "Sodium Acetate", formula: "C2H3NaO2" },
    { name: "Potassium Acetate", formula: "C2H3KO2" },
    { name: "Calcium Acetate", formula: "CaC4H6O4" },
    { name: "Formic Acid", formula: "CH2O2" },
    { name: "Acetic Acid", formula: "C2H4O2" },
    { name: "Oxalic Acid", formula: "C2H2O4" },
    { name: "Lactic Acid", formula: "C3H6O3" },
    { name: "Citric Acid", formula: "C6H8O7" },
    { name: "Tartaric Acid", formula: "C4H6O6" },
    { name: "Malic Acid", formula: "C4H6O5" },
    { name: "Succinic Acid", formula: "C4H6O4" },
    { name: "Benzoic Acid", formula: "C7H6O2" },
    { name: "Salicylic Acid", formula: "C7H6O3" },
    { name: "Aspirin", formula: "C9H8O4" },
    { name: "Acetaminophen", formula: "C8H9NO2" },
    { name: "Glucose", formula: "C6H12O6" },
    { name: "Sucrose", formula: "C12H22O11" },
    { name: "Ribose", formula: "C5H10O5" },
    { name: "Deoxyribose", formula: "C5H10O4" },
    { name: "Urea", formula: "CH4N2O" },
    { name: "Creatine", formula: "C4H9N3O2" },
    { name: "Creatinine", formula: "C4H7N3O" },
    { name: "Alanine", formula: "C3H7NO2" },
    { name: "Valine", formula: "C5H11NO2" },
    { name: "Lysine", formula: "C6H14N2O2" },
    { name: "Glutamic Acid", formula: "C5H9NO4" },
    { name: "Glutamine", formula: "C5H10N2O3" },
    { name: "Aspartic Acid", formula: "C4H7NO4" },
    { name: "Phenylalanine", formula: "C9H11NO2" },
    { name: "Tyrosine", formula: "C9H11NO3" },
    { name: "Tryptophan", formula: "C11H12N2O2" },
    { name: "Histidine", formula: "C6H9N3O2" },
    { name: "Methionine", formula: "C5H11NO2S" },
    { name: "Cysteine", formula: "C3H7NO2S" },
    { name: "Serine", formula: "C3H7NO3" },
    { name: "Threonine", formula: "C4H9NO3" },
    { name: "Proline", formula: "C5H9NO2" },
    { name: "Arginine", formula: "C6H14N4O2" },
    { name: "Asparagine", formula: "C4H8N2O3" },
    { name: "Glycine", formula: "C2H5NO2" },
    { name: "Dopamine", formula: "C8H11NO2" },
    { name: "Serotonin", formula: "C10H12N2O" },
    { name: "Adrenaline", formula: "C9H13NO3" },
    { name: "Melatonin", formula: "C13H16N2O2" },
    { name: "GABA", formula: "C4H9NO2" },
    { name: "Acetylcholine", formula: "C7H16NO2" },
    { name: "Methanol", formula: "CH4O" },
    { name: "Ethanol", formula: "C2H6O" },
    { name: "Isopropanol", formula: "C3H8O" },
    { name: "Acetone", formula: "C3H6O" },
    { name: "Ethylene Glycol", formula: "C2H6O2" },
    { name: "Propylene Glycol", formula: "C3H8O2" },
    { name: "Formaldehyde", formula: "CH2O" },
    { name: "Acetaldehyde", formula: "C2H4O" },
    { name: "Acetic Anhydride", formula: "C4H6O3" },
    { name: "Dimethyl Sulfoxide", formula: "C2H6OS" },
    { name: "Glycerol", formula: "C3H8O3" },
    { name: "Phenol", formula: "C6H6O" },
    { name: "Aniline", formula: "C6H7N" },
    { name: "Pyridine", formula: "C5H5N" },
    { name: "Toluene", formula: "C7H8" },
    { name: "Styrene", formula: "C8H8" },
    { name: "Benzene", formula: "C6H6" },
    { name: "Ethyl Acetate", formula: "C4H8O2" },
    { name: "Butyl Acetate", formula: "C6H12O2" },
    { name: "Diethyl Ether", formula: "C4H10O" },
    { name: "Tetrahydrofuran", formula: "C4H8O" },
    { name: "Acetonitrile", formula: "C2H3N" },
    { name: "Carbon Disulfide", formula: "CS2" },
    { name: "Chloroform", formula: "CHCl3" },
    { name: "Dichloromethane", formula: "CH2Cl2" },
    { name: "Carbon Tetrachloride", formula: "CCl4" },
    { name: "Vinyl Chloride", formula: "C2H3Cl" },
    { name: "Trichloroethylene", formula: "C2HCl3" },
    { name: "Hexachlorobenzene", formula: "C6Cl6" },
    { name: "Sodium Hypochlorite", formula: "NaClO" },
    { name: "Calcium Hypochlorite", formula: "CaCl2O2" },
    { name: "Potassium Permanganate", formula: "KMnO4" },
    { name: "Potassium Dichromate", formula: "K2Cr2O7" },
    { name: "Sodium Thiosulfate", formula: "Na2S2O3" },
    { name: "Sodium Sulfite", formula: "Na2SO3" },
    { name: "Sodium Sulfide", formula: "Na2S" },
    { name: "Ammonium Sulfate", formula: "N2H8SO4" },
    { name: "Ammonium Bicarbonate", formula: "NH5CO3" },
    { name: "Ammonium Chloride", formula: "NH4Cl" },
    { name: "Ammonium Hydroxide", formula: "NH5O" },
    { name: "Ammonium Carbonate", formula: "N2H8CO3" },
    { name: "Iron Sulfide", formula: "FeS" },
    { name: "Iron(III) Oxide", formula: "Fe2O3" },
    { name: "Magnetite", formula: "Fe3O4" },
    { name: "Copper(I) Oxide", formula: "Cu2O" },
    { name: "Copper(II) Oxide", formula: "CuO" },
    { name: "Zinc Oxide", formula: "ZnO" },
    { name: "Aluminum Oxide", formula: "Al2O3" },
    { name: "Magnesium Oxide", formula: "MgO" },
    { name: "Calcium Oxide", formula: "CaO" },
    { name: "Silicon Dioxide", formula: "SiO2" },
    { name: "Silicon Carbide", formula: "SiC" },
    { name: "Silicon Nitride", formula: "Si3N4" },
    { name: "Titanium Dioxide", formula: "TiO2" },
    { name: "Titanium Carbide", formula: "TiC" },
    { name: "Tungsten Carbide", formula: "WC" },
    { name: "Boron Nitride", formula: "BN" },
    { name: "Boron Carbide", formula: "B4C" },
    { name: "Hydroxyapatite", formula: "Ca5P3O13H" },
    { name: "Fluorapatite", formula: "Ca5P3O12F" },
    { name: "Sodium Fluoride", formula: "NaF" },
    { name: "Calcium Fluoride", formula: "CaF2" },
    { name: "Aluminum Fluoride", formula: "AlF3" },
    { name: "Sodium Bromide", formula: "NaBr" },
    { name: "Potassium Bromide", formula: "KBr" },
    { name: "Silver Bromide", formula: "AgBr" },
    { name: "Silver Iodide", formula: "AgI" },
    { name: "Potassium Iodide", formula: "KI" },
    { name: "Sodium Iodide", formula: "NaI" },
    { name: "Sodium Chlorate", formula: "NaClO3" },
    { name: "Potassium Chlorate", formula: "KClO3" },
    { name: "Potassium Perchlorate", formula: "KClO4" },
    { name: "Sodium Chlorite", formula: "NaClO2" },
    { name: "Silver Oxide", formula: "Ag2O" },
    { name: "Silver Sulfide", formula: "Ag2S" },
    { name: "Zinc Sulfide", formula: "ZnS" },
    { name: "Copper Sulfide", formula: "CuS" },
    { name: "Lead Sulfide", formula: "PbS" },
    { name: "Lead(II) Oxide", formula: "PbO" },
    { name: "Lead Dioxide", formula: "PbO2" },
    { name: "Tin Dioxide", formula: "SnO2" },
    { name: "Chromium Oxide", formula: "Cr2O3" },
    { name: "Manganese Dioxide", formula: "MnO2" },
    { name: "Nickel Oxide", formula: "NiO" },
    { name: "Cobalt Oxide", formula: "CoO" },
    { name: "Cobalt Sulfate", formula: "CoSO4" },
    { name: "Nickel Sulfate", formula: "NiSO4" },
    { name: "Zinc Chloride", formula: "ZnCl2" },
    { name: "Copper Nitrate", formula: "CuN2O6" },
    { name: "Cobalt Chloride", formula: "CoCl2" },
    { name: "Nickel Chloride", formula: "NiCl2" },
    { name: "Barium Sulfate", formula: "BaSO4" },
    { name: "Barium Chloride", formula: "BaCl2" },
    { name: "Strontium Chloride", formula: "SrCl2" },
    { name: "Strontium Nitrate", formula: "SrN2O6" },
    { name: "Lithium Carbonate", formula: "Li2CO3" },
    { name: "Lithium Hydroxide", formula: "LiOH" },
    { name: "Lithium Chloride", formula: "LiCl" },
    { name: "Boric Acid", formula: "BH3O3" },
    { name: "Sodium Borate", formula: "B4Na2O7" },
    { name: "Phosphorus Pentoxide", formula: "P2O5" },
    { name: "Phosphorus Trichloride", formula: "PCl3" },
    { name: "Phosphorus Pentachloride", formula: "PCl5" },
    { name: "Sulfur Hexafluoride", formula: "SF6" },
    { name: "Sulfuryl Chloride", formula: "SCl2O2" },
    { name: "Thionyl Chloride", formula: "SOCl2" },
    { name: "Silicon Tetrafluoride", formula: "SiF4" },
    { name: "Caffeine", formula: "C8H10N4O2" },
    { name: "Uric Acid", formula: "C5H4N4O3" },
    { name: "Histamine", formula: "C5H9N3" },
    { name: "Vitamin C", formula: "C6H8O6" },
    { name: "Vitamin B3", formula: "C6H6N2O" },
    { name: "Vitamin B6", formula: "C8H11NO3" },
    { name: "Vitamin B12", formula: "C63H88CoN14O14P" },
    { name: "Riboflavin", formula: "C17H20N4O6" },
    { name: "Biotin", formula: "C10H16N2O3S" },
    { name: "Folic Acid", formula: "C19H19N7O6" },
    { name: "ATP", formula: "C10H16N5O13P3" },
    { name: "ADP", formula: "C10H15N5O10P2" },
    { name: "NAD+", formula: "C21H28N7O14P2" },
    { name: "FAD", formula: "C27H33N9O15P2" },
    { name: "Creatine Phosphate", formula: "C4H10N3O5P" },
    { name: "Testosterone", formula: "C19H28O2" },
    { name: "Estradiol", formula: "C18H24O2" },
    { name: "Progesterone", formula: "C21H30O2" },
    { name: "Cortisol", formula: "C21H30O5" },
    { name: "Coenzyme Q10", formula: "C59H90O4" },
    { name: "Heme", formula: "C34H32FeN4O4" },
    { name: "Chlorophyll a", formula: "C55H72MgN4O5" },
    { name: "Chlorophyll b", formula: "C55H70MgN4O6" },
    { name: "Thymine", formula: "C5H6N2O2" },
    { name: "Uracil", formula: "C4H4N2O2" },
    { name: "Cytosine", formula: "C4H5N3O" },
    { name: "Adenine", formula: "C5H5N5" },
    { name: "Guanine", formula: "C5H5N5O" },
    { name: "Cyanamide", formula: "CH2N2" },
    { name: "Cyanogen", formula: "C2N2" },
    { name: "Methylamine", formula: "CH5N" },
    { name: "Dimethylamine", formula: "C2H7N" },
    { name: "Trimethylamine", formula: "C3H9N" },
    { name: "Nitromethane", formula: "CH3NO2" },
    { name: "Nitrobenzene", formula: "C6H5NO2" },
    { name: "Phenylhydrazine", formula: "C6H8N2" },
    { name: "Pyrrole", formula: "C4H5N" },
    { name: "Furan", formula: "C4H4O" },
    { name: "Indole", formula: "C8H7N" },
    { name: "Imidazole", formula: "C3H4N2" },
    { name: "Morpholine", formula: "C4H9NO" },
    { name: "Ethyleneimine", formula: "C2H5N" },
    { name: "Dimethyl Carbonate", formula: "C3H6O3" },
    { name: "Diethyl Carbonate", formula: "C5H10O3" },
    { name: "Dimethylformamide", formula: "C3H7NO" },
    { name: "Dimethylacetamide", formula: "C4H9NO" },
    { name: "Acetyl Chloride", formula: "C2H3ClO" },
    { name: "Benzoyl Chloride", formula: "C7H5ClO" },
    { name: "Oxalyl Chloride", formula: "C2Cl2O2" },
    { name: "Phosgene", formula: "CCl2O" },
    { name: "Chloral", formula: "C2HCl3O" },
    { name: "Carbonyl Sulfide", formula: "COS" },
    { name: "Sodium Cyanide", formula: "NaCN" },
    { name: "Potassium Cyanide", formula: "KCN" },
    { name: "Calcium Cyanamide", formula: "CaCN2" },
    { name: "Zinc Carbonate", formula: "ZnCO3" },
    { name: "Copper Carbonate", formula: "CuCO3" },
    { name: "Iron(II) Carbonate", formula: "FeCO3" },
    { name: "Iron(II) Hydroxide", formula: "FeO2H2" },
    { name: "Iron(III) Hydroxide", formula: "FeO3H3" },
    { name: "Copper Hydroxide", formula: "CuO2H2" },
    { name: "Aluminum Sulfate", formula: "Al2S3O12" },
    { name: "Sodium Bisulfate", formula: "NaHSO4" },
    { name: "Potassium Bisulfate", formula: "KHSO4" },
    { name: "Sodium Nitrite", formula: "NaNO2" },
    { name: "Potassium Nitrite", formula: "KNO2" },
    { name: "Silver Nitrite", formula: "AgNO2" },
    { name: "Sodium Bromate", formula: "NaBrO3" },
    { name: "Potassium Bromate", formula: "KBrO3" },
    { name: "Sodium Iodate", formula: "NaIO3" },
    { name: "Potassium Iodate", formula: "KIO3" },
    { name: "Sodium Periodate", formula: "NaIO4" },
    { name: "Potassium Periodate", formula: "KIO4" },
    { name: "Sodium Chromate", formula: "Na2CrO4" },
    { name: "Potassium Chromate", formula: "K2CrO4" },
    { name: "Lead Chromate", formula: "PbCrO4" },
    { name: "Ammonium Dichromate", formula: "N2H8Cr2O7" },
    { name: "Copper(I) Iodide", formula: "CuI" },
    { name: "Copper(I) Bromide", formula: "CuBr" },
    { name: "Silver Fluoride", formula: "AgF" },
    { name: "Lithium Fluoride", formula: "LiF" },
    { name: "Cesium Chloride", formula: "CsCl" },
    { name: "Cesium Iodide", formula: "CsI" },
    { name: "Rubidium Chloride", formula: "RbCl" },
    { name: "Strontium Carbonate", formula: "SrCO3" },
    { name: "Barium Carbonate", formula: "BaCO3" },
    { name: "Barium Hydroxide", formula: "BaO2H2" },
    { name: "Barium Peroxide", formula: "BaO2" },
    { name: "Beryllium Chloride", formula: "BeCl2" },
    { name: "Beryllium Oxide", formula: "BeO" },
    { name: "Beryllium Fluoride", formula: "BeF2" },
    { name: "Boron Trioxide", formula: "B2O3" },
    { name: "Boron Trifluoride", formula: "BF3" },
    { name: "Aluminum Bromide", formula: "AlBr3" },
    { name: "Aluminum Iodide", formula: "AlI3" },
    { name: "Gallium Chloride", formula: "GaCl3" },
    { name: "Gallium Oxide", formula: "Ga2O3" },
    { name: "Germanium Dioxide", formula: "GeO2" },
    { name: "Germanium Tetrachloride", formula: "GeCl4" },
    { name: "Arsenic Trioxide", formula: "As2O3" },
    { name: "Arsenic Pentoxide", formula: "As2O5" },
    { name: "Arsenic Trichloride", formula: "AsCl3" },
    { name: "Selenium Dioxide", formula: "SeO2" },
    { name: "Selenium Hexafluoride", formula: "SeF6" },
    { name: "Krypton Difluoride", formula: "KrF2" },
    { name: "Xenon Difluoride", formula: "XeF2" },
    { name: "Xenon Tetrafluoride", formula: "XeF4" },
    { name: "Xenon Hexafluoride", formula: "XeF6" },
    { name: "Iodine Pentafluoride", formula: "IF5" },
    { name: "Iodine Heptafluoride", formula: "IF7" },
    { name: "Chlorine Trifluoride", formula: "ClF3" },
    { name: "Phosphorous Acid", formula: "H3PO3" },
    { name: "Hypochlorous Acid", formula: "HClO" },
    { name: "Perchloric Acid", formula: "HClO4" },
    { name: "Sodium Peroxide", formula: "Na2O2" },
    { name: "Potassium Peroxide", formula: "K2O2" },
    { name: "Calcium Peroxide", formula: "CaO2" },
    { name: "Zinc Peroxide", formula: "ZnO2" },
    { name: "Manganese(II) Sulfate", formula: "MnSO4" },
    { name: "Manganese(II) Chloride", formula: "MnCl2" },
    { name: "Iron(III) Nitrate", formula: "FeN3O9" },
    { name: "Iron(II) Nitrate", formula: "FeN2O6" },
    { name: "Cobalt Nitrate", formula: "CoN2O6" },
    { name: "Nickel Nitrate", formula: "NiN2O6" },
    { name: "Barium Nitrate", formula: "BaN2O6" },
    { name: "Strontium Hydroxide", formula: "SrO2H2" },
    { name: "Lithium Peroxide", formula: "Li2O2" },
    { name: "Sodium Silicate", formula: "Na2SiO3" },
    { name: "Potassium Silicate", formula: "K2SiO3" },
    { name: "Calcium Silicate", formula: "CaSiO3" },
    { name: "Sodium Metabisulfite", formula: "Na2S2O5" },
    { name: "Sodium Bisulfite", formula: "NaHSO3" },
    { name: "Sodium Bisulfide", formula: "NaHS" },
    { name: "Ammonium Fluoride", formula: "NH4F" },
    { name: "Ammonium Bromide", formula: "NH4Br" },
    { name: "Ammonium Iodide", formula: "NH4I" },
    { name: "Ammonium Fluorosilicate", formula: "N2H8SiF6" },
    { name: "Nicotine", formula: "C10H14N2" },
    { name: "Theobromine", formula: "C7H8N4O2" },
    { name: "Capsaicin", formula: "C18H27NO3" },
    { name: "Vanillin", formula: "C8H8O3" },
    { name: "Menthol", formula: "C10H20O" },
    { name: "Citral", formula: "C10H16O" },
    { name: "Limonene", formula: "C10H16" },
    { name: "Cholesterol", formula: "C27H46O" },
    { name: "Cholic Acid", formula: "C24H40O5" },
    { name: "Bilirubin", formula: "C33H36N4O6" },
    { name: "Adenosine", formula: "C10H13N5O4" },
    { name: "Guanosine", formula: "C10H13N5O5" },
    { name: "Cytidine", formula: "C9H14N3O5" },
    { name: "Uridine", formula: "C9H12N2O6" },
    { name: "Thymidine", formula: "C10H14N2O5" },
    { name: "Nicotinamide", formula: "C6H6N2O" },
    { name: "Cotinine", formula: "C10H12N2O" },
    { name: "L-DOPA", formula: "C9H11NO4" },
    { name: "Ephedrine", formula: "C10H15NO" },
    { name: "Atropine", formula: "C17H23NO3" },
    { name: "Quinine", formula: "C20H24N2O2" },
    { name: "Warfarin", formula: "C19H16O4" },
    { name: "Ibuprofen", formula: "C13H18O2" },
    { name: "Naproxen", formula: "C14H14O3" },
    { name: "Lidocaine", formula: "C14H22N2O" },
    { name: "Procaine", formula: "C13H20N2O2" },
    { name: "Allopurinol", formula: "C5H4N4O" },
    { name: "Barbituric Acid", formula: "C4H4N2O3" },
    { name: "Guanosine Monophosphate", formula: "C10H14N5O8P" },
    { name: "Adenosine Monophosphate", formula: "C10H14N5O7P" },
    { name: "Cytidine Monophosphate", formula: "C9H14N3O8P" },
    { name: "Uridine Monophosphate", formula: "C9H13N2O9P" },
    { name: "Thymidine Monophosphate", formula: "C10H15N2O8P" },
    { name: "Lysine Methyl Ester", formula: "C7H16N2O2" },
    { name: "Sodium Lactate", formula: "C3H5NaO3" },
    { name: "Potassium Lactate", formula: "C3H5KO3" },
    { name: "Calcium Lactate", formula: "CaC6H10O6" },
    { name: "Sodium Citrate", formula: "Na3C6H5O7" },
    { name: "Potassium Citrate", formula: "K3C6H5O7" },
    { name: "Calcium Citrate", formula: "Ca3C12H10O14" },
    { name: "Magnesium Citrate", formula: "Mg3C12H10O14" },
    { name: "Sodium Benzoate", formula: "C7H5NaO2" },
    { name: "Potassium Benzoate", formula: "C7H5KO2" },
    { name: "Calcium Benzoate", formula: "C14H10CaO4" },
    { name: "Sodium Salicylate", formula: "C7H5NaO3" },
    { name: "Potassium Salicylate", formula: "C7H5KO3" },
    { name: "Sodium Oxalate", formula: "Na2C2O4" },
    { name: "Potassium Oxalate", formula: "K2C2O4" },
    { name: "Calcium Oxalate", formula: "CaC2O4" },
    { name: "Magnesium Oxalate", formula: "MgC2O4" },
    { name: "Sodium Tartrate", formula: "Na2C4H4O6" },
    { name: "Potassium Tartrate", formula: "K2C4H4O6" },
    { name: "Calcium Tartrate", formula: "CaC4H4O6" },
    { name: "Sodium Malate", formula: "Na2C4H4O5" },
    { name: "Potassium Malate", formula: "K2C4H4O5" },
    { name: "Calcium Malate", formula: "CaC4H4O5" },
    { name: "Sodium Succinate", formula: "Na2C4H4O4" },
    { name: "Potassium Succinate", formula: "K2C4H4O4" },
    { name: "Calcium Succinate", formula: "CaC4H4O4" },
  ];

  function hash(s) { let h = 2166136261 >>> 0; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
  function formulaKey(formula) {
    const re = /([A-Z][a-z]?)(\d*)/g, counts = {}; let m;
    while ((m = re.exec(formula))) { const sym = m[1], n = +(m[2] || 1); counts[sym] = (counts[sym] || 0) + n; }
    const out = []; Object.keys(counts).sort().forEach(function (sym) { for (let i = 0; i < counts[sym]; i++)out.push(sym); });
    return out.join('+');
  }
  function statMods(i) {
    return { dmg: 1 + (i % 7) * .035, rate: 1 + ((i * 3) % 6) * .025, hp: 1 + ((i * 5) % 8) * .02, ps: 1 + ((i * 7) % 5) * .025, kb: 1 + ((i * 2) % 4) * .04, crit: (i % 5) * 2, pierce: i % 4 };
  }
  function addRealCompound(item, i) {
    const recipe = formulaKey(item.formula); if (!recipe) return null;
    const h = hash(item.name + recipe), hue = 100 + (h % 240), id = 'mol_' + slug(item.name) + '_' + hash(recipe).toString(16);
    const m = mol[recipe] || {};
    m.id = id; m.token = recipe; m.f = item.formula; m.name = item.name; m.hue = hue; m.mods = statMods(i);
    m.trait = 'compound'; m.desc = 'Real compound entry with three individually unlockable abilities.'; m.rx = 'Real compound'; m.mol = true;
    m.cost = Math.max(25, Math.round((45 + recipe.split('+').length * 8 + (i % 9) * 4) / 5) * 5);
    const used = []; m.choices = [];
    for (let s = 0; s < 3; s++) {
      let idx = (h + s * 7) % MODE_BANK.length;
      while (used.indexOf(idx) >= 0) idx = (idx + 1) % MODE_BANK.length;
      used.push(idx); const mode = MODE_BANK[idx], labels = ['Resonance', 'Reaction', 'Protocol'];
      m.choices.push({
        id: id + '_a' + s, key: 'realcompound_' + mode[3] + '_' + id + '_' + s, slot: s, ic: ['⚛', '✦', '◈'][s],
        name: item.name + ' ' + mode[1] + ' ' + labels[s], desc: mode[2], main: s === 0, power: 1 + (h % 7) * .05, exec: makeExec(mode[3], h + s, item.name === 'Creatine')
      });
    }
    if (item.name === 'Creatine') {
      m.choices = [
        { id: id + '_c0', key: 'realcompound_creatine_ally', slot: 0, ic: '✚', name: 'Creatine Squad Surge', desc: 'Buff yourself and every ally with damage, fire-rate, shield, and regeneration for 7 seconds.', main: true, power: 1.18, exec: makeExec('ally', h, true) },
        { id: id + '_c1', key: 'realcompound_creatine_mend', slot: 1, ic: '♥', name: 'Creatine Recovery Link', desc: 'Heal yourself and your nearest ally, then grant both regeneration.', main: false, power: 1.2, exec: makeExec('mend', h + 1, true) },
        { id: id + '_c2', key: 'realcompound_creatine_tempo', slot: 2, ic: '⚡', name: 'Creatine Overclock Chain', desc: 'Accelerate all allied operators and refresh their shields while the buff lasts.', main: false, power: 1.22, exec: makeExec('tempo', h + 2, true) }
      ];
    }
    m.act = m.choices[0]; m.signatures = m.choices; mol[recipe] = m; recipes[recipe] = recipe; return m;
  }

  Object.keys(mol).forEach(function (k) {
    const m = mol[k];
    if (m && m.mol && m.rx === 'Custom bonded fusion') { delete mol[k]; if (recipes[k]) delete recipes[k]; }
  });

  const seenRecipes = {};
  REAL_COMPOUNDS.forEach(function (item, i) {
    const k = formulaKey(item.formula);
    if (seenRecipes[k]) return;
    seenRecipes[k] = true;
    addRealCompound(item, i);
  });

  if (window.SAVE && SAVE.raw) {
    SAVE.raw.mols = SAVE.raw.mols.filter(function (k) { return !!mol[k]; });
    SAVE.raw.mols = [...new Set(SAVE.raw.mols)];
    SAVE.raw.signatures = SAVE.raw.signatures || {};
    Object.keys(SAVE.raw.signatures).forEach(function (id) {
      const slot = +SAVE.raw.signatures[id] || 0;
      if (slot > 0 && !(SAVE.raw.abil && SAVE.raw.abil[id] && SAVE.raw.abil[id][slot])) SAVE.raw.signatures[id] = 0;
    });
    SAVE.save && SAVE.save();
  }
  try { delete DATA.registerCompound; } catch (e) { DATA.registerCompound = undefined; }
  DATA.compoundAbilityModes = MODE_BANK;
  DATA.compoundCatalogNames = REAL_COMPOUNDS.map(function (x) { return x.name; });
  DATA.realCompoundCount = Object.keys(mol).filter(function (k) { return mol[k] && mol[k].mol; }).length;
  console.log('ISO_REAL_COMPOUND_OVERHAUL_V2 active:', DATA.realCompoundCount, 'real compounds; generated fusion disabled');
})();


/* ISO_REAL_COMPOUND_SEMANTIC_V4
   3 bespoke, chemistry-fit abilities for EVERY catalogued real compound.
   No generated fusion fallback. Each compound receives its own ability IDs,
   names, descriptions, parameters and deterministic behavior recipe.
*/
(function () {
  if (window.__ISO_REAL_COMPOUND_SEMANTIC_V4__) return;
  window.__ISO_REAL_COMPOUND_SEMANTIC_V4__ = true;
  if (!window.DATA || !DATA.MOLDEF || !DATA.compoundCatalogNames) return;

  const mol = DATA.MOLDEF;
  function hash(s) { let h = 2166136261 >>> 0; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function stat(p, k, d) { try { return ST[k] || d; } catch (e) { return d; } }
  function nearest(x, y) { try { return nearestEnemy(x, y); } catch (e) { return null; } }
  function enemies() { return (RUN && RUN.enemies) ? RUN.enemies.filter(e => e && !e.dead) : []; }
  function allies(p) { return RUN && RUN.players ? RUN.players.filter(q => q && q.id !== p.id && !q.downed) : []; }
  function cursorX() { return typeof mouse !== 'undefined' ? mouse.x : (RUN.p1 ? RUN.p1.x : W * .5); }
  function cursorY() { return typeof mouse !== 'undefined' ? mouse.y : (RUN.p1 ? RUN.p1.y : H * .5); }
  function burst(x, y, r, dmg, kb) { if (typeof aoe === 'function') aoe(x, y, r, dmg, kb); }
  function ring(x, y, r, dmg) { if (typeof ringFx === 'function') ringFx(x, y, r, dmg); }
  function pushBullet(p, ang, speed, dmg, r, life, extra) { RUN.bullets.push(Object.assign({ x: p.x, y: p.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, dmg, r, life, owner: p.id, hit: [] }, extra || {})); }
  function buff(q, dmg, rate, time, shield) { q.puDamage = Math.max(q.puDamage || 1, dmg); q.puRate = Math.max(q.puRate || 1, rate); q.puTimer = Math.max(q.puTimer || 0, time); if (shield) q.sh = Math.min(stat(q, 'shieldMax', 90), q.sh + shield); }
  function formulaCounts(formula) { const out = {}; const re = /([A-Z][a-z]?)(\d*)/g; let m; while ((m = re.exec(formula))) { const s = m[1], n = +(m[2] || 1); out[s] = (out[s] || 0) + n; } return out; }
  function profileFor(name, formula) {
    const n = name.toLowerCase(), f = formula.toLowerCase();
    if (n === 'water') return 'water';
    if (n.includes('peroxide')) return 'peroxide';
    if (n.includes('ammonia') || /amine|aminob/.test(n)) return 'amine';
    if (/acetylene|alkyne|propyne|butyne/.test(n) || /c2h2/.test(f)) return 'alkyne';
    if (/ethene|propene|butene|pentene|hexene|heptene|octene|alkene/.test(n)) return 'alkene';
    if (/methane|ethane|propane|butane|pentane|hexane|heptane|octane|nonane|decane/.test(n)) return 'alkane';
    if (n.includes('carbon monoxide')) return 'co';
    if (n.includes('carbon dioxide') || n === 'carbonic acid') return 'co2';
    if (/nitric oxide|nitrogen dioxide|nitrous oxide/.test(n)) return 'nox';
    if (/sulfur dioxide|sulfur trioxide|hydrogen sulfide|sulfide/.test(n)) return 'sulfur';
    if (/hydrogen chloride|hydrogen fluoride|hydrogen bromide|hydrogen iodide/.test(n)) return 'hydrogenHalide';
    if (/hydroxide/.test(n)) return 'base';
    if (/bicarbonate|carbonate/.test(n)) return 'carbonate';
    if (/sulfate|bisulfite|metabisulfite|sulfite/.test(n)) return 'sulfate';
    if (/nitrate|nitrite/.test(n)) return 'nitrate';
    if (/chromate|dichromate/.test(n)) return 'chromate';
    if (/bromate|iodate|periodate|hypochlorite|perchlorate/.test(n)) return 'oxoHalogen';
    if (/silicate|fluorosilicate/.test(n)) return 'silicate';
    if (/cyanide|cyanamide|cyanogen/.test(n)) return 'cyan';
    if (/phosphate|adenosine monophosphate|guanosine monophosphate|cytidine monophosphate|uridine monophosphate|thymidine monophosphate/.test(n)) return 'phosphate';
    if (/adenosine|guanosine|cytidine|uridine|thymidine/.test(n)) return 'nucleoside';
    if (/creatine/.test(n)) return 'creatine';
    if (/vitamin|nicotinamide|riboflavin|thiamine|biotin|pantothenic/.test(n)) return 'vitamin';
    if (/alanine|valine|leucine|isoleucine|lysine|arginine|histidine|methionine|phenylalanine|tyrosine|tryptophan|glutamic|glutamine|l-dopa/.test(n)) return 'amino';
    if (/cholesterol|cholic acid|bilirubin|melanin|carotene/.test(n)) return 'bioPigment';
    if (/nicotine|caffeine|theobromine|capsaicin|menthol|vanillin|citral|limonene|ephedrine|atropine|quinine|warfarin|ibuprofen|naproxen|lidocaine|procaine|allopurinol|barbituric/.test(n)) return 'bioactive';
    if (/sodium|potassium|calcium|magnesium|aluminum|iron|copper|silver|zinc|barium|strontium|lithium|cesium|rubidium|beryllium|gallium|germanium|arsenic|selenium|krypton|xenon|iodine|bromine|chlorine/.test(n)) return 'ionic';
    if (/acid$| acid/.test(n)) return 'acid';
    return 'general';
  }

  const FIT = {
    water: ['Water Jet', 'Current Pull', 'Hydro Shield', 'Bubble Snare', 'Pressure Lance', 'Wash Pulse'],
    peroxide: ['Peroxide Bloom', 'Oxidizer Veil', 'Oxygen Burst', 'Reactive Skin', 'Catalytic Patch', 'Peroxide Mark'],
    amine: ['Lone-Pair Lock', 'Base Surge', 'Amine Haze', 'Proton Hook', 'Nitrogen Veil', 'Buffer Pulse'],
    alkane: ['Fuel Trail', 'Ignition Dash', 'Combustion Bank', 'Thermal Mine', 'Flame Sweep', 'Heat Reserve'],
    alkene: ['Addition Dart', 'Polymer Snare', 'Double-Bond Sweep', 'Reaction Mark', 'Linked Burst', 'Unsaturation Trap'],
    alkyne: ['Triple-Bond Needle', 'Spark Thread', 'Terminal Charge', 'Carbon Lance', 'Arc Tether', 'Volatile Point'],
    co: ['Hemoglobin Lock', 'Choking Stream', 'Veil of Silence', 'Oxygen Denial', 'Binding Pulse', 'Target Smother'],
    co2: ['Carbonic Wash', 'Dry-Ice Sweep', 'Pressure Pocket', 'Gas Wall', 'Acidic Bubble', 'Compression Burst'],
    nox: ['Photochemical Haze', 'Shield Nitrate', 'Red Cloud Mark', 'Oxide Cone', 'Acid Rain', 'NOx Surge'],
    sulfur: ['Sulfur Mist', 'Sulfide Tag', 'Redox Snap', 'Pungent Cloud', 'Sulfuric Trace', 'Reduction Trap'],
    hydrogenHalide: ['Etching Ray', 'Halide Fog', 'Proton Hook', 'Acid Line', 'Halogen Brand', 'Etch Burst'],
    acid: ['Corrosive Pool', 'Proton Spear', 'Dissolve Mark', 'Etch Wave', 'Acid Bloom', 'Corrosion Tether'],
    base: ['Caustic Wash', 'Alkaline Shell', 'Neutralize Pulse', 'Hydroxide Wall', 'Base Mark', 'Buffer Burst'],
    carbonate: ['Fizzy Mine', 'Buffer Ward', 'Carbonation Burst', 'Pressure Pop', 'Carbonate Screen', 'Effervescence Ring'],
    sulfate: ['Sulfate Lattice', 'Sulfur Relay', 'Precipitate Crash', 'Anion Net', 'Crystal Relay', 'Sulfate Pulse'],
    nitrate: ['Nitrate Charge', 'Nitrate Bloom', 'Redox Volley', 'Oxidation Vault', 'Nitrate Mark', 'Energetic Bloom'],
    chromate: ['Chromatic Beam', 'Chrome Ward', 'Oxidation Prism', 'Color Split', 'Reflective Arc', 'Redox Mirror'],
    oxoHalogen: ['Halogen Oxidizer', 'Reactive Stripe', 'Sterilizing Field', 'Bleach Pulse', 'Halogen Mark', 'Oxidant Wall'],
    silicate: ['Silicate Glasswork', 'Silicate Bridge', 'Ion Cage', 'Glass Fan', 'Mineral Rampart', 'Silicate Prism'],
    cyan: ['Cyanide Lock', 'Triple-Atom Needle', 'Binding Pulse', 'Neural Seal', 'Cyan Thread', 'Toxic Pin'],
    phosphate: ['Phosphate Battery', 'ATP Relay', 'Phosphorylation Mark', 'Energy Phosphate', 'Relay Wave', 'Charge Tag'],
    nucleoside: ['Base-Pair Echo', 'Helix Spiral', 'Genetic Memory', 'Sequence Thread', 'Codon Mark', 'Replication Burst'],
    creatine: ['Creatine Squad Surge', 'Phosphocreatine Relay', 'Muscle Reserve', 'Recovery Wave', 'Strength Link', 'Burst Endurance'],
    vitamin: ['Cofactor Field', 'Metabolic Spark', 'Antioxidant Guard', 'Vitamin Pulse', 'Cofactor Link', 'Deficiency Cleanse'],
    amino: ['Peptide Link', 'Amino Burst', 'Repair Sequence', 'Protein Weave', 'Recovery Mark', 'Amino Cascade'],
    bioPigment: ['Pigment Veil', 'Chromophore Flash', 'Resonant Pigment', 'Color Cloak', 'Pigment Mark', 'Spectral Bloom'],
    bioactive: ['Receptor Surge', 'Focused Signal', 'Systemic Echo', 'Receptor Lock', 'Dose Spike', 'Targeted Response'],
    ionic: ['Ionic Spear', 'Crystal Precipitate', 'Electrolyte Zone', 'Salt Lattice', 'Ion Burst', 'Precipitation Trap'],
    general: ['Molecular Edge', 'Phase Transition', 'Reaction Reserve', 'Molecular Halo', 'Phase Mark', 'Compound Pulse']
  };

  function trait(profile, name, formula) {
    const c = formulaCounts(formula), t = {};
    t.oxidizer = /peroxide|nitrate|nitrite|chromate|hypochlorite|bromate|iodate|periodate/.test(name.toLowerCase());
    t.acid = profile === 'acid' || profile === 'hydrogenHalide' || /acid/.test(name.toLowerCase());
    t.base = profile === 'base' || profile === 'carbonate';
    t.gas = /oxide|hydrogen sulfide|ammonia|methane|ethane|propane|butane|water|hydrogen chloride|hydrogen fluoride|hydrogen bromide|hydrogen iodide/.test(name.toLowerCase());
    t.bio = /vitamin|amino|creatine|adenosine|guanosine|cytidine|uridine|thymidine|caffeine|nicotine|hormone|melanin|carotene|bilirubin|cholesterol|cholic acid/.test(name.toLowerCase());
    t.metal = Object.keys(c).some(e => /^(Na|K|Ca|Mg|Al|Fe|Cu|Ag|Zn|Ba|Sr|Li|Cs|Rb|Be|Ga|Ge|As|Se)$/.test(e));
    t.halogens = (c.F || 0) + (c.Cl || 0) + (c.Br || 0) + (c.I || 0);
    t.oxygen = c.O || 0; t.hydrogen = c.H || 0; t.carbon = c.C || 0; t.nitrogen = c.N || 0;
    t.ionic = profile === 'ionic' || t.metal || /chloride|fluoride|bromide|iodide|sulfate|nitrate|carbonate|phosphate/.test(name.toLowerCase());
    return t;
  }

  function chooseArchetypes(profile, h, seed) {
    const preferred = {
      water: ['field', 'projectile', 'shield'], peroxide: ['delayed', 'reactive', 'field'], amine: ['tether', 'buff', 'field'], alkane: ['trail', 'burst', 'charge'], alkene: ['split', 'trap', 'mark'], alkyne: ['beam', 'thread', 'detonate'],
      co: ['debuff', 'stealth', 'wave'], co2: ['field', 'wave', 'implode'], nox: ['mark', 'cone', 'rain'], sulfur: ['field', 'mark', 'wave'], hydrogenHalide: ['beam', 'field', 'tether'], acid: ['field', 'mark', 'beam'], base: ['shield', 'cleanse', 'field'], carbonate: ['mine', 'shield', 'burst'],
      sulfate: ['lattice', 'relay', 'delayed'], nitrate: ['charge', 'field', 'volley'], chromate: ['beam', 'reflect', 'prism'], oxoHalogen: ['projectile', 'line', 'field'], silicate: ['wall', 'bridge', 'cage'], cyan: ['mark', 'projectile', 'root'], phosphate: ['charge', 'ally', 'mark'], nucleoside: ['echo', 'spiral', 'memory'],
      creatine: ['ally', 'ally2', 'reserve'], vitamin: ['field', 'support', 'shield'], amino: ['link', 'heal', 'cascade'], bioPigment: ['stealth', 'flash', 'mark'], bioactive: ['mark', 'focus', 'pulse'], ionic: ['projectile', 'lattice', 'field'], general: ['projectile', 'transition', 'reserve']
    };
    const pool = preferred[profile] || preferred.general;
    // Every profile has three deliberate mechanic families. Rotate the trio by
    // the compound hash, but never repeat a mechanic within the same compound.
    const base = seed % pool.length;
    return [pool[base], pool[(base + 1) % pool.length], pool[(base + 2) % pool.length]];
  }

  function abilityFor(profile, archetype, p, h, slot, name, formula) {
    const tr = trait(profile, name, formula), mult = 1 + (h % 11) * .027, ang = p.angle || 0, x = p.x, y = p.y;
    const range = 95 + (h % 6) * 18, dur = 4.5 + (h % 4) * .6, dmg = stat(p, 'dmg', 12) * mult, ps = stat(p, 'ps', 7);
    switch (archetype) {
      case 'projectile': pushBullet(p, ang, ps * (1.35 + tr.oxygen * .06), dmg * (1.15 + tr.halogens * .08), 5, 1.6, { compound: name }); break;
      case 'field': RUN.compFields = RUN.compFields || []; RUN.compFields.push({ x: cursorX(), y: cursorY(), r: range, t: dur, profile, name, fieldPower: 1 + tr.oxygen * .08 }); break;
      case 'shield': p.sh = Math.min(stat(p, 'shieldMax', 90), p.sh + 18 + tr.metal * 8); p._compoundShield = (p._compoundShield || 0) + dur; break;
      case 'delayed': { const tx = cursorX(), ty = cursorY(); setTimeout(() => { if (RUN) burst(tx, ty, 70 + tr.oxygen * 8, dmg * (1.7 + tr.oxidizer * .4), 70); }, 850 + (h % 5) * 80); break; }
      case 'reactive': p._reactiveCompound = { t: dur, mult: 1 + tr.oxidizer * .35, profile }; break;
      case 'tether': { const e = nearest(x, y); if (e) e.compTether = { pid: p.id, t: dur, x: cursorX(), y: cursorY(), dmg: dmg * .55, compound: name }; break; }
      case 'buff': allies(p).forEach(q => buff(q, 1.18 + tr.bio * .08, 1.12 + tr.oxygen * .02, 5, 10)); buff(p, 1.22 + tr.bio * .1, 1.14 + tr.oxygen * .03, 5, 10); break;
      case 'ally': allies(p).forEach(q => buff(q, 1.25 + tr.bio * .06, 1.18, 6, 14)); buff(p, 1.3, 1.2, 6, 14); ring(x, y, 135, 180); break;
      case 'ally2': { const as = allies(p); if (as[0]) { buff(as[0], 1.28, 1.18, 4, 16); as[0].activeCd = Math.max(0, (as[0].activeCd || 0) - 1.5); } buff(p, 1.18, 1.1, 4, 8); break; }
      case 'reserve': p._compoundReserve = { t: dur, charge: 0, profile }; break;
      case 'trail': RUN.compThreads = RUN.compThreads || []; RUN.compThreads.push({ ax: x, ay: y, bx: cursorX(), by: cursorY(), t: dur, profile, name, trail: true }); break;
      case 'burst': burst(x + Math.cos(ang) * 80, y + Math.sin(ang) * 80, 72 + tr.halogens * 8, dmg * (1.9 + tr.oxidizer * .3), 80 + tr.metal * 10); break;
      case 'charge': p._compoundCharge = { t: dur, stacks: 0, profile }; break;
      case 'split': pushBullet(p, ang, ps * 1.65, dmg * 1.45, 6, 1.5, { compound: name, splitRecipe: 2 + (h % 2) }); break;
      case 'trap': RUN.compMines = RUN.compMines || []; RUN.compMines.push({ x: cursorX(), y: cursorY(), t: dur, owner: p.id, compound: name, profile }); break;
      case 'cleanse': { allies(p).forEach(q => { q.puTimer = 0; q._compoundCleanse = 2; }); p.puTimer = 0; p._compoundCleanse = 2; ring(x, y, 100, 140); break; }
      case 'mark': { const e = nearest(x, y); if (e) e.compMark = { t: dur, stacks: 0, profile, name }; break; }
      case 'beam': pushBullet(p, ang, ps * 2.3, dmg * 1.6, 3, .9, { compound: name, beam: true, pierce: 4 }); break;
      case 'thread': RUN.compThreads = RUN.compThreads || []; RUN.compThreads.push({ ax: x, ay: y, bx: cursorX(), by: cursorY(), t: dur, profile, name, thread: true }); break;
      case 'detonate': { const e = nearest(x, y); if (e) e.compDet = { t: 2.4, dmg: dmg * 2.2, profile, name }; break; }
      case 'debuff': { const e = nearest(x, y); if (e) { e.compDebuff = { t: dur, profile, name }; e.puTimer = 0; } break; }
      case 'stealth': p._compoundStealth = dur; break;
      case 'wave': { RUN.compThreads = RUN.compThreads || []; RUN.compThreads.push({ ax: x, ay: y, bx: x + Math.cos(ang) * 220, by: y + Math.sin(ang) * 220, t: 1.6, profile, name, wave: true }); break; }
      case 'cone': for (let k = -2; k <= 2; k++)pushBullet(p, ang + k * .11, ps * 1.25, dmg * .8, 4, 1.1, { compound: name, cone: true }); break;
      case 'rain': for (let k = 0; k < 4; k++) { const a = ang + (k - .5) * .6; setTimeout(() => { if (RUN) burst(Math.max(25, Math.min(W - 25, x + Math.cos(a) * 140)), Math.max(25, Math.min(H - 25, y + Math.sin(a) * 140)), 55, dmg * (1.1 + k * .12), 35); }, k * 150); } break;
      case 'implode': { const tx = cursorX(), ty = cursorY(); RUN.wells = RUN.wells || []; RUN.wells.push({ x: tx, y: ty, r: 110, t: 1.4, lv: 3.5, compound: name }); setTimeout(() => { if (RUN) burst(tx, ty, 120, dmg * 2.0, 110); }, 1400); break; }
      case 'lattice': RUN.compFields = RUN.compFields || []; for (let i = 0; i < 4; i++)RUN.compFields.push({ x: x + Math.cos(i * TAU / 4) * 70, y: y + Math.sin(i * TAU / 4) * 70, r: 38, t: dur, lattice: true, profile, name }); break;
      case 'relay': { const as = allies(p); if (as[0]) { as[0]._compoundRelay = { t: dur, source: name }; } p._compoundRelay = { t: dur, source: name }; break; }
      case 'volley': for (let k = 0; k < 4; k++)setTimeout(() => pushBullet(p, ang + (k - 1.5) * .08, ps * (1.15 + k * .12), dmg * (.85 + k * .12), 4, 1.3, { compound: name, volley: true }), k * 120); break;
      case 'prism': for (let k = 0; k < 3; k++)pushBullet(p, ang + (k - 1) * .24, ps * (1.25 + k * .14), dmg * (.9 + k * .14), 4, 1.2, { compound: name, prism: k }); break;
      case 'wall': RUN.compThreads = RUN.compThreads || []; RUN.compThreads.push({ ax: cursorX() - Math.cos(ang) * 90, ay: cursorY() - Math.sin(ang) * 90, bx: cursorX() + Math.cos(ang) * 90, by: cursorY() + Math.sin(ang) * 90, t: dur, wall: true, profile, name }); break;
      case 'line': RUN.compThreads = RUN.compThreads || []; RUN.compThreads.push({ ax: x, ay: y, bx: cursorX(), by: cursorY(), t: dur, reactive: true, profile, name, line: true }); break;
      case 'bridge': p.x = Math.max(25, Math.min(W - 25, x + Math.cos(ang) * 150)); p.y = Math.max(25, Math.min(H - 25, y + Math.sin(ang) * 150)); p.iframes = Math.max(p.iframes || 0, .9); break;
      case 'cage': { const e = nearest(x, y); if (e) e.compCage = { t: dur, r: 65, profile, name }; break; }
      case 'root': { const e = nearest(x, y); if (e) e.root = 1.3 + (h % 3) * .2; break; }
      case 'pulse': burst(x, y, range, dmg * (.75 + tr.ionic * .25), 35); break;
      case 'echo': RUN.compEcho = RUN.compEcho || []; RUN.compEcho.push({ x, y, a: ang, t: 1.1, owner: p.id, compound: name, delay: .9 + (h % 3) * .15 }); break;
      case 'spiral': for (let k = -1; k <= 1; k++)pushBullet(p, ang + k * .14, ps * 1.45, dmg * 1.08, 4, 1.5, { compound: name, spiral: true }); break;
      case 'memory': p._compoundMemory = { t: dur, profile, name, last: null }; break;
      case 'link': { const a = allies(p)[0]; if (a) { p._compoundLink = { t: dur, target: a.id }; a._compoundLinked = { t: dur, target: p.id }; } break; }
      case 'heal': { p.hp = Math.min(stat(p, 'hp', 120), p.hp + stat(p, 'hp', 120) * .14); const a = allies(p)[0]; if (a) a.hp = Math.min(stat(a, 'hp', 120), a.hp + stat(a, 'hp', 120) * .1); ring(x, y, 110, 180); break; }
      case 'cascade': for (let k = 0; k < 5; k++)pushBullet(p, ang + (k - 2) * .09, ps * 1.28, dmg * .55, 4, 1.25, { compound: name, cascade: true }); break;
      case 'flash': { burst(x, y, 55, dmg * .7, 10); const e = enemies().sort((a, b) => (a.x - x) ** 2 + (a.y - y) ** 2 - (b.x - x) ** 2 - (b.y - y) ** 2)[0]; if (e) e._blind = 1.6; break; }
      case 'focus': { const e = nearest(x, y); if (e) e.compFocus = { t: dur, owner: p.id, mult: 1.35, compound: name }; break; }
      case 'support': { buff(p, 1.15, 1.12, 5, 8); allies(p).slice(0, 2).forEach(a => buff(a, 1.12, 1.1, 5, 8)); break; }
      case 'stealth': p._compoundStealth = dur; break;
      case 'transition': p.iframes = Math.max(p.iframes || 0, 1.1); p.x = Math.max(25, Math.min(W - 25, x + Math.cos(ang) * 140)); p.y = Math.max(25, Math.min(H - 25, y + Math.sin(ang) * 140)); RUN.compThreads = RUN.compThreads || []; RUN.compThreads.push({ ax: x, ay: y, bx: p.x, by: p.y, t: 2.5, transition: true, profile, name }); break;
      case 'reserve': p._compoundReserve = { t: dur, charge: 0, profile, name }; break;
      default: burst(x, y, 60, dmg, 25); break;
    }
  }

  const audit = [], manifest = [];
  Object.keys(mol).forEach(function (k) {
    const m = mol[k]; if (!m || !m.mol || m.rx !== 'Real compound') return;
    const name = m.name || k, formula = m.f || '', profile = profileFor(name, formula), h = hash(name + '|' + formula), picks = chooseArchetypes(profile, h, h % 97);
    const used = new Set();
    m.choices = picks.map(function (archetype, slot) {
      // Guaranteed unique key, label and mechanic recipe per compound slot.
      let flavor = (FIT[profile] || FIT.general)[(h + slot * 3) % ((FIT[profile] || FIT.general).length)];
      const baseFlavors = FIT[profile] || FIT.general;
      if (used.has(flavor)) { flavor = baseFlavors.find(x => !used.has(x)) || flavor; }
      used.add(flavor);
      const id = m.id + '_fusion' + slot + '_' + hash(name + '|' + formula + '|' + slot + '|' + archetype).toString(16);
      const abilityName = name + ' — ' + flavor;
      const desc = 'Custom ' + name + ' ability: ' + (slot === 0 ? 'primary chemical expression.' : slot === 1 ? 'secondary reaction or control expression.' : 'tertiary tactical expression.') + ' Its geometry, timing, scaling and status effects are tuned to ' + formula + ' and its ' + profile + ' chemistry family.';
      const seed = hash(id);
      const choice = { id, key: 'fusion_' + hash(id).toString(16), slot, ic: ['✦', '◆', '◈'][slot], name: abilityName, desc, main: slot === 0, power: 1 + (seed % 9) * .045, archetype, profile, formula, exec: function (p) { abilityFor(profile, archetype, p, seed, slot, name, formula); } };
      manifest.push({ compound: name, formula, slot: slot + 1, name: abilityName, profile, archetype, description: desc });
      return choice;
    });
    // Explicit Creatine support identity.
    if (profile === 'creatine') {
      const c = m.choices;
      c[0].name = name + ' — Creatine Squad Surge'; c[0].desc = 'Buff yourself and every ally with damage, fire-rate, shield and regeneration.';
      c[1].name = name + ' — Phosphocreatine Relay'; c[1].desc = 'Restore ally active cooldown and shield, then grant yourself a smaller recovery boost.';
      c[2].name = name + ' — Muscle Reserve'; c[2].desc = 'Store movement energy and release it as speed and armor for nearby allies.';
    }
    m.act = m.choices[0]; m.signatures = m.choices;
    audit.push({ name, formula, profile, count: 3, uniqueIds: new Set(m.choices.map(x => x.key)).size === 3, uniqueArchetypes: new Set(m.choices.map(x => x.archetype)).size === 3 });
  });

  DATA.compoundSemanticProfiles = audit;
  DATA.compoundSemanticCount = audit.length;
  DATA.compoundSemanticUnique = audit.filter(x => x.uniqueIds && x.uniqueArchetypes).length;
  DATA.compoundAbilityManifest = manifest;
  DATA.compoundAbilityAudit = function () { return DATA.compoundSemanticProfiles.slice(); };
  console.log('ISO_REAL_COMPOUND_SEMANTIC_V4:', audit.length, 'real compounds;', manifest.length, 'custom abilities;', DATA.compoundSemanticUnique, 'compounds with 3 distinct mechanic recipes');
})();
