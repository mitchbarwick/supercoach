// Emergency first-aid guidance for common football injuries.
// Content follows widely-taught first-aid principles (Football Australia/St John Ambulance style):
// "If in doubt, sit them out" and "when unsure, call for professional help".
// This is guidance for coaches, NOT a substitute for medical training or care.

export const INJURY_CATEGORIES = [
  { id: 'head', label: 'Head & face', emoji: '🧠' },
  { id: 'leg', label: 'Legs & feet', emoji: '🦵' },
  { id: 'arm', label: 'Arms & shoulders', emoji: '💪' },
  { id: 'body', label: 'Body & back', emoji: '🫁' },
  { id: 'medical', label: 'Medical & other', emoji: '🩺' },
]

// severity: 'urgent' = treat as potentially serious every time
//           'caution' = usually manageable pitch-side but needs care
//           'minor'  = common knocks, still follow the steps
export const INJURIES = [
  {
    id: 'concussion',
    name: 'Head knock / suspected concussion',
    emoji: '🧠',
    category: 'head',
    severity: 'urgent',
    blurb: 'Any blow to the head, even without loss of consciousness.',
    callEmergencyIf: [
      'They were knocked out, even briefly, or had a seizure or fit',
      'Neck pain, or tingling / weakness in arms or legs',
      'Vomiting more than once, or a headache that keeps getting worse',
      'Increasing confusion, unusual drowsiness, or slurred speech',
      'Double vision, or unequal pupil sizes',
      'Clear fluid or blood coming from the ears or nose',
    ],
    assess: [
      'Ask simple questions: "Where are we? What\'s the score? Which half is it?" — wrong or slow answers are a red flag',
      'Look for a blank or vacant stare, unsteadiness, or holding their head',
      'Ask how they feel: headache, dizziness, nausea, "just not right" all count as symptoms',
      'Remember symptoms can appear 24–48 hours later — a player who seems fine now is not cleared',
    ],
    doNow: [
      'Remove them from play immediately — no exceptions',
      'Sit them somewhere quiet with an adult watching them the whole time',
      'Tell their parent or carer exactly what happened and what to watch for overnight',
      'Recommend they see a doctor today, even if symptoms seem mild',
    ],
    dont: [
      'Do NOT let them return to play today, even if they say they feel fine — "if in doubt, sit them out"',
      'Do NOT leave them alone, including in a car or changing room',
      'Do NOT give ibuprofen or aspirin in the first hours — it can mask symptoms and increase bleeding risk',
      'Do NOT let them head a ball or resume contact training until cleared',
    ],
    aftercare: [
      'Minimum 24–48 hours of complete rest from sport',
      'Return to play must follow a graduated protocol (light exercise → training → contact → match), each stage symptom-free',
      'Young players should be cleared by a doctor before returning to matches',
    ],
  },
  {
    id: 'neck-back',
    name: 'Neck or back injury',
    emoji: '🦴',
    category: 'body',
    severity: 'urgent',
    blurb: 'Suspected spinal injury after a fall, collision or awkward landing.',
    callEmergencyIf: [
      'Any neck or back pain after a collision, fall or heavy landing',
      'Tingling, numbness or weakness in arms or legs',
      'They cannot move part of their body',
      'They were knocked out or are drowsy or confused',
    ],
    assess: [
      'Treat any significant neck or back pain after impact as a spinal injury until proven otherwise',
      'Ask if they can feel and gently wiggle their fingers and toes — do not ask them to move anything else',
      'Check they are breathing normally and responding to you',
    ],
    doNow: [
      'Call emergency services first — this is not a "wait and see" injury',
      'Tell them to stay completely still; kneel behind their head and steady it with both hands in the position found',
      'Keep them warm with jackets or blankets and talk calmly until help arrives',
      'If they are unresponsive and NOT breathing normally, start CPR — keeping the airway open takes priority over the spine',
    ],
    dont: [
      'Do NOT move them, sit them up, or let them "walk it off"',
      'Do NOT remove their boots, shin pads or helmet-style headgear',
      'Do NOT let teammates crowd around or move the player',
    ],
    aftercare: [
      'This is a hospital assessment every time — there is no pitch-side clearance for a suspected spinal injury',
    ],
  },
  {
    id: 'collapse',
    name: 'Collapse / unresponsive player',
    emoji: '⚠️',
    category: 'medical',
    severity: 'urgent',
    blurb: 'A player collapses, especially without contact — treat as cardiac until proven otherwise.',
    callEmergencyIf: [
      'They do not respond when you talk to them and gently squeeze their shoulders',
      'They are not breathing, or breathing is noisy, gasping or abnormal',
      'They collapsed without any contact or obvious cause',
    ],
    assess: [
      'Check response: talk loudly and squeeze their shoulders — "Can you hear me? Open your eyes"',
      'Open the airway (head tilt, chin lift) and look, listen and feel for normal breathing for up to 10 seconds',
      'Gasping or irregular breaths are NOT normal breathing — treat as cardiac arrest',
    ],
    doNow: [
      'Shout for help, call emergency services on speakerphone, and send someone to fetch the nearest defibrillator (AED) immediately',
      'Not breathing normally: start chest compressions — hard and fast in the centre of the chest, about 2 per second — and follow the AED\'s voice instructions as soon as it arrives',
      'Breathing but unresponsive: roll them into the recovery position (on their side, head tilted back) and monitor breathing constantly',
      'Keep everyone else well back and send someone to the entrance to guide the ambulance in',
    ],
    dont: [
      'Do NOT assume it is just fainting if there was no contact — sudden cardiac events happen in young athletes',
      'Do NOT give food or water',
      'Do NOT stop CPR until help arrives, an AED tells you to, or they start breathing normally',
    ],
    aftercare: [
      'Any player who collapses without contact needs a cardiac assessment before returning to sport — no exceptions',
    ],
  },
  {
    id: 'ankle',
    name: 'Rolled / sprained ankle',
    emoji: '🦶',
    category: 'leg',
    severity: 'caution',
    blurb: 'Ankle turned over in a tackle, landing or change of direction.',
    callEmergencyIf: [
      'The ankle or foot looks visibly deformed or is pointing the wrong way',
      'Bone is visible or the skin is broken over the injury',
      'The foot is cold, blue or numb',
    ],
    assess: [
      'Compare with the other ankle — rapid ballooning swelling suggests a worse injury',
      'Ask them to wiggle their toes, then gently try putting weight on it after a couple of minutes',
      'Unable to take four steps, or pain directly on the ankle bones (not just the soft tissue)? Treat as a possible fracture and get an X-ray',
    ],
    doNow: [
      'Get them off the pitch — no hopping back on to "test it"',
      'Ice wrapped in a cloth for 15–20 minutes (never directly on skin)',
      'Elevate the leg above hip level and apply a compression bandage if you have one',
      'Loosen or remove the boot early, before swelling makes it difficult',
    ],
    dont: [
      'Do NOT let them "run it off" — playing on turns a mild sprain into a bad one',
      'Do NOT apply heat, massage or let them have a hot bath in the first 48–72 hours — it increases swelling',
      'Do NOT strap it tightly and send them back on',
    ],
    aftercare: [
      'Rest, ice, compression and elevation for 48–72 hours',
      'See a doctor or physio if they still can\'t weight-bear comfortably after 2–3 days',
      'Return to training only when they can hop and change direction pain-free',
    ],
  },
  {
    id: 'knee',
    name: 'Twisted knee',
    emoji: '🦵',
    category: 'leg',
    severity: 'caution',
    blurb: 'Knee twisted in a tackle, turn or awkward landing.',
    callEmergencyIf: [
      'The kneecap or knee is visibly out of place or deformed',
      'The leg below the knee is cold, pale or numb',
      'Pain is severe and unmanageable',
    ],
    assess: [
      'A loud "pop" at the moment of injury plus swelling within the first hour suggests a significant ligament injury (e.g. ACL)',
      'Ask if the knee feels like it will "give way" when they stand',
      'A knee that is locked and cannot straighten needs medical review — do not force it',
      'Can they walk without a limp? If not, they are done for the day',
    ],
    doNow: [
      'Help them off without weight on the leg if it feels unstable',
      'Ice wrapped in a cloth for 15–20 minutes, elevate, and support the knee in a comfortable position',
      'Compression bandage if available',
    ],
    dont: [
      'Do NOT force a locked knee straight',
      'Do NOT let them return to play in the same session, even if pain settles',
      'Do NOT ignore rapid swelling — that is bleeding inside the joint',
    ],
    aftercare: [
      'Any pop, rapid swelling, instability or locking needs a doctor or physio assessment',
      'Minor twinges: 48 hours of rest and ice, then gradual return if pain-free',
    ],
  },
  {
    id: 'hamstring',
    name: 'Hamstring strain',
    emoji: '🏃',
    category: 'leg',
    severity: 'caution',
    blurb: 'Sudden pain in the back of the thigh, usually mid-sprint.',
    callEmergencyIf: [
      'A visible lump or gap in the back of the thigh with severe pain',
      'They cannot walk at all',
    ],
    assess: [
      'A sudden sharp pain that stopped them mid-sprint suggests a genuine tear; a gradual tightening is more likely cramp or a mild strain',
      'Gently ask them to bend the knee against light resistance — sharp pain means they are done for the day',
      'Bruising appearing over the next day or two indicates a more significant tear',
    ],
    doNow: [
      'Stop them playing immediately — hamstrings that are "run off" tear further',
      'Ice wrapped in a cloth for 15–20 minutes and elevate the leg',
      'Gentle compression with a bandage if available',
    ],
    dont: [
      'Do NOT stretch the hamstring aggressively straight after injury',
      'Do NOT apply heat or massage in the first 48–72 hours',
      'Do NOT let them sprint again today, even if it eases off',
    ],
    aftercare: [
      'Mild strains settle over 1–3 weeks; return only when they can sprint pain-free',
      'Recurring hamstring injuries need a physio-guided strengthening programme',
    ],
  },
  {
    id: 'calf',
    name: 'Calf strain',
    emoji: '🦿',
    category: 'leg',
    severity: 'caution',
    blurb: 'Sharp pain in the calf when pushing off or jumping.',
    callEmergencyIf: [
      'A sudden "snap" at the back of the ankle and they cannot push the foot down at all (possible Achilles rupture)',
      'The calf is hot, swollen and painful without any injury happening',
    ],
    assess: [
      'Players often describe it as being "kicked" or "shot" in the calf even when nobody touched them — that suggests a real tear',
      'Ask them to rise up on tiptoes on the injured leg; sharp pain or inability means they are done for the day',
    ],
    doNow: [
      'Stop play, ice wrapped in a cloth for 15–20 minutes, elevate',
      'A heel raise in the shoe can ease walking discomfort afterwards',
    ],
    dont: [
      'Do NOT stretch it hard immediately after injury',
      'Do NOT apply heat or massage for 48–72 hours',
      'Do NOT let them play on through a limp',
    ],
    aftercare: [
      'Most calf strains settle in 1–3 weeks with gradual loading',
      'Return when they can hop and push off pain-free',
    ],
  },
  {
    id: 'groin',
    name: 'Groin strain',
    emoji: '🩳',
    category: 'leg',
    severity: 'caution',
    blurb: 'Pain in the inner thigh after a stretch, tackle or shot.',
    callEmergencyIf: [
      'Severe pain with a visible lump or major swelling',
      'Pain in the lower abdomen with vomiting (needs medical review)',
    ],
    assess: [
      'Pain when squeezing the knees together against resistance points to a groin (adductor) strain',
      'A twinge they can walk off is different from a sharp stab that stopped them — the latter ends their session',
    ],
    doNow: [
      'Rest, ice wrapped in a cloth for 15–20 minutes',
      'Let them walk gently if comfortable — total immobility isn\'t needed for mild strains',
    ],
    dont: [
      'Do NOT let them take long-range shots or sprint again today',
      'Do NOT stretch aggressively in the first days',
    ],
    aftercare: [
      'Gradual return over 1–3 weeks as pain allows',
      'Groin pain that keeps returning needs a physio assessment',
    ],
  },
  {
    id: 'dead-leg',
    name: 'Dead leg (thigh knock)',
    emoji: '🥊',
    category: 'leg',
    severity: 'caution',
    blurb: 'A knee or boot into the thigh muscle — a quad contusion.',
    callEmergencyIf: [
      'The thigh becomes very swollen, hard and increasingly painful over time',
      'Numbness or pins and needles below the injury',
      'They cannot bend the knee past 45 degrees',
    ],
    assess: [
      'Most dead legs ease over a few minutes; ones that get worse are the concern',
      'Check how far they can gently bend the knee — very limited bend suggests significant bleeding in the muscle',
    ],
    doNow: [
      'Off the pitch, ice wrapped in a cloth for 15–20 minutes',
      'Rest the leg with the knee gently bent, not forced straight',
      'Light compression bandage if available',
    ],
    dont: [
      'Do NOT massage the muscle deeply or apply heat for at least 48 hours — it worsens bleeding in the muscle',
      'Do NOT let them play on if they cannot jog without a limp',
      'Do NOT stretch the quad hard on day one',
    ],
    aftercare: [
      'Gentle movement within comfort helps recovery; most settle in a few days',
      'Worsening pain, hardness or restricted knee bend over 24 hours needs a doctor',
    ],
  },
  {
    id: 'cramp',
    name: 'Muscle cramp',
    emoji: '⚡',
    category: 'leg',
    severity: 'minor',
    blurb: 'Sudden painful tightening, usually calf or hamstring, late in a session.',
    callEmergencyIf: [
      'Cramp with confusion, very hot skin or collapse (possible heat illness)',
      'Repeated severe cramping all over the body',
    ],
    assess: [
      'Classic cramp releases with a gentle stretch within a minute or two',
      'Pain that persists after the muscle relaxes may actually be a strain — treat it as one',
    ],
    doNow: [
      'Gently stretch the muscle: for calf cramp, straighten the leg and ease the toes towards the shin',
      'Hold the stretch until it releases, then light massage',
      'Get fluids into them and let them rest a few minutes before rejoining',
    ],
    dont: [
      'Do NOT yank the stretch hard or bounce it',
      'Do NOT send them straight back to sprinting the moment it releases',
    ],
    aftercare: [
      'They can usually rejoin the session once it fully releases and they can jog comfortably',
      'Frequent cramping: look at hydration, sleep and whether session intensity ramps up too fast',
    ],
  },
  {
    id: 'winded',
    name: 'Winded (blow to the stomach)',
    emoji: '💨',
    category: 'body',
    severity: 'caution',
    blurb: 'Ball or elbow to the belly — breath knocked out of them.',
    callEmergencyIf: [
      'Breathing does not return to normal within a few minutes',
      'Severe or worsening tummy pain, a rigid abdomen, or vomiting after the blow',
      'They cough up blood or become pale, clammy and faint',
    ],
    assess: [
      'Being winded is frightening but usually passes in 1–2 minutes',
      'Once breathing settles, gently press their tummy — significant pain or guarding needs medical review',
    ],
    doNow: [
      'Stay calm and reassure them — panic makes it worse',
      'Sit them in a crouch or sit them up leaning slightly forward, and loosen tight clothing',
      'Coach slow breaths: "smell the flowers, blow out the candles"',
    ],
    dont: [
      'Do NOT crowd them — give them space and air',
      'Do NOT lift their arms over their head or lie them flat on their back (old myths that don\'t help)',
      'Do NOT rush them back on before breathing is fully comfortable',
    ],
    aftercare: [
      'Most players rejoin within 5–10 minutes once comfortable',
      'Any ongoing tummy pain after the session needs checking — organs can bruise',
    ],
  },
  {
    id: 'fracture',
    name: 'Suspected broken bone',
    emoji: '🦴',
    category: 'arm',
    severity: 'urgent',
    blurb: 'Possible fracture of an arm or leg after impact or a fall.',
    callEmergencyIf: [
      'The limb looks bent, deformed or the wrong shape',
      'Bone is visible or has broken the skin',
      'The limb below the injury is pale, cold or numb',
      'It is a suspected broken leg or thigh — do not transport these yourself',
    ],
    assess: [
      'A crack heard or felt, rapid swelling, and refusal to use the limb all point to a fracture',
      'Children\'s bones can break without dramatic deformity — a child who won\'t use an arm or leg after impact needs an X-ray',
    ],
    doNow: [
      'Keep the player still and support the limb in the position you found it — use rolled towels or clothing',
      'For an arm, they can support it against their body; a sling helps if you\'re trained to apply one',
      'Ice around (not on) the injured area, wrapped in cloth',
      'Keep them warm and calm — shock is common',
    ],
    dont: [
      'Do NOT try to straighten or realign the limb',
      'Do NOT move them unnecessarily, especially with a leg injury',
      'Do NOT give food or drink — they may need surgery',
      'Do NOT remove the boot if a lower-leg fracture is suspected',
    ],
    aftercare: [
      'Every suspected fracture goes to hospital for an X-ray, even "it\'s probably just a sprain" ones in children',
    ],
  },
  {
    id: 'shoulder',
    name: 'Dislocated shoulder',
    emoji: '💪',
    category: 'arm',
    severity: 'urgent',
    blurb: 'Shoulder popped out after a fall on an outstretched arm.',
    callEmergencyIf: [
      'The shoulder looks visibly deformed, squared-off or dropped',
      'The arm is numb, tingling, pale or cold',
      'Severe pain that isn\'t settling',
    ],
    assess: [
      'The player typically holds the arm away from the body and refuses to move it',
      'Compare both shoulders from the front — a dislocated one loses its rounded shape',
    ],
    doNow: [
      'Let them support the arm in the most comfortable position — usually cradled against the body',
      'Pad between the arm and chest with a folded jumper',
      'Ice wrapped in cloth around the shoulder for pain',
      'Get them to hospital — a dislocation needs professional reduction',
    ],
    dont: [
      'Do NOT try to pop it back in — ever. You can tear nerves and blood vessels',
      'Do NOT strap the arm tightly or force it into a sling position it doesn\'t want to go',
      'Do NOT give food or drink in case sedation is needed at hospital',
    ],
    aftercare: [
      'After relocation at hospital, expect several weeks out and physio before return',
      'First-time dislocations in young players need specialist follow-up — they recur easily',
    ],
  },
  {
    id: 'finger-wrist',
    name: 'Finger or wrist injury',
    emoji: '🖐️',
    category: 'arm',
    severity: 'caution',
    blurb: 'Jammed finger or a fall onto the hand — common for goalkeepers.',
    callEmergencyIf: [
      'A finger or the wrist is visibly deformed or pointing the wrong way',
      'The skin is broken over a suspected break',
      'Fingers are numb, white or blue',
    ],
    assess: [
      'Rapid swelling, bruising and refusal to grip suggest more than a sprain',
      'In children, wrist pain after a fall on an outstretched hand is a fracture until an X-ray says otherwise — growth plates break easily',
    ],
    doNow: [
      'Remove rings and watches immediately, before swelling starts',
      'Ice wrapped in cloth for 15–20 minutes, elevate the hand above the heart',
      'Support the wrist against the body in a comfortable position',
    ],
    dont: [
      'Do NOT pull or "crack" a jammed finger back into place',
      'Do NOT strap a swollen deformed finger to its neighbour and play on',
      'Do NOT dismiss a child\'s wrist pain as "just a sprain"',
    ],
    aftercare: [
      'Persistent pain, swelling or weak grip after 24–48 hours needs an X-ray',
      'A simple jammed finger can be buddy-strapped for training once a fracture is ruled out',
    ],
  },
  {
    id: 'nosebleed',
    name: 'Nosebleed',
    emoji: '🩸',
    category: 'head',
    severity: 'minor',
    blurb: 'Ball or elbow to the face, or a spontaneous bleed.',
    callEmergencyIf: [
      'Bleeding hasn\'t stopped after 20–30 minutes of correct pressure',
      'The nose looks bent or deformed after impact',
      'It follows a heavy head knock, or the fluid is thin, clear and watery',
    ],
    assess: [
      'Most nosebleeds stop within 10 minutes with the right technique',
      'If it came from a head impact, also run the concussion checks',
    ],
    doNow: [
      'Sit them down, leaning FORWARD',
      'Pinch the soft part of the nose (just below the bone) firmly for 10 minutes without peeking',
      'Cold compress on the bridge of the nose helps',
      'Wear gloves if you have them; have them spit out blood rather than swallow it',
    ],
    dont: [
      'Do NOT tip the head back — blood runs down the throat and causes vomiting',
      'Do NOT stuff tissue or cotton wool up the nostril',
      'Do NOT let them blow their nose for a few hours after it stops',
    ],
    aftercare: [
      'Once fully stopped for 10+ minutes and they feel fine, they can usually return to play',
      'Repeated unexplained nosebleeds are one for the GP',
    ],
  },
  {
    id: 'cuts',
    name: 'Cuts & grazes',
    emoji: '🩹',
    category: 'medical',
    severity: 'minor',
    blurb: 'Studs, falls and turf burns — bleeding must be dealt with before play continues.',
    callEmergencyIf: [
      'Blood is spurting or pumping from the wound',
      'Bleeding won\'t stop after 10 minutes of firm, direct pressure',
      'The wound is deep, gaping, or has something embedded in it',
    ],
    assess: [
      'A wound with edges that gape apart when relaxed will likely need closing (glue, strips or stitches) — ideally within hours',
      'Deep wounds from studs or dirty surfaces carry infection risk',
    ],
    doNow: [
      'Put on gloves from your first-aid kit',
      'Rinse dirt out with clean running water',
      'Press firmly on the wound with a clean dressing until bleeding stops, then dress it',
      'A bleeding player must leave the pitch until the bleeding is stopped and covered',
    ],
    dont: [
      'Do NOT pull out an embedded object — pad around it and get medical help',
      'Do NOT use dirty water or share bloodied towels between players',
      'Do NOT let them play on with an uncovered bleeding wound',
    ],
    aftercare: [
      'Check their tetanus cover is up to date for dirty wounds',
      'Watch over the next days for spreading redness, heat or pus — signs of infection',
    ],
  },
  {
    id: 'eye',
    name: 'Blow to the eye',
    emoji: '👁️',
    category: 'head',
    severity: 'caution',
    blurb: 'Ball, finger or elbow to the eye.',
    callEmergencyIf: [
      'Any loss of vision, blurring or double vision',
      'Blood visible in the coloured part of the eye',
      'Something is embedded in the eye',
      'They can\'t move the eye normally in all directions, or the eye looks sunken',
    ],
    assess: [
      'Cover the good eye and ask what they can see through the injured one — compare with the other side',
      'Ask them to follow your finger up, down, left and right without moving their head',
      'A simple watering, red eye that sees normally is usually fine to monitor',
    ],
    doNow: [
      'Sit them down and apply a cold compress gently around the eye socket — not pressing on the eyeball',
      'If something is embedded, cover the eye loosely (a paper cup taped over it works) and go straight to hospital',
      'For chemicals or grit, rinse with clean water for several minutes',
    ],
    dont: [
      'Do NOT let them rub the eye',
      'Do NOT press on the eyeball itself',
      'Do NOT try to remove anything embedded in the eye',
    ],
    aftercare: [
      'Vision fully normal and pain settling: monitor for 24 hours',
      'Any change in vision, growing pain or a visibly abnormal pupil means same-day medical review',
    ],
  },
  {
    id: 'dental',
    name: 'Dental injury / knocked-out tooth',
    emoji: '🦷',
    category: 'head',
    severity: 'caution',
    blurb: 'Tooth knocked loose, broken, or out entirely.',
    callEmergencyIf: [
      'The jaw may be broken — it looks misaligned or they can\'t close their mouth normally',
      'There was a heavy head impact — run the concussion checks too',
      'Bleeding from the mouth that won\'t stop with pressure',
    ],
    assess: [
      'Find the tooth. Time matters: a knocked-out ADULT tooth has the best survival if re-implanted within 30–60 minutes',
      'Baby (milk) teeth are never re-implanted — but the child should still see a dentist',
    ],
    doNow: [
      'Pick the tooth up by the crown (the white bit) — never the root',
      'If dirty, rinse briefly in milk or saline — a few seconds only',
      'Adult tooth: push it gently back into its socket if the player allows, and have them bite on clean gauze. If not possible, store it in milk (or inside their cheek if old enough not to swallow it)',
      'Get to a dentist urgently — within the hour if possible',
      'Bite on a rolled clean dressing to control socket bleeding',
    ],
    dont: [
      'Do NOT scrub the tooth or clean it with water and soap — it kills the root cells',
      'Do NOT store the tooth in water or wrapped in tissue — milk is the right answer',
      'Do NOT re-implant a baby tooth — it can damage the adult tooth underneath',
    ],
    aftercare: [
      'Dentist follow-up even for teeth that seem fine — damage can show up later',
      'A fitted mouthguard is the best prevention going forward',
    ],
  },
  {
    id: 'asthma',
    name: 'Asthma attack / breathing difficulty',
    emoji: '🫁',
    category: 'medical',
    severity: 'urgent',
    blurb: 'Wheezing, coughing and struggling for breath during exercise.',
    callEmergencyIf: [
      'They have no reliever inhaler with them',
      'No improvement after 10 puffs of their reliever',
      'They can\'t finish a sentence in one breath, or their lips or fingertips look blue or grey',
      'They are becoming exhausted, quiet or drowsy — a quiet asthmatic is an emergency, not an improvement',
    ],
    assess: [
      'Wheeze, persistent cough, tight chest and struggling to speak are the classic signs',
      'Know in advance which of your players have asthma and where their inhalers are kept — check your registration forms',
    ],
    doNow: [
      'Stop them exercising and sit them UPRIGHT — leaning slightly forward on their hands can help',
      'Their own blue/reliever inhaler: 1 puff every 30–60 seconds, up to 10 puffs (use a spacer if they have one)',
      'Stay calm and coach slow, steady breathing',
      'If not improving after 10 puffs, call emergency services and repeat the 10 puffs while you wait',
    ],
    dont: [
      'Do NOT lie them down',
      'Do NOT leave them alone to "catch their breath"',
      'Do NOT assume it\'s just being unfit — a struggling breather gets treated as asthma',
    ],
    aftercare: [
      'Any attack needing more than a couple of puffs should be reported to parents and reviewed by their GP',
      'They should not rejoin the session after a significant attack, even if they recover',
    ],
  },
  {
    id: 'heat',
    name: 'Heat exhaustion / dehydration',
    emoji: '🌡️',
    category: 'medical',
    severity: 'caution',
    blurb: 'Overheating on hot days — headache, dizziness, cramps, exhaustion.',
    callEmergencyIf: [
      'They become confused, clumsy or behave strangely',
      'Their skin is hot and dry rather than sweaty, or they stop sweating',
      'They faint, vomit repeatedly, or don\'t improve within 30 minutes of cooling — this may be heatstroke, which is life-threatening',
    ],
    assess: [
      'Heat exhaustion: pale, sweaty, headache, dizzy, cramps, tired — uncomfortable but responds to cooling',
      'Heatstroke: hot skin, confusion, deteriorating consciousness — a 000 call, cool them aggressively while you wait',
    ],
    doNow: [
      'Stop them playing and move them to shade immediately',
      'Remove excess kit (shin pads, extra layers) and fan them',
      'Cool the skin with water — wet cloths on the neck, armpits and groin work well',
      'Small, regular sips of water or a sports drink once they can drink comfortably',
      'Lie them down with legs raised if they feel faint',
    ],
    dont: [
      'Do NOT send them back on once they "look better" — the session is over for them',
      'Do NOT leave them alone, including in a hot car',
      'Do NOT force large volumes of water down quickly',
    ],
    aftercare: [
      'Full recovery, rest and rehydration before any return to sport — usually not the same day',
      'On hot days: schedule drink breaks every 15–20 minutes and train in shade where possible',
    ],
  },
]

export const getInjury = (id) => INJURIES.find((i) => i.id === id)
